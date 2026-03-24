import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { syncDonorAchievements } from "@/lib/achievements";

/**
 * GET /api/donor/badges
 * Returns the donor's karma, level, and all badges (earned + locked).
 */
export async function GET(request: Request) {
  try {
    const session = await getSession({ request });
    if (!session || session.role !== "DONOR") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const donorId = session.userId as string;

    await syncDonorAchievements(donorId);

    // Fetch donor karma + level
    const donor = await prisma.user.findUnique({
      where: { id: donorId },
      select: { karmaPoints: true, level: true, createdAt: true },
    });

    if (!donor) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Fetch ALL badges + which ones the donor has earned
    const [allBadges, earnedBadges] = await Promise.all([
      prisma.badge.findMany({ orderBy: { createdAt: "asc" } }),
      prisma.userBadge.findMany({
        where: { userId: donorId },
        select: { badgeId: true, createdAt: true },
      }),
    ]);

    const earnedMap = new Map(
      earnedBadges.map((eb) => [eb.badgeId, eb.createdAt])
    );

    // Build the full badge list with earned status
    const badges = allBadges.map((badge) => ({
      id: badge.id,
      name: badge.name,
      description: badge.description,
      imageUrl: badge.imageUrl,
      earned: earnedMap.has(badge.id),
      earnedAt: earnedMap.get(badge.id) || null,
    }));

    // Calculate next level progress
    const currentLevelKarma = (donor.level - 1) * 500;
    const nextLevelKarma = donor.level * 500;
    const progress = Math.min(
      100,
      Math.round(
        ((donor.karmaPoints - currentLevelKarma) /
          (nextLevelKarma - currentLevelKarma)) *
          100
      )
    );

    return NextResponse.json({
      karmaPoints: donor.karmaPoints,
      level: donor.level,
      levelProgress: progress,
      totalBadges: allBadges.length,
      earnedCount: earnedBadges.length,
      badges,
    });
  } catch (error: any) {
    console.error("Badges fetch error:", error?.message, error?.stack);
    return NextResponse.json(
      { error: "Internal Server Error", details: error?.message },
      { status: 500 }
    );
  }
}
