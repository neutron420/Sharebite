import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [totalUsers, totalDonations, totalRequests, totalWeightResult, recentDonations] = await Promise.all([
      prisma.user.count(),
      prisma.foodDonation.count(),
      prisma.pickupRequest.count(),
      prisma.foodDonation.aggregate({
        where: { status: "COLLECTED" },
        _sum: { weight: true }
      }),
      prisma.foodDonation.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          donor: {
            select: { name: true }
          }
        }
      })
    ]);

    return NextResponse.json({
      stats: {
        totalUsers,
        totalDonations,
        totalRequests,
        totalWeightSaved: totalWeightResult._sum.weight || 0,
      },
      recentDonations
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
