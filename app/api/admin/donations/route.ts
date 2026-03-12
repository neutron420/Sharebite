import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const donations = await prisma.foodDonation.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        donor: {
          select: { name: true, email: true }
        },
        requests: {
          include: {
            ngo: {
              select: { name: true }
            }
          }
        }
      }
    });

    return NextResponse.json(donations);
  } catch (error) {
    console.error("Admin donations fetch error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
