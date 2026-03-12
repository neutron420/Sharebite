import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "DONOR") {
      return NextResponse.json({ error: "Unauthorized. Donor only." }, { status: 401 });
    }

    const userId = session.userId as string;

    const [
      totalDonations,
      activeDonations,
      completedDonations,
      totalWeightResult,
      recentRequests
    ] = await Promise.all([
      prisma.foodDonation.count({ where: { donorId: userId } }),
      prisma.foodDonation.count({ where: { donorId: userId, status: "AVAILABLE" } }),
      prisma.foodDonation.count({ where: { donorId: userId, status: "COLLECTED" } }),
      prisma.foodDonation.aggregate({
        where: { donorId: userId, status: "COLLECTED" },
        _sum: { weight: true }
      }),
      prisma.pickupRequest.findMany({
        where: { donation: { donorId: userId } },
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          ngo: { select: { name: true, city: true } },
          donation: { select: { title: true } }
        }
      })
    ]);

    return NextResponse.json({
      totalDonations,
      activeDonations,
      completedDonations,
      totalWeightDonated: totalWeightResult._sum.weight || 0,
      recentRequests
    });
  } catch (error) {
    console.error("Donor stats error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
