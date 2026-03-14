import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withSecurity } from "@/lib/api-handler";

async function getAdminRequestsHandler() {
  try {
    const requests = await prisma.pickupRequest.findMany({
      orderBy: { createdAt: "desc" },
      take: 50, // Added pagination
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

export const GET = withSecurity(getAdminRequestsHandler);
