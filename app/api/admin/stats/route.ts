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
      pendingRequests
    ] = await Promise.all([
      prisma.user.count(),
      prisma.foodDonation.count(),
      prisma.pickupRequest.count(),
      prisma.foodDonation.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { donor: { select: { name: true } } }
      }),
      prisma.pickupRequest.count({ where: { status: "PENDING" } })
    ]);

    return NextResponse.json({
      stats: {
        totalUsers,
        totalDonations,
        totalRequests,
        pendingRequests
      },
      recentDonations
    });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
