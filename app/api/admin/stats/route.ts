import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized. Admin only." }, { status: 401 });
    }

    const [
      totalUsers,
      totalDonations,
      totalRequests,
      recentDonations,
      pendingRequests,
      totalWeightResult,
      ngoLeaderboard,
      donorLeaderboard
    ] = await Promise.all([
      prisma.user.count(),
      prisma.foodDonation.count(),
      prisma.pickupRequest.count(),
      prisma.foodDonation.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { donor: { select: { name: true } } }
      }),
      prisma.pickupRequest.count({ where: { status: "PENDING" } }),
      prisma.foodDonation.aggregate({
        where: { status: "COLLECTED" },
        _sum: { weight: true }
      }),
      prisma.user.findMany({
        where: { role: "NGO" },
        select: {
          name: true,
          imageUrl: true,
          _count: {
            select: { requests: { where: { status: "COMPLETED" } } }
          }
        },
        orderBy: {
          requests: { _count: "desc" }
        },
        take: 5
      }),
      prisma.user.findMany({
        where: { role: "DONOR" },
        select: {
          name: true,
          imageUrl: true,
          _count: {
            select: { donations: { where: { status: "COLLECTED" } } }
          }
        },
        orderBy: {
          donations: { _count: "desc" }
        },
        take: 5
      })
    ]);

    return NextResponse.json({
      stats: {
        totalUsers,
        totalDonations,
        totalRequests,
        pendingRequests,
        totalWeightSaved: totalWeightResult._sum.weight || 0
      },
      recentDonations,
      ngoLeaderboard,
      donorLeaderboard
    });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
