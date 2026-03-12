import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
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
