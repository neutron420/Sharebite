import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifySignature } from "@/lib/razorpay";
import { createNotification } from "@/lib/notifications";

export async function POST(request: Request) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, requestId } = await request.json();

    // 1. Verify signatures
    const isValid = verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);

    if (!isValid) {
      return NextResponse.json({ error: "Invalid Razorpay signature" }, { status: 400 });
    }

    // 2. Update payment record
    const payment = await prisma.payment.update({
      where: { razorpayOrderId: razorpay_order_id },
      data: {
        razorpayPaymentId: razorpay_payment_id,
        status: "SUCCESS"
      }
    });

    // 3. Mark the PickupRequest as PAID
    const pickupRequest = await prisma.pickupRequest.findUnique({
      where: { id: requestId },
      include: { rider: true }
    });

    if (!pickupRequest) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    let statusUpdate: any = { status: "ASSIGNED" };
    let isPayout = false;

    // Handle post-delivery payout flow
    if (pickupRequest.step === 3.5) {
      statusUpdate = {
        status: "COMPLETED",
        step: 4,
        completedAt: new Date()
      };
      isPayout = true;
    }

    const updatedRequest = await prisma.pickupRequest.update({
      where: { id: requestId },
      data: statusUpdate
    });

    // 4. If it was a payout, credit the rider's wallet
    if (isPayout && pickupRequest.riderId) {
      const { creditRiderWallet, addRewardPoints } = await import("@/lib/rider-service");
      await creditRiderWallet(pickupRequest.riderId, payment.amount, requestId);
      await addRewardPoints(pickupRequest.riderId, 10); // 10 points for completion

      // Notify Rider about wallet credit
      await createNotification({
        userId: pickupRequest.riderId,
        type: "SYSTEM",
        title: "Payout Received!",
        message: `₹${payment.amount} has been successfully added to your wallet for the delivery.`,
        link: "/rider"
      });
    }

    // 5. Notify about payment successful
    await createNotification({
      userId: payment.userId,
      type: "REQUEST_STATUS",
      title: isPayout ? "Payout Released!" : "Payment Successful",
      message: isPayout 
        ? "The rider has been paid. Thank you for using ShareBite!" 
        : "Your payment for delivery has been received. A rider will be assigned shortly.",
      link: `/ngo/requests/${requestId}`
    });

    return NextResponse.json({
      message: "Payment verified successfully!",
      payment
    });
  } catch (error) {
    console.error("Payment verification error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
