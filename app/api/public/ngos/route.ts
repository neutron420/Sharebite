import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withSecurity } from "@/lib/api-handler";

async function getPublicNgosHandler(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawLimit = parseInt(searchParams.get("limit") || "30", 10);
    const limit = Number.isNaN(rawLimit) ? 30 : Math.min(Math.max(rawLimit, 1), 100);
    const query = (searchParams.get("q") || "").trim();

    const ngosRaw = await prisma.user.findMany({
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
        ngoVerification: {
          select: {
            status: true,
            onlineVerifiedAt: true,
            fieldVerifiedAt: true,
            lastVerifiedAt: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
      take: limit,
    });

    const ngos = ngosRaw.map((ngo) => {
      const status = ngo.ngoVerification?.status || "FULLY_VERIFIED";
      const onlineVerified =
        status === "ONLINE_VERIFIED" ||
        status === "FIELD_VISIT_SCHEDULED" ||
        status === "FIELD_VERIFIED" ||
        status === "FULLY_VERIFIED";
      const groundVerified = status === "FIELD_VERIFIED" || status === "FULLY_VERIFIED";

      return {
        id: ngo.id,
        name: ngo.name,
        city: ngo.city,
        state: ngo.state,
        verificationBadge: {
          onlineVerified,
          groundVerified,
          lastVerifiedOn: ngo.ngoVerification?.lastVerifiedAt || null,
        },
      };
    });

    return NextResponse.json({ ngos });
  } catch (error) {
    console.error("Public NGO list error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export const GET = withSecurity(getPublicNgosHandler, { limit: 60 });
