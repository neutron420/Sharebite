import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { creditRiderWallet, addRewardPoints } from "@/lib/rider-service";
import { createNotification } from "@/lib/notifications";
import { withSecurity } from "@/lib/api-handler";

async function riderVerifyHandler(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "RIDER") {
      return NextResponse.json({ error: "Only riders can verify OTP" }, { status: 401 });
    }

    const { otp } = await request.json();
    const { id: requestId } = await params;

    // SECURITY PATCH: Ensure the pickup request actually belongs to this specific rider
    const existingReq = await prisma.pickupRequest.findUnique({
      where: { id: requestId },
      select: { riderId: true }
    });

    if (!existingReq || existingReq.riderId !== session.userId) {
      return NextResponse.json({ error: "Access denied or request not found" }, { status: 403 });
    }

    // 1. Check if OTP is valid, not expired, and matches requestId
    const latestOtp = await prisma.oTPVerification.findFirst({
      where: {
        orderId: requestId,
        expiry: { gt: new Date() }
      },
      orderBy: { createdAt: "desc" }
    });

    if (!latestOtp || latestOtp.otp !== otp) {
      return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 400 });
    }

    // 2. Success! Request is delivered but needs payment to complete and payout
    const pickupRequest = await prisma.pickupRequest.update({
      where: { id: requestId },
      data: {
        status: "ASSIGNED", // Keep it active for payment
        step: 3.5, // Intermediate step for "Delivered, Pending Payment"
        completedAt: new Date(), // Mark the delivery time
      },
      include: { donation: true, ngo: true }
    });

    // 3. Mark donation as collected
    await prisma.foodDonation.update({
      where: { id: pickupRequest.donationId },
      data: { status: "COLLECTED" }
    });

    // 5. Cleanup: Delete used OTPs for this order
    await prisma.oTPVerification.deleteMany({
      where: { orderId: requestId }
    });

    const payoutAmount = 1;

    // Notify Rider about successful delivery and pending payout
    await createNotification({
      userId: session.userId,
      type: "SYSTEM",
      title: "Delivery Verified!",
      message: `Successfully delivered "${pickupRequest.donation.title}". Payout of ₹${payoutAmount} is pending NGO release.`,
      link: "/rider"
    });

    // Notify NGO that delivery is completed and they need to pay
    await createNotification({
      userId: pickupRequest.ngoId,
      type: "REQUEST_STATUS",
      title: "Food Delivered! Release Rider Payout",
      message: `The rider has safely delivered "${pickupRequest.donation.title}". Please pay the ₹1 fee to release their payout.`,
      link: `/ngo/requests/${requestId}`
    });

    return NextResponse.json({
      message: "Delivery verified! Awaiting NGO payment to finalize payout.",
      status: "AWAITING_NGO_PAYMENT"
    });
  } catch (error) {
    console.error("Rider OTP verification error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export const POST = withSecurity(riderVerifyHandler, { limit: 10 });
