import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import redis from "@/lib/redis";
import { withSecurity } from "@/lib/api-handler";

async function getSummaryHandler() {
  try {

    const totalDonors = await prisma.user.count({ where: { role: "DONOR" } });
    const totalNGOs = await prisma.user.count({
      where: {
        role: "NGO",
        isVerified: true,
        OR: [
          {
            ngoVerification: {
              is: {
                status: "FULLY_VERIFIED",
              },
            },
          },
          {
            ngoVerification: {
              is: null,
            },
          },
        ],
      },
    });
    
    const aggregatedStats = await prisma.foodDonation.aggregate({
      where: { status: "COLLECTED" },
      _sum: {
        weight: true
      },
      _count: {
        id: true
      }
    });

    const totalWeight = aggregatedStats._sum.weight || 0;
    const totalMeals = aggregatedStats._count.id || 0;

    // 2. Get top 3 of the week from Redis Leaderboard
    const topDonorsRedis = await redis.zrevrange("leaderboard:karma", 0, 2, "WITHSCORES");
    const topDonors = [];
    for (let i = 0; i < topDonorsRedis.length; i += 2) {
      const user = await prisma.user.findUnique({
        where: { id: topDonorsRedis[i] },
        select: { name: true, imageUrl: true }
      });
      topDonors.push({
        name: user?.name,
        imageUrl: user?.imageUrl,
        karma: parseInt(topDonorsRedis[i + 1])
      });
    }

    return NextResponse.json({
      summary: {
        totalDonors,
        totalNGOs,
        totalWeight,
        totalMeals,
      },
      hallOfFame: topDonors
    });
  } catch (error) {
    console.error("Summary stats error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export const GET = withSecurity(getSummaryHandler, { limit: 30 }); // 30 requests per minute
