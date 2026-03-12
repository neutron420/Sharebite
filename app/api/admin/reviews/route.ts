import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const reviews = await prisma.review.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        reviewer: {
          select: { id: true, name: true, email: true, role: true }
        },
        reviewee: {
          select: { id: true, name: true, email: true, role: true }
        },
        donation: {
          select: { id: true, title: true }
        }
      }
    });

    return NextResponse.json(reviews);
  } catch (error) {
    console.error("Admin reviews fetch error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
