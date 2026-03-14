import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { z } from "zod";
import { withSecurity } from "@/lib/api-handler";

const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
  donationId: z.string(),
  revieweeId: z.string(),
});

async function postReviewHandler(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const validatedData = reviewSchema.parse(body);

    const donation = await prisma.foodDonation.findUnique({
      where: { id: validatedData.donationId }
    });

    if (!donation) {
      return NextResponse.json({ error: "Donation not found" }, { status: 404 });
    }

    if (donation.status !== "COLLECTED") {
        console.error("Review Error: Donation status is not COLLECTED", donation.status);
        return NextResponse.json({ error: "Can only review after food is collected" }, { status: 400 });
    }

    const completedRequest = await prisma.pickupRequest.findFirst({
        where: {
            donationId: validatedData.donationId,
            status: "COMPLETED"
        }
    });

    const isDonor = donation.donorId === session.userId;
    const isNGO = completedRequest?.ngoId === session.userId;

    if (!isDonor && !isNGO) {
        console.error("Review Error: User not involved in donation", session.userId);
        return NextResponse.json({ error: "You were not involved in this donation" }, { status: 403 });
    }

    const targetId = isDonor ? completedRequest?.ngoId : donation.donorId;
    if (validatedData.revieweeId !== targetId) {
        console.error("Review Error: Invalid reviewee", { targetId, revieweeId: validatedData.revieweeId });
        return NextResponse.json({ error: "Invalid reviewee" }, { status: 400 });
    }

    const review = await prisma.review.create({
      data: {
        rating: validatedData.rating,
        comment: validatedData.comment,
        donationId: validatedData.donationId,
        reviewerId: session.userId as string,
        revieweeId: validatedData.revieweeId,
      }
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error: any) {
    if (error.name === "ZodError") {
        console.error("Review Validation Error:", error.errors);
        return NextResponse.json({ error: "Validation failed", details: error.errors }, { status: 400 });
    }
    if (error.code === 'P2002') {
        console.error("Review Duplicate Error:", error.meta);
        return NextResponse.json({ error: "You have already reviewed this donation" }, { status: 400 });
    }
    console.error("Review creation error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

async function getReviewsHandler(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const revieweeId = searchParams.get("userId");

        if (!revieweeId) return NextResponse.json({ error: "User ID required" }, { status: 400 });

        const reviews = await prisma.review.findMany({
            where: { revieweeId },
            include: {
                reviewer: { select: { name: true, imageUrl: true } },
                donation: { select: { title: true } }
            },
            orderBy: { createdAt: "desc" }
        });

        const avg = reviews.length > 0 
            ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length 
            : 0;

        return NextResponse.json({ reviews, averageRating: avg });
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export const POST = withSecurity(postReviewHandler, { limit: 20 });
export const GET = withSecurity(getReviewsHandler, { limit: 60 });
