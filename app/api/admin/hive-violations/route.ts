import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // Optional filter by type (IMAGE/TEXT)

    const violations = await prisma.hiveViolation.findMany({
      where: type ? { type } : {},
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            strikeCount: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(violations);
  } catch (error) {
    console.error("Fetch hive violations error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
