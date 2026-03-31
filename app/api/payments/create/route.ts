import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { createOrder } from "@/lib/razorpay";

export async function POST(request: Request) {
  let requestId: string | undefined;
  let amount: number | string | undefined;

  try {
    const session = await getSession();
    if (!session || session.role !== "NGO") {
      return NextResponse.json({ error: "Only NGOs can pay for delivery" }, { status: 401 });
    }

    const body = await request.json();
    requestId = body.requestId;
    amount = body.amount;

    if (!requestId || !amount) {
      return NextResponse.json({ error: "Request ID and amount are required" }, { status: 400 });
    }

    const pickupRequest = await prisma.pickupRequest.findUnique({
      where: { id: requestId },
      include: { donation: true }
    });

    if (!pickupRequest || pickupRequest.ngoId !== session.userId) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    const numericAmount = Number(amount);
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
    });
  } catch (error: any) {
    console.error("Payment creation error details:", {
      message: error.message,
      stack: error.stack,
      requestId,
      amount
    });
    return NextResponse.json({ 
      error: "Failed to initialize payment", 
      details: error.message 
    }, { status: 500 });
  }
}
