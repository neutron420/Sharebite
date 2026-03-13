import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";
import redis from "@/lib/redis";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "NGO") {
      return NextResponse.json({ error: "Only NGOs can verify handovers" }, { status: 401 });
    }

    const { id } = await params;
    const { pin, deliveryImageUrl } = await request.json();

    const pickupRequest = await prisma.pickupRequest.findUnique({
      where: { id },
      include: { donation: true },
    });

    if (!pickupRequest) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    if (pickupRequest.ngoId !== session.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (pickupRequest.handoverPin !== pin) {
      return NextResponse.json({ error: "Invalid PIN. Please ask the donor for the correct code." }, { status: 400 });
    }

    // Success! Complete the donation
    const updatedRequest = await prisma.pickupRequest.update({
      where: { id },
      data: {
        status: "COMPLETED",
        step: 4,
        deliveryImageUrl: deliveryImageUrl || null,
      },
    });

    // Update donation status
    await prisma.foodDonation.update({
      where: { id: pickupRequest.donationId },
      data: { status: "COLLECTED" },
    });

    // Notify Donor
    await createNotification({
      userId: pickupRequest.donation.donorId,
      type: "REQUEST_STATUS",
      title: "Donation Completed!",
      message: `The NGO has verified the handover for "${pickupRequest.donation.title}". Thank you for your contribution!`,
      link: `/dashboard/requests/${id}`
    });

    // Remove from Redis GEO index since it's now collected
    await redis.zrem("donations:geo", pickupRequest.donationId);

    // 4. Update Redis Karma Leaderboard
    // Add 50 Karma points to the donor for a successful donation
    await redis.zincrby("leaderboard:karma", 50, pickupRequest.donation.donorId);

    return NextResponse.json({
      message: "Handover verified successfully!",
      request: updatedRequest,
    });
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
