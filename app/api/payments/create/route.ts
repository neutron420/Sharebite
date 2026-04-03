import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { createOrder } from "@/lib/razorpay";

export async function POST(request: Request) {
  let requestId: string | undefined;
  let amount: number | string | undefined;

  try {
    const session = await getSession({ preferredRole: "NGO", request });
    if (!session || session.role !== "NGO") {
      return NextResponse.json({ error: "Only NGOs can pay for delivery" }, { status: 401 });
    }

    const serverKeyId = process.env.RAZORPAY_KEY_ID;
    const serverKeySecret = process.env.RAZORPAY_KEY_SECRET;
    const publicKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || serverKeyId;

    if (!serverKeyId || !serverKeySecret) {
       console.error("RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is missing!", {
         hasServerKeyId: !!serverKeyId,
         hasServerKeySecret: !!serverKeySecret,
         hasPublicKeyId: !!publicKeyId,
         nodeEnv: process.env.NODE_ENV,
       });
       return NextResponse.json({ error: "Server Configuration Error: Razorpay keys are missing." }, { status: 500 });
    }

    const body = await request.json();
    requestId = body.requestId;
    amount = body.amount;

    if (!requestId || amount === undefined || amount === null) {
      return NextResponse.json({ error: "Request ID and amount are required" }, { status: 400 });
    }

    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const pickupRequest = await prisma.pickupRequest.findUnique({
      where: { id: requestId },
      include: { donation: true, payment: { select: { status: true } } }
    });

    if (!pickupRequest || pickupRequest.ngoId !== session.userId) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    if (
      pickupRequest.status !== "COMPLETED" ||
      (pickupRequest.step || 0) < 3.5 ||
      (pickupRequest.step || 0) >= 4
    ) {
      return NextResponse.json(
        { error: "Rider payout can only be released after NGO PIN verification." },
        { status: 400 }
      );
    }

    if (pickupRequest.payment?.status === "SUCCESS") {
      return NextResponse.json(
        { error: "Rider payout is already released for this mission." },
        { status: 400 }
      );
    }

    const order = await createOrder(numericAmount, `pickup_${requestId}`);

    const payment = await prisma.payment.create({
      data: {
        amount: Number(amount),
        razorpayOrderId: order.id,
        userId: session.userId,
        status: "PENDING",
      }
    });

    await prisma.pickupRequest.update({
      where: { id: requestId },
      data: { paymentId: payment.id }
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      paymentId: payment.id,
      keyId: publicKeyId,
    });
  } catch (error: unknown) {
    let message = "Unknown error";
    let stack = undefined;
    if (error instanceof Error) {
      message = error.message;
      stack = error.stack;
    }
    console.error("Payment creation error details:", {
      message,
      stack,
      requestId,
      amount
    });
    return NextResponse.json({ 
      error: "Failed to initialize payment", 
      details: message 
    }, { status: 500 });
  }
}
