import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import crypto from "crypto";
import { createNotification } from "@/lib/notifications";

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-razorpay-signature");
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!secret || !signature) {
      return NextResponse.json({ error: "Missing secret or signature" }, { status: 400 });
    }

    // 1. Verify the webhook signature for security
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");

    if (expectedSignature !== signature) {
      return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
    }

    // 2. Parse the verified payload
    const body = JSON.parse(rawBody);
    const event = body.event;

    // 3. Handle specific events (e.g., payment.captured)
    if (event === "payment.captured") {
      const { order_id, id: payment_id } = body.payload.payment.entity;

      // Update payment record in database
      const payment = await prisma.payment.findUnique({
        where: { razorpayOrderId: order_id }
      });

      if (payment && payment.status === "PENDING") {
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            razorpayPaymentId: payment_id,
            status: "SUCCESS"
          }
        });

        // Link back to PickupRequest and mark as PAID/ASSIGNED
        const pickupRequest = await prisma.pickupRequest.findFirst({
          where: { paymentId: payment.id }
        });

        if (pickupRequest) {
          const isPayoutFlow = (pickupRequest.step || 0) >= 3.5;

          await prisma.pickupRequest.update({
            where: { id: pickupRequest.id },
            data: isPayoutFlow
              ? {
                  status: "COMPLETED",
                  step: 4,
                  completedAt: pickupRequest.completedAt ?? new Date(),
                }
              : { status: "ASSIGNED" }
          });

          // Trigger real-time notification to the NGO via WebSocket
          await createNotification({
            userId: payment.userId,
            type: "REQUEST_STATUS",
            title: "Payment Confirmed (Webhook)",
            message: isPayoutFlow
              ? "Rider payout has been successfully recorded through the failsafe relay."
              : "Your payment has been successfully recorded in our system through the failsafe relay.",
            link: `/ngo/requests/${pickupRequest.id}`
          });
        }
      }
    }

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
