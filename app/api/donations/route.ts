import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { donationSchema } from "@/lib/validations/donation";
import { getSession } from "@/lib/auth";
import { NotificationType } from "@/app/generated/prisma";
import redis from "@/lib/redis";
import { checkRateLimit } from "@/lib/ratelimit";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "DONOR" && session.role !== "ADMIN")) {
      return NextResponse.json(
        { error: "Unauthorized. Only donors can create donations." },
        { status: 401 }
      );
    }

    // Rate Limiting: Limit to 10 donations per minute
    const rateLimit = await checkRateLimit(session.userId as string, 10, 60);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Slow down! You can only post 10 donations per minute." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const validatedData = donationSchema.parse(body);

    const donation = await prisma.foodDonation.create({
      data: {
        ...validatedData,
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
      await redis.geoadd(
        "donations:geo",
        donation.longitude,
        donation.latitude,
        donation.id
      );
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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const status = searchParams.get("status") || "AVAILABLE";
    const donorId = searchParams.get("donorId");
    const city = searchParams.get("city");
    const search = searchParams.get("search");

    const donations = await prisma.foodDonation.findMany({
      where: {
        status: status as any,
        ...(category && { category: category as any }),
        ...(donorId && { donorId }),
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
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // 2. If lat/lng and radius are provided, filter by proximity using Redis
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");
    const radius = searchParams.get("radius"); // in km

    if (lat && lng && radius) {
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
        donations.filter((d) => nearbyIds.includes(d.id))
      );
    }

    return NextResponse.json(donations);
  } catch (error) {
    console.error("Fetch donations error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
