import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { withSecurity } from "@/lib/api-handler";

async function getAdminStatsHandler() {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [
      totalUsers,
      totalDonations,
      totalRequests,
      totalWeightResult,
      recentDonations,
      donorCount,
      ngoCount,
      adminCount,
      availableCount,
      requestedCount,
      approvedCount,
      collectedCount,
      expiredCount,
      allDonations,
      recentLogs,
      pendingReports,
      pendingVerifications,
      riderCount,
      activeRiderCount,
      assignedTaskCount,
      onTheWayTaskCount,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.foodDonation.count(),
      prisma.pickupRequest.count(),
      prisma.foodDonation.aggregate({
        where: { status: "COLLECTED" },
        _sum: { weight: true },
      }),
      prisma.foodDonation.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          donor: { select: { name: true } },
          requests: { select: { status: true, ngo: { select: { name: true } } } },
        },
      }),
      prisma.user.count({ where: { role: "DONOR" } }),
      prisma.user.count({ where: { role: "NGO" } }),
      prisma.user.count({ where: { role: "ADMIN" } }),
      prisma.foodDonation.count({ where: { status: "AVAILABLE" } }),
      prisma.foodDonation.count({ where: { status: "REQUESTED" } }),
      prisma.foodDonation.count({ where: { status: "APPROVED" } }),
      prisma.foodDonation.count({ where: { status: "COLLECTED" } }),
      prisma.foodDonation.count({ where: { status: "EXPIRED" } }),
      // Get donations with createdAt and category for charting
      prisma.foodDonation.findMany({
        select: { createdAt: true, category: true, weight: true, status: true },
        orderBy: { createdAt: "asc" },
      }),
      prisma.auditLog.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: { admin: { select: { name: true } } },
      }),
      prisma.report.count({ where: { status: "PENDING" } }),
      prisma.user.count({ where: { role: "NGO", isVerified: false } }),
      prisma.user.count({ where: { role: "RIDER" } }),
      prisma.user.count({ where: { role: "RIDER", isAvailable: true } }),
      prisma.pickupRequest.count({ where: { status: "ASSIGNED" } }),
      prisma.pickupRequest.count({ where: { status: "ON_THE_WAY" } }),
    ]);

    // Build monthly donation counts for the last 12 months
    const monthlyMap: Record<string, number> = {};
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthlyMap[key] = 0;
    }
    for (const d of allDonations) {
      const key = `${d.createdAt.getFullYear()}-${String(d.createdAt.getMonth() + 1).padStart(2, "0")}`;
      if (key in monthlyMap) monthlyMap[key]++;
    }
    const monthlyDonations = Object.entries(monthlyMap).map(([month, count]) => ({
      month,
      count,
    }));

    // Build category breakdown
    const categoryMap: Record<string, number> = {};
    for (const d of allDonations) {
      categoryMap[d.category] = (categoryMap[d.category] || 0) + 1;
    }
    const categoryBreakdown = Object.entries(categoryMap).map(([category, count]) => ({
      category,
      count,
    }));

    return NextResponse.json({
      stats: {
        totalUsers,
        totalDonations,
        totalRequests,
        totalWeightSaved: totalWeightResult._sum.weight || 0,
        pendingReports,
        pendingVerifications,
      },
      userRoles: { 
        donors: donorCount, 
        ngos: ngoCount, 
        admins: adminCount,
        riders: riderCount 
      },
      deliveryStats: {
        activeRiders: activeRiderCount,
        assignedTasks: assignedTaskCount,
        onTheWayTasks: onTheWayTaskCount
      },
      donationStatuses: {
        available: availableCount,
        requested: requestedCount,
        approved: approvedCount,
        collected: collectedCount,
        expired: expiredCount,
      },
      monthlyDonations,
      categoryBreakdown,
      recentDonations,
      recentLogs,
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export const GET = withSecurity(getAdminStatsHandler);
