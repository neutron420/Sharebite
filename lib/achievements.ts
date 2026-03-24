import prisma from "./prisma";
import { createNotification } from "./notifications";

export async function syncDonorAchievements(donorId: string) {
  const [user, donations, earnedBadgeCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: donorId },
      select: { karmaPoints: true, level: true },
    }),
    prisma.foodDonation.findMany({
      where: { donorId },
      select: { weight: true },
    }),
    prisma.userBadge.count({
      where: { userId: donorId },
    }),
  ]);

  if (!user) {
    return { karmaPoints: 0, level: 1, newBadges: [] as string[] };
  }

  const donationKarma = donations.reduce((total, donation) => {
    const weight = donation.weight || 0;
    return total + 10 + Math.floor(weight * 2);
  }, 0);

  const minimumKarma = donationKarma + earnedBadgeCount * 50;
  const syncedKarma = Math.max(user.karmaPoints, minimumKarma);
  const syncedLevel = Math.floor(syncedKarma / 500) + 1;

  if (syncedKarma !== user.karmaPoints || syncedLevel !== user.level) {
    await prisma.user.update({
      where: { id: donorId },
      data: {
        karmaPoints: syncedKarma,
        level: syncedLevel,
      },
    });
  }

  const newBadges = await checkAndAwardBadges(donorId);

  if (newBadges.length === 0) {
    return {
      karmaPoints: syncedKarma,
      level: syncedLevel,
      newBadges,
    };
  }

  const refreshedUser = await prisma.user.findUnique({
    where: { id: donorId },
    select: { karmaPoints: true, level: true },
  });

  return {
    karmaPoints: refreshedUser?.karmaPoints || syncedKarma,
    level: refreshedUser?.level || syncedLevel,
    newBadges,
  };
}

