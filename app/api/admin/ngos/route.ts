import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withSecurity } from "@/lib/api-handler";

async function getAdminNgosHandler() {
  try {
    const ngos = await prisma.user.findMany({
      where: { role: "NGO" },
      orderBy: { createdAt: "desc" },
      take: 20, // Added pagination to prevent DB crash
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
        strikeCount: true,
        suspensionExpiresAt: true,
        isLicenseSuspended: true,
        _count: {
          select: { 
            requests: true,
            violations: true
          }
        },
        violations: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { reason: true, createdAt: true }
        }
      }
    });

    return NextResponse.json(ngos);
  } catch (error) {
    console.error("Admin NGOs fetch error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export const GET = withSecurity(getAdminNgosHandler);
