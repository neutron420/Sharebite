import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withSecurity } from "@/lib/api-handler";

async function getAdminReviewsHandler() {
  try {
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
