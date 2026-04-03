import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withSecurity } from "@/lib/api-handler";

async function getPublicNgosHandler(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawLimit = parseInt(searchParams.get("limit") || "30", 10);
    const limit = Number.isNaN(rawLimit) ? 30 : Math.min(Math.max(rawLimit, 1), 100);
    const query = (searchParams.get("q") || "").trim();

    const ngos = await prisma.user.findMany({
      where: {
        role: "NGO",
        isVerified: true,
        isLicenseSuspended: false,
        OR: [
          { suspensionExpiresAt: null },
          { suspensionExpiresAt: { lte: new Date() } },
        ],
        ...(query.length >= 2
          ? {
              name: {
                contains: query,
                mode: "insensitive",
              },
            }
          : {}),
      },
      select: {
        id: true,
        name: true,
        city: true,
        state: true,
      },
      orderBy: {
        name: "asc",
      },
      take: limit,
    });

    return NextResponse.json({ ngos });
  } catch (error) {
    console.error("Public NGO list error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export const GET = withSecurity(getPublicNgosHandler, { limit: 60 });
