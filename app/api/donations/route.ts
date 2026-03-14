import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { donationSchema } from "@/lib/validations/donation";
import { getSession } from "@/lib/auth";
import { NotificationType } from "@/app/generated/prisma";
import redis from "@/lib/redis";
import { withSecurity } from "@/lib/api-handler";

async function postDonationHandler(request: Request) {
  try {
    const session = await getSession({ request });
    // RBAC check (Donors/Admins only)
    if (!session || (session.role !== "DONOR" && session.role !== "ADMIN")) {
      return NextResponse.json(
        { error: "Unauthorized. Only donors can create donations." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = donationSchema.parse(body);

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

    // 2. Notify all Verified NGOs in the same city
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

    return NextResponse.json(donation, { status: 201 });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
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

    console.log("[DONATIONS] Session:", { hasSession: !!session, role: session?.role, userId: session?.userId });

    // If donorId is provided or if user is a DONOR, we might want to show all their items (not just available ones)
    const effectiveStatus = (status === "AVAILABLE" && (donorId || session?.role === "DONOR")) ? undefined : status;

    const donations = await prisma.foodDonation.findMany({
      where: {
        ...(effectiveStatus && { status: effectiveStatus as any }),
        ...(category && { category: category as any }),
        ...((donorId || (session?.role === "DONOR" && !search)) && { donorId: donorId || (session?.userId as string) }),
        ...(city && { city }),
        ...(search && {
          title: {
            contains: search,
            mode: "insensitive",
          },
        }),
      },
      include: {
        donor: {
          select: {
            name: true,
            city: true,
            imageUrl: true,
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
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Add 'isUrgent' flag for food expiring in less than 3 hours
    const now = new Date();
    const threeHoursFromNow = new Date(now.getTime() + 3 * 60 * 60 * 1000);

    const donationsWithUrgency = donations.map((donation: any) => ({
      ...donation,
      isUrgent: new Date(donation.expiryTime) <= threeHoursFromNow,
    }));

    // 2. If lat/lng and radius are provided, filter by proximity using Redis
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");
    const radius = searchParams.get("radius"); // in km

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
