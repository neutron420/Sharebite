import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { withSecurity } from "@/lib/api-handler";

async function getNgoStatsHandler() {
  try {
    const session = await getSession();
    if (!session || session.role !== "NGO") {
      return NextResponse.json({ error: "Unauthorized. NGO only." }, { status: 401 });
    }

    const userId = session.userId as string;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true }
    });

    const [
      totalRequests,
      pendingRequests,
      approvedRequests,
      completedRequests,
      totalWeightResult,
      recentDonations
    ] = await Promise.all([
      prisma.pickupRequest.count({ where: { ngoId: userId } }),
      prisma.pickupRequest.count({ where: { ngoId: userId, status: "PENDING" } }),
      prisma.pickupRequest.count({ where: { ngoId: userId, status: "APPROVED" } }),
      prisma.pickupRequest.count({ where: { ngoId: userId, status: "COMPLETED" } }),
      prisma.foodDonation.aggregate({
        where: { requests: { some: { ngoId: userId, status: "COMPLETED" } } },
        _sum: { weight: true }
      }),
      prisma.foodDonation.findMany({
        where: { status: "AVAILABLE" },
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { donor: { select: { name: true, city: true } } }
      })
    ]);

    return NextResponse.json({
      userName: user?.name || "NGO Hub",
      totalRequests,
      pendingRequests,
      approvedRequests,
      completedRequests,
      totalWeightCollected: totalWeightResult._sum.weight || 0,
      availableDonations: recentDonations
    });
  } catch (error) {
    console.error("NGO stats error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export const GET = withSecurity(getNgoStatsHandler);
