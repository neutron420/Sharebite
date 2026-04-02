import { NextResponse } from "next/server";
import { ZodError } from "zod";
import prisma from "@/lib/prisma";
import { donationSchema } from "@/lib/validations/donation";
import { getSession } from "@/lib/auth";
import { NotificationType } from "@/app/generated/prisma";
import redis from "@/lib/redis";
import { withSecurity } from "@/lib/api-handler";
import { checkAndAwardBadges, awardDonationKarma } from "@/lib/achievements";
import { validateFoodImage } from "@/lib/vision";

async function postDonationHandler(request: Request) {
  try {
    const session = await getSession({ request });

    if (!session || (session.role !== "DONOR" && session.role !== "ADMIN")) {
      return NextResponse.json(
        { error: "Unauthorized. Only donors can create donations." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = donationSchema.parse(body);

    // AI-based Quality Control: Verify that the donor is actually posting food and it matches the category
    if (validatedData.imageUrl) {
      const isFood = await validateFoodImage(validatedData.imageUrl, validatedData.category);
      if (!isFood) {
        return NextResponse.json({ 
          error: "Image verification failed. The photo does not seem to be a clear picture of food. Please upload a proper picture of the donation." 
        }, { status: 400 });
      }
    }

    const donation = await prisma.foodDonation.create({
      data: {
        ...validatedData,
        description: validatedData.description || "",
        weight: validatedData.weight || 0,
        expiryTime: new Date(validatedData.expiryTime),
        pickupStartTime: new Date(validatedData.pickupStartTime),
        pickupEndTime: new Date(validatedData.pickupEndTime),
        donorId: session.userId as string,
        status: "AVAILABLE",
      },
    });

    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true }
    });

    const adminNotifications = admins.map(admin => ({
      userId: admin.id,
      type: NotificationType.SYSTEM,
      title: "New Donation Posted",
      message: `A new donation "${donation.title}" has been posted and needs oversight.`,
      link: `/admin/donations/${donation.id}`
    }));

    const nearbyNGOs = await prisma.user.findMany({
      where: {
        role: "NGO",
        isVerified: true,
        city: validatedData.city || "",
      },
      select: { id: true }
    });

    const ngoNotifications = nearbyNGOs.map(ngo => ({
      userId: ngo.id,
      type: NotificationType.NEW_DONATION,
      title: "Fresh Food Available Near You!",
      message: `"${donation.title}" was just posted in ${donation.pickupLocation}. Request it before it expires!`,
      link: `/donations/${donation.id}`
    }));

    if (adminNotifications.length > 0 || ngoNotifications.length > 0) {
      await prisma.notification.createMany({
        data: [...adminNotifications, ...ngoNotifications]
      });

      // TRIGGER WEBSOCKET RELAY: Live feed for NGOs and Admins
      try {
        const allTargetIds = [...adminNotifications, ...ngoNotifications].map(n => n.userId);
        const notifyUrl = (process.env.INTERNAL_WS_URL || 'http://localhost:8080').replace(':8081', ':8080') + '/notify';
        await Promise.all(allTargetIds.map(userId => 
          fetch(notifyUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: userId,
              notification: {
                type: "SYSTEM",
                title: "Live Mission Alert",
                message: `New donation "${donation.title}" just dropped in ${donation.city}. Ready for rescue?`,
                link: `/donations/${donation.id}`,
                createdAt: new Date().toISOString()
              }
            })
          }).catch(() => {})
        ));
      } catch (e) {
        console.error("WS Relay notification failed:", e);
      }
    }

    // 3. Add to Redis GEO for fast proximity searching
    if (donation.latitude && donation.longitude) {
      try {
        await redis.geoadd(
          "donations:geo",
          donation.longitude,
          donation.latitude,
          donation.id
        );
      } catch (e) {
        // Log but don't fail the request - database part is done
        console.error("Redis geoadd error:", e);
      }
    }

    // 4. Award Karma & Check Badge Achievements
    try {
      await awardDonationKarma(session.userId as string, validatedData.weight || 0);
      const newBadges = await checkAndAwardBadges(session.userId as string);
      if (newBadges.length > 0) {
        console.log(`[BADGES] Donor ${session.userId} unlocked: ${newBadges.join(", ")}`);
      }
    } catch (e) {
      console.error("Achievement check error:", e);
    }

    return NextResponse.json(donation, { status: 201 });
  } catch (error: any) {
    if (error.name === "ZodError" || error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues || error.errors },
        { status: 400 }
      );
    }

    console.error("Donation creation error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

async function getDonationsHandler(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const status = searchParams.get("status") || "AVAILABLE";
    const donorId = searchParams.get("donorId");
    const city = searchParams.get("city");
    const search = searchParams.get("search");
    const session = await getSession({ request });
    const now = new Date();

    // 🛡️ Live Expiry Sentinel: Auto-expire any stale AVAILABLE listings.
    await prisma.foodDonation.updateMany({
      where: {
        status: "AVAILABLE",
        expiryTime: { lt: now }
      },
      data: { status: "EXPIRED" }
    });

    const donations = await prisma.foodDonation.findMany({
      where: {
        ...(category && { category: category as any }),
        ...(city && { city }),
        ...(search && {
          title: { contains: search, mode: "insensitive" },
        }),
        // Case 1: Donor is looking at their own stuff (Show all states, No expiry filter)
        ...((donorId || (session?.role === "DONOR" && !search)) ? {
          donorId: donorId || (session?.userId as string)
        } : {
          // Case 2: Public View (NGOs/Riders) -> ONLY show AVAILABLE & NON-EXPIRED
          status: "AVAILABLE",
          expiryTime: { gt: now }
        })
      },
      include: {
        donor: {
          select: {
            name: true,
            city: true,
            imageUrl: true,
            donorType: true,
            latitude: true,
            longitude: true,
          },
        },
        requests: {
          include: {
            ngo: {
              select: {
                name: true,
                city: true,
                latitude: true,
                longitude: true,
              },
            },
            rider: {
              select: {
                name: true,
              },
            },
          },
        },
        reviews: {
          include: {
            reviewer: {
              select: {
                name: true,
                imageUrl: true,
                role: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const threeHoursFromNow = new Date(now.getTime() + 3 * 60 * 60 * 1000);

    const donationsWithUrgency = donations.map((donation: any) => ({
      ...donation,
      isUrgent: new Date(donation.expiryTime) <= threeHoursFromNow,
    }));

    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");
    const radius = searchParams.get("radius"); 

    if (lat && lng && radius) {
      try {
        const nearbyIds = await redis.geosearch(
          "donations:geo",
          "FROMLONLAT",
          parseFloat(lng),
          parseFloat(lat),
          "BYRADIUS",
          parseFloat(radius),
          "km"
        );

        return NextResponse.json(
          donationsWithUrgency.filter((d) => nearbyIds.includes(d.id))
        );
      } catch (e) {
        console.error("Redis geosearch error:", e);
        // Fallback: Return unsorted results if Redis is down
        return NextResponse.json(donationsWithUrgency);
      }
    }

    return NextResponse.json(donationsWithUrgency);
  } catch (error) {
    console.error("Fetch donations error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export const POST = withSecurity(postDonationHandler, { limit: 20 });
export const GET = withSecurity(getDonationsHandler, { limit: 120 });
