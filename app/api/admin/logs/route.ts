import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const logs = await prisma.auditLog.findMany({
      include: {
        admin: {
          select: { name: true, email: true }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 100 // Last 100 logs
    });

    return NextResponse.json(logs);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
