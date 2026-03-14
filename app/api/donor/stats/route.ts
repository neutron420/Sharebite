import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { withSecurity } from "@/lib/api-handler";

async function getDonorStatsHandler(request: Request) {
  try {
    const session = await getSession({ preferredRole: "DONOR", request });

    console.log("[DONOR STATS] Session check:", {
      hasSession: !!session,
      role: session?.role,
      userId: session?.userId
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    if (session.role !== "DONOR") {
      console.warn(`[DONOR STATS] Wrong role: ${session.role} (userId: ${session.userId})`);
      return NextResponse.json({
        error: `Access Denied. This is for Donors only. Your role: ${session.role}`,
        currentRole: session.role
      }, { status: 403 });
    }

    const userId = session.userId as string;
    console.log("[DONOR STATS] Fetching stats for donor:", userId);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true }
    });

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
      userName: user?.name || "Donor",
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

export const GET = withSecurity(getDonorStatsHandler, { limit: 120 });
