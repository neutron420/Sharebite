import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { syncDonorAchievements } from "@/lib/achievements";

/**
 * GET /api/donor/profile
 * Returns full donor profile with karma, badges, stats, and account info.
 */
export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "DONOR") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const donorId = session.userId as string;

    await syncDonorAchievements(donorId);

    const user = await prisma.user.findUnique({
      where: { id: donorId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phoneNumber: true,
        address: true,
        city: true,
        state: true,
        district: true,
        pincode: true,
        imageUrl: true,
        donorType: true,
        isVerified: true,
        karmaPoints: true,
        level: true,
        strikeCount: true,
        createdAt: true,
        updatedAt: true,
        badges: {
          include: { badge: true },
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: {
            donations: true,
            reviewsReceived: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Calculate level progress
    const currentLevelKarma = (user.level - 1) * 500;
    const nextLevelKarma = user.level * 500;
    const levelProgress = Math.min(
      100,
      Math.round(
        ((user.karmaPoints - currentLevelKarma) /
          (nextLevelKarma - currentLevelKarma)) *
          100
      )
    );

    // Get total weight donated
    const weightResult = await prisma.foodDonation.aggregate({
      where: { donorId, status: "COLLECTED" },
      _sum: { weight: true },
    });

    // Get total badges available
    const totalBadges = await prisma.badge.count();

    return NextResponse.json({
      ...user,
      levelProgress,
      totalWeightDonated: weightResult._sum.weight || 0,
      totalDonations: user._count.donations,
      totalReviews: user._count.reviewsReceived,
      totalBadgesAvailable: totalBadges,
      earnedBadgesCount: user.badges.length,
    });
  } catch (error: any) {
    console.error("Profile fetch error:", error?.message);
    return NextResponse.json(
      { error: "Internal Server Error", details: error?.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getSession({ request });
    if (!session || session.role !== "DONOR") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const updates: Record<string, string | null> = {};
    const optionalFields = [
      "phoneNumber",
      "address",
      "city",
      "state",
      "district",
      "pincode",
      "imageUrl",
      "donorType",
    ] as const;

    if ("name" in body) {
      if (typeof body.name !== "string" || !body.name.trim()) {
        return NextResponse.json(
          { error: "Name cannot be empty" },
          { status: 400 }
        );
      }
      updates.name = body.name.trim();
    }

    for (const field of optionalFields) {
      if (field in body) {
        updates[field] =
          typeof body[field] === "string" && body[field].trim()
            ? body[field].trim()
            : null;
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No profile fields provided" },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.userId as string },
      data: updates,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phoneNumber: true,
        address: true,
        city: true,
        state: true,
        district: true,
        pincode: true,
        imageUrl: true,
        donorType: true,
        isVerified: true,
        karmaPoints: true,
        level: true,
        strikeCount: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error: any) {
    console.error("Profile update error:", error?.message);
    return NextResponse.json(
      { error: "Internal Server Error", details: error?.message },
      { status: 500 }
    );
  }
}
