import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withSecurity } from "@/lib/api-handler";

async function getPublicStatsHandler() {
  try {
    const [totalDonations, totalWeightResult, totalNGOs] = await Promise.all([
      prisma.foodDonation.count({ where: { status: "COLLECTED" } }),
      prisma.foodDonation.aggregate({
        where: { status: "COLLECTED" },
        _sum: { weight: true },
      }),
      prisma.user.count({
        where: {
          role: "NGO",
          isVerified: true,
          isLicenseSuspended: false,
          AND: [
            {
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
            {
              OR: [
                { suspensionExpiresAt: null },
                { suspensionExpiresAt: { lte: new Date() } },
              ],
            },
          ],
        },
      }),
    ]);

    return NextResponse.json({
      mealsSaved: totalDonations,
      kilogramsSaved: totalWeightResult._sum.weight || 0,
      partnerNGOs: totalNGOs,
    });
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export const GET = withSecurity(getPublicStatsHandler, { limit: 30 });
