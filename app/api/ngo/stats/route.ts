import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { withSecurity } from "@/lib/api-handler";

async function getNgoStatsHandler(request: Request) {
  try {
    const session = await getSession({ preferredRole: "NGO", request });
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    if (session.role !== "NGO") {
      console.warn(`Unauthorized access attempt to NGO stats by ${session.role}: ${session.userId}`);
      return NextResponse.json({ 
        error: `Access Denied. Your account is registered as ${session.role}. This portal is for NGOs only.`,
        currentRole: session.role 
      }, { status: 403 }); // Using 403 for role mismatch
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
      recentDonations,
      activeRequests
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
      }),
      prisma.pickupRequest.findMany({
        where: { 
          ngoId: userId, 
          status: { in: ["APPROVED", "ASSIGNED", "ON_THE_WAY"] } 
        },
        include: {
          donation: {
            include: {
              donor: { select: { name: true, city: true, latitude: true, longitude: true, address: true } }
            }
          },
          rider: { select: { name: true } },
          ngo: { select: { name: true, city: true, latitude: true, longitude: true, address: true } }
        }
      })
    ]);

    return NextResponse.json({
      userName: user?.name || "NGO Hub",
      totalRequests,
      pendingRequests,
      approvedRequests,
      completedRequests,
      totalWeightCollected: totalWeightResult._sum.weight || 0,
      availableDonations: recentDonations,
      activeRequests: activeRequests
    });
  } catch (error) {
    console.error("NGO stats error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export const GET = withSecurity(getNgoStatsHandler);
