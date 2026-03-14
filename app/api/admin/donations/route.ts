import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withSecurity } from "@/lib/api-handler";

async function getAdminDonationsHandler() {
  try {
    const donations = await prisma.foodDonation.findMany({
      orderBy: { createdAt: "desc" },
      take: 20, // Add pagination to prevent DB crash
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

export const GET = withSecurity(getAdminDonationsHandler);
