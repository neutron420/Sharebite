import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import crypto from "crypto";
import { sendEmail } from "@/lib/email";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "RIDER") {
      return NextResponse.json({ error: "Only riders can trigger OTP" }, { status: 401 });
    }

    const { id: requestId } = await params;


    const pickupRequest = await prisma.pickupRequest.findUnique({
      where: { id: requestId },
      include: { ngo: true, donation: true }
    });

    if (!pickupRequest || pickupRequest.riderId !== session.userId) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    const contentType = request.headers.get("Content-Type");
    let body: any = {};
    if (contentType?.includes("application/json")) {
      body = await request.json().catch(() => ({}));
    }

    if (body.deliveryImageUrl) {
      await prisma.pickupRequest.update({
        where: { id: requestId },
        data: { deliveryImageUrl: body.deliveryImageUrl }
      });
    }

    // 2. Generate 4-digit OTP
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

    // 4. Send email to NGO/Donor (whichever is the "customer" in this context)
    // Here we'll send it to the NGO who paid
    await sendEmail({
      to: pickupRequest.ngo.email,
      subject: "📦 Food Delivered! Release Payment to your Rider - Sharebite",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #fff8f1; padding: 20px; border-radius: 12px; border: 1px solid #ffd8a8;">
          <h2 style="color: #e8590c;">Delivery Verification & Payout Code</h2>
          <p>Your donation <strong>"${pickupRequest.donation.title}"</strong> has been safely delivered!</p>
          <p>Please inspect the food. If everything is good, share this 4-digit OTP with the rider to verify the delivery and unlock their payout:</p>
          <div style="background: #e8590c; color: #ffffff; font-size: 32px; font-weight: bold; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0; letter-spacing: 5px;">
            ${otp}
          </div>
          <p style="color: #495057; font-size: 14px;">This code will expire in 5 minutes.</p>
          <p style="color: #adb5bd; font-size: 12px; margin-top: 20px;">Thank you for using Sharebite!</p>
        </div>
      `
    });

    return NextResponse.json({
      message: "OTP sent successfully to NGO's email",
    });
  } catch (error) {
    console.error("OTP send error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
