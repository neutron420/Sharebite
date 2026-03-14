import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { withSecurity } from "@/lib/api-handler";
import { createNotification } from "@/lib/notifications";
import redis from "@/lib/redis";

async function deliveryHandler(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "RIDER" && session.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized. Riders or Admins only." }, { status: 401 });
    }

    const userId = session.userId as string;

    const { id } = await params;
    const body = await request.json();
    const { deliveryProofUrl } = body;

    if (!deliveryProofUrl) {
      return NextResponse.json({ error: "Proof of delivery image is required" }, { status: 400 });
    }

    // 1. Fetch the request
    const pickupRequest = await prisma.pickupRequest.findUnique({
      where: { id },
      include: { donation: true }
    });

    if (!pickupRequest || (pickupRequest.riderId !== userId && session.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized task access" }, { status: 403 });
    }

    // SECURITY: Ensure food was actually picked up first
    if (pickupRequest.status !== "ON_THE_WAY" || pickupRequest.step !== 4) {
      return NextResponse.json(
        { error: "You must collect the food from donor before marking as delivered." },
        { status: 400 }
      );
    }

    // 2. Complete the Request
    const updatedRequest = await prisma.pickupRequest.update({
      where: { id },
      data: {
        status: "COMPLETED",
        deliveryImageUrl: deliveryProofUrl,
        step: 5, // Fully delivered
        completedAt: new Date()
      }
    });

    // 3. Update Rider Stats & Availability
    await prisma.user.update({
      where: { id: userId },
      data: {
        totalDeliveries: { increment: 1 },
        isAvailable: true
      }
    });

    // 4. Update Leaderboard Karma points
    await redis.zincrby("leaderboard:karma", 10, userId);

    // 5. Cleanup Redis Live Tracking
    await redis.del(`rider:pos:${userId}`);

    // 6. Notify the NGO
    await createNotification({
      userId: pickupRequest.ngoId,
      type: "REQUEST_STATUS",
      title: "Food Delivered! 🎉",
      message: `The rider has delivered the food to your location. Please confirm receipt.`,
      link: `/dashboard/requests/${id}`
    });

    // 7. Notify the Donor
    const donorId = pickupRequest.donation.donorId;
    await createNotification({
      userId: donorId,
      type: "REQUEST_STATUS",
      title: "Mission Accomplished!",
      message: `Your food donation has successfully reached the NGO. You've made a difference today!`,
      link: `/donor/donations/${pickupRequest.donation.id}`
    });

    return NextResponse.json({ 
      success: true, 
      message: "Delivery marked as complete. Great job hero!" 
    });

  } catch (error) {
    console.error("Delivery completion error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export const PATCH = withSecurity(deliveryHandler, { limit: 20 });
