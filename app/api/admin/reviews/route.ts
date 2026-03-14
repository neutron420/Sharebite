import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { withSecurity } from "@/lib/api-handler";

async function getAdminReviewsHandler(request: Request) {
  try {
    const session = await getSession({ preferredRole: "ADMIN", request });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized. Admin session required." }, { status: 401 });
    }

    if (session.role !== "ADMIN") {
      console.warn(`Unauthorized Admin reviews access attempt by ${session.role}: ${session.userId}`);
      return NextResponse.json(
        {
          error: `Access Denied. Elevated privileges required. Your current role is ${session.role}.`,
          currentRole: session.role,
        },
        { status: 403 }
      );
    }

    const reviews = await prisma.review.findMany({
      orderBy: { createdAt: "desc" },
      take: 50, // Added pagination
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

export const GET = withSecurity(getAdminReviewsHandler);