export async function checkAndAwardBadges(donorId: string): Promise<string[]> {
  const newlyUnlocked: string[] = [];

  const [allBadges, existingUserBadges, donor] = await Promise.all([
    prisma.badge.findMany(),
    prisma.userBadge.findMany({ where: { userId: donorId }, select: { badgeId: true } }),
    prisma.user.findUnique({
      where: { id: donorId },
      select: { karmaPoints: true, createdAt: true },
    }),
  ]);

  if (!donor) return [];

  const ownedBadgeIds = new Set(existingUserBadges.map((ub) => ub.badgeId));

    const [
    totalDonations,
    verifiedDonations,
    totalWeightResult,
    vegCount,
    distinctCategories,
    monthlyDonations,
    donationsWithDates,
  ] = await Promise.all([
    // Total donation count
    prisma.foodDonation.count({ where: { donorId } }),
    // Verified/completed donations (those that have at least one COMPLETED request)
    prisma.foodDonation.count({
      where: {
        donorId,
        requests: { some: { status: "COMPLETED" } },
      },
    }),
    // Total weight
    prisma.foodDonation.aggregate({
      where: { donorId },
      _sum: { weight: true },
    }),
    // VEG category count
    prisma.foodDonation.count({
      where: { donorId, category: "VEG" },
    }),
    // Distinct categories
    prisma.foodDonation.groupBy({
      by: ["category"],
      where: { donorId },
    }),
    // This month's donations
    prisma.foodDonation.count({
      where: {
        donorId,
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
    }),
    // All donation dates for streak calculation
    prisma.foodDonation.findMany({
      where: { donorId },
      select: { createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const totalWeight = totalWeightResult._sum.weight || 0;
  const accountAgeMonths = Math.floor(
    (Date.now() - new Date(donor.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 30)
  );

  // 3. Calculate streak (consecutive days with donations)
  let streak = 0;
  if (donationsWithDates.length > 0) {
    const uniqueDays = [
      ...new Set(
        donationsWithDates.map((d) =>
          new Date(d.createdAt).toISOString().split("T")[0]
        )
      ),
    ].sort().reverse();

    streak = 1;
    for (let i = 1; i < uniqueDays.length; i++) {
      const prev = new Date(uniqueDays[i - 1]);
      const curr = new Date(uniqueDays[i]);
      const diffDays = (prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24);
      if (diffDays === 1) {
        streak++;
      } else {
        break;
      }
    }
  }

  // 4. Check time-based badges (Early Bird / Midnight Hero)
  const latestDonation = donationsWithDates[0];
  const latestHour = latestDonation
    ? new Date(latestDonation.createdAt).getHours()
    : -1;

  const batchAwards: Promise<any>[] = [];

  // 5. Check each badge criteria
  for (const badge of allBadges) {
    if (ownedBadgeIds.has(badge.id)) continue;

    const criteria = badge.criteria as Record<string, any> | null;
    if (!criteria) continue;

    let earned = false;
    switch (criteria.type) {
      case "COUNT": earned = totalDonations >= criteria.value; break;
      case "VERIFIED_COUNT": earned = verifiedDonations >= criteria.value; break;
      case "WEIGHT": earned = totalWeight >= criteria.value; break;
      case "STREAK": earned = streak >= criteria.value; break;
      case "MONTHLY_COUNT": earned = monthlyDonations >= criteria.value; break;
      case "TIME_EARLY": earned = latestHour >= 0 && latestHour < criteria.value; break;
      case "TIME_LATE": earned = latestHour >= criteria.value; break;
      case "CATEGORY_COUNT": if (criteria.category === "VEG") earned = vegCount >= criteria.value; break;
      case "KARMA": earned = donor.karmaPoints >= criteria.value; break;
      case "DIVERSE_CATEGORIES": earned = distinctCategories.length >= criteria.value; break;
      case "SENIORITY": earned = accountAgeMonths >= (criteria.months || 6) && totalDonations >= (criteria.count || 10); break;
      case "PERFECT_RECORD": earned = totalDonations >= criteria.value; break;
    }

    if (earned) {
      newlyUnlocked.push(badge.name);
      // Construct parallel awards (Batch these for speed)
      batchAwards.push(
        prisma.userBadge.create({ data: { userId: donorId, badgeId: badge.id } }),
        createNotification({
          userId: donorId,
          type: "SYSTEM", 
          title: `🏅 Badge Unlocked: ${badge.name}!`,
          message: badge.description,
          link: "/donor/profile#badges-gallery",
        })
      );
    }
  }

  // Execute all awards simultaneously for "Fast" response
  if (batchAwards.length > 0) {
    await Promise.all(batchAwards);
  }

  // 6. Award karma points (10 per donation, bonus for milestones)
  if (newlyUnlocked.length > 0) {
    const bonusKarma = newlyUnlocked.length * 50; // 50 bonus karma per badge
    await prisma.user.update({
      where: { id: donorId },
      data: {
        karmaPoints: { increment: bonusKarma },
        level: Math.floor((donor.karmaPoints + bonusKarma) / 500) + 1,
      },
    });
  }

  return newlyUnlocked;
}

/**
 * Award base karma for a donation action.
 * Call this when a new donation is created.
 */
export async function awardDonationKarma(donorId: string, weightKg: number = 0) {
  const baseKarma = 10;
  const weightBonus = Math.floor(weightKg * 2); // 2 karma per kg
  const totalKarma = baseKarma + weightBonus;

  const updated = await prisma.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: { id: donorId },
      data: {
        karmaPoints: { increment: totalKarma },
      },
      select: { karmaPoints: true },
    });

    const newLevel = Math.floor(user.karmaPoints / 500) + 1;

    await tx.user.update({
      where: { id: donorId },
      data: { level: newLevel },
    });

    return {
      karmaPoints: user.karmaPoints,
      newLevel,
    };
  });

  return {
    karmaAwarded: totalKarma,
    newTotal: updated.karmaPoints,
    newLevel: updated.newLevel,
  };
}
