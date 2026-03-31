import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { sendEmail } from "@/lib/email";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "RIDER") {
      return NextResponse.json({ error: "Only riders can generate the NGO delivery PIN" }, { status: 401 });
    }

    const { id: requestId } = await params;


    const pickupRequest = await prisma.pickupRequest.findUnique({
      where: { id: requestId },
      include: { ngo: true, donation: true, payment: { select: { status: true } } }
    });

    if (!pickupRequest || pickupRequest.riderId !== session.userId) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    const isPayoutFlowWindow =
      pickupRequest.status === "COMPLETED" &&
      !!pickupRequest.deliveryImageUrl &&
      (pickupRequest.step || 0) >= 3.4 &&
      (pickupRequest.step || 0) < 3.5;

    if (!isPayoutFlowWindow) {
      return NextResponse.json(
        { error: "The NGO delivery PIN can only be generated after mission completion and before payout verification." },
        { status: 400 }
      );
    }

    if (pickupRequest.payment?.status === "SUCCESS" || (pickupRequest.step || 0) >= 4) {
      return NextResponse.json(
        { error: "Rider payout is already released for this mission." },
        { status: 400 }
      );
    }

    if (!pickupRequest.ngo.email) {
      return NextResponse.json({ error: "NGO email is missing for this request" }, { status: 400 });
    }

    await prisma.oTPVerification.deleteMany({
      where: { orderId: requestId }
    });

    // Generate a separate NGO-side delivery PIN.
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const expiry = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

    // 3. Store OTP
    await prisma.oTPVerification.create({
      data: {
        otp,
        expiry,
        orderId: requestId,
      }
    });

    const emailResult = await sendEmail({
      to: pickupRequest.ngo.email,
      subject: "NGO Delivery PIN - Sharebite",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #fff8f1; padding: 20px; border-radius: 12px; border: 1px solid #ffd8a8;">
          <h2 style="color: #e8590c;">NGO Delivery PIN</h2>
          <p>The rider has completed delivery. Please share this PIN to confirm takeover of <strong>"${pickupRequest.donation.title}"</strong> and unlock the rider payout flow:</p>
          <div style="background: #e8590c; color: #ffffff; font-size: 32px; font-weight: bold; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0; letter-spacing: 5px;">
            ${otp}
          </div>
          <p style="color: #495057; font-size: 14px;">This PIN will expire in 5 minutes.</p>
          <p style="color: #adb5bd; font-size: 12px; margin-top: 20px;">Thank you for using Sharebite!</p>
        </div>
      `
    });

    if (!emailResult.success) {
      await prisma.oTPVerification.deleteMany({
        where: { orderId: requestId }
      });
      return NextResponse.json(
        { error: "Failed to send NGO delivery PIN email. Please retry." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      message: "NGO delivery PIN sent successfully",
    });
  } catch (error) {
    console.error("OTP send error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
