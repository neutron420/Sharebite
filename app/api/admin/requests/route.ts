import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const requests = await prisma.pickupRequest.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        ngo: {
          select: { id: true, name: true, email: true, city: true }
        },
        donation: {
          include: {
            donor: {
              select: { name: true, email: true }
            }
          }
        }
      }
    });

    return NextResponse.json(requests);
  } catch (error) {
    console.error("Admin requests fetch error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
