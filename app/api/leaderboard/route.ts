import { NextResponse } from "next/server";
import redis from "@/lib/redis";
import prisma from "@/lib/prisma";
import { withSecurity } from "@/lib/api-handler";

async function getLeaderboardHandler() {
  try {
    // Get Top 10 users by Karma points
    let topUsers: string[] = [];
    try {
      topUsers = await redis.zrevrange("leaderboard:karma", 0, 9, "WITHSCORES");
    } catch (redisError) {
      console.error("Redis Leaderboard Error:", redisError);
      return NextResponse.json([]); // Return empty list to prevent crash
    }
    
    // Redis returns [id1, score1, id2, score2, ...]
    const formatted = [];
    for (let i = 0; i < topUsers.length; i += 2) {
      formatted.push({
        userId: topUsers[i],
        karma: parseInt(topUsers[i + 1]),
      });
    }

    // Fetch user names for the top 10
    const userIds = formatted.map(f => f.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, imageUrl: true, role: true }
    });

    const finalLeaderboard = formatted.map(f => {
      const user = users.find(u => u.id === f.userId);
      return {
        ...f,
        name: user?.name || "Unknown Hero",
        imageUrl: user?.imageUrl,
        role: user?.role
      };
    }).sort((a, b) => b.karma - a.karma);

    return NextResponse.json(finalLeaderboard);
  } catch (error) {
    console.error("Leaderboard error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export const GET = withSecurity(getLeaderboardHandler, { limit: 10 });
