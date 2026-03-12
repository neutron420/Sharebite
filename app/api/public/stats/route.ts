import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const [totalDonations, totalWeightResult, totalNGOs] = await Promise.all([
      prisma.foodDonation.count({ where: { status: "COLLECTED" } }),
      prisma.foodDonation.aggregate({
        where: { status: "COLLECTED" },
        _sum: { weight: true }
      }),
      prisma.user.count({ where: { role: "NGO", isVerified: true } })
    ]);

    return NextResponse.json({
      mealsSaved: totalDonations,
      kilogramsSaved: totalWeightResult._sum.weight || 0,
      partnerNGOs: totalNGOs
    });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
