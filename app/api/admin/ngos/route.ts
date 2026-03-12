import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ngos = await prisma.user.findMany({
      where: { role: "NGO" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
        city: true,
        address: true,
        isVerified: true,
        imageUrl: true,
        createdAt: true,
        _count: {
          select: { requests: true }
        }
      }
    });

    return NextResponse.json(ngos);
  } catch (error) {
    console.error("Admin NGOs fetch error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
