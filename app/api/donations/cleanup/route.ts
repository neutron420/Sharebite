import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST() {
  try {
    const now = new Date();

    const result = await prisma.foodDonation.updateMany({
      where: {
        status: "AVAILABLE",
        expiryTime: { lte: now }
      },
      data: {
        status: "EXPIRED"
      }
    });

    return NextResponse.json({
      message: "Cleanup successful",
      expiredCount: result.count
    });
  } catch (error) {
    console.error("Cleanup error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
