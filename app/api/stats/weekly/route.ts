import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { withSecurity } from "@/lib/api-handler";

async function getWeeklyStatsHandler() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = session.userId as string;
    const role = session.role;

    // Get date 7 days ago
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    let stats;

    if (role === "DONOR") {
      // Get donor's successful donations for the last 7 days
      const donations = await prisma.foodDonation.findMany({
        where: {
          donorId: userId,
          status: "COLLECTED",
          updatedAt: { gte: sevenDaysAgo }
        },
        select: {
          weight: true,
          updatedAt: true
        }
      });

      // Group by day
      stats = processStats(donations, "updatedAt");
    } else if (role === "NGO") {
      // Get NGO's completed pickups for the last 7 days
      const requests = await prisma.pickupRequest.findMany({
        where: {
          ngoId: userId,
          status: "COMPLETED",
          updatedAt: { gte: sevenDaysAgo }
        },
        include: {
          donation: { select: { weight: true } }
        }
      });

      // Format for processing
      const formattedRequests = requests.map(r => ({
        weight: r.donation.weight || 0,
        updatedAt: r.updatedAt
      }));

      stats = processStats(formattedRequests, "updatedAt");
    } else if (role === "ADMIN") {
      // Global stats for admin
      const allCompleted = await prisma.foodDonation.findMany({
        where: {
          status: "COLLECTED",
          updatedAt: { gte: sevenDaysAgo }
        },
        select: {
          weight: true,
          updatedAt: true
        }
      });

      stats = processStats(allCompleted, "updatedAt");
    }

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Weekly stats error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

function processStats(data: any[], dateKey: string) {
  const last7Days: { date: string; fullDate: string; weight: number; count: number; }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    last7Days.push({
      date: d.toLocaleDateString('en-US', { weekday: 'short' }),
      fullDate: d.toISOString().split('T')[0],
      weight: 0,
      count: 0
    });
  }

  data.forEach(item => {
    const itemDate = new Date(item[dateKey]).toISOString().split('T')[0];
    const dayStat = last7Days.find(d => d.fullDate === itemDate);
    if (dayStat) {
      dayStat.weight += item.weight || 0;
      dayStat.count += 1;
    }
  });

  return last7Days;
}

export const GET = withSecurity(getWeeklyStatsHandler);
