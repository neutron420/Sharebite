import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "RIDER") {
      return NextResponse.json({ error: "Riders only" }, { status: 401 });
    }

    const userId = session.userId as string;

    const rider = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        rewardPoints: true,
        wallet: {
          select: {
            balance: true,
            totalEarnings: true,
          }
        },
        _count: {
          select: {
            tasks: {
              where: { status: "COMPLETED" }
            }
          }
        }
      }
    });

    if (!rider) {
      return NextResponse.json({ error: "Rider not found" }, { status: 404 });
    }

    return NextResponse.json({
      balance: rider.wallet?.balance || 0,
      totalEarnings: rider.wallet?.totalEarnings || 0,
      rewardPoints: rider.rewardPoints,
      completedMissions: rider._count.tasks
    });
  } catch (error) {
    console.error("Rider stats error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
