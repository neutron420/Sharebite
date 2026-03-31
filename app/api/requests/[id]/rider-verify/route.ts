import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";
import { sendEmail } from "@/lib/email";
import { RIDER_PAYOUT_AMOUNT_INR } from "@/lib/payout";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "RIDER") {
      return NextResponse.json({ error: "Only riders can verify the NGO delivery PIN" }, { status: 401 });
    }

    const { otp } = await request.json();
    if (typeof otp !== "string" || !/^\d{4}$/.test(otp)) {
      return NextResponse.json({ error: "A valid 4-digit NGO delivery PIN is required" }, { status: 400 });
    }

    const { id: requestId } = await params;

    const existingRequest = await prisma.pickupRequest.findUnique({
      where: { id: requestId },
      include: { donation: true, ngo: true }
    });

    if (!existingRequest || existingRequest.riderId !== session.userId) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    if (existingRequest.step === 3.5 || existingRequest.status === "COMPLETED") {
      return NextResponse.json({ error: "NGO takeover is already verified for this mission." }, { status: 400 });
    }

    if (existingRequest.status !== "ON_THE_WAY" || (existingRequest.step || 0) < 3) {
      return NextResponse.json({ error: "Donor pickup must be verified before the NGO delivery PIN can be used." }, { status: 400 });
    }

    const latestOtp = await prisma.oTPVerification.findFirst({
      where: {
        orderId: requestId,
        expiry: { gt: new Date() }
      },
      orderBy: { createdAt: "desc" }
    });

    if (!latestOtp || latestOtp.otp !== otp) {
      return NextResponse.json({ error: "Invalid or expired NGO delivery PIN" }, { status: 400 });
    }

    await prisma.$transaction([
      prisma.pickupRequest.update({
        where: { id: requestId },
        data: {
          status: "ASSIGNED",
          step: 3.5,
          completedAt: null,
        },
      }),
      prisma.foodDonation.update({
        where: { id: existingRequest.donationId },
        data: { status: "COLLECTED" }
      }),
      prisma.oTPVerification.deleteMany({
        where: { orderId: requestId }
      }),
    ]);

    await createNotification({
      userId: existingRequest.ngoId,
      type: "REQUEST_STATUS",
      title: "NGO Takeover Verified",
      message: `You have confirmed receipt of "${existingRequest.donation.title}". Please release the rider payout to finish the mission.`,
      link: `/ngo/requests/${requestId}`
    });

    const payoutAmount = RIDER_PAYOUT_AMOUNT_INR;

    await createNotification({
      userId: session.userId,
      type: "SYSTEM",
      title: "NGO Takeover Verified",
      message: `The NGO has confirmed receipt of "${existingRequest.donation.title}". Payout of ₹${payoutAmount} is now waiting for NGO release.`,
      link: "/rider"
    });

    if (existingRequest.ngo?.email) {
      await sendEmail({
        to: existingRequest.ngo.email,
        subject: `NGO Takeover Confirmed: ${existingRequest.donation.title}`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #10b981;">NGO Takeover Verified</h2>
            <p>You have confirmed receipt of: <strong>${existingRequest.donation.title}</strong>.</p>
            <div style="background: #f0fdf4; padding: 20px; text-align: center; border-radius: 10px; margin: 20px 0; border: 1px solid #bbf7d0;">
              <p style="text-transform: uppercase; font-size: 10px; font-weight: 900; color: #166534; margin-bottom: 5px; tracking-widest: 2px;">Status: TAKEOVER CONFIRMED</p>
              <h1 style="font-size: 24px; font-weight: 900; color: #064e3b; margin: 0; letter-spacing: -1px;">Release Rider Payout</h1>
            </div>
            <p style="font-size: 14px; color: #64748b;">Please proceed to your dashboard to release the rider payout and finalize this mission.</p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://neutrondev.in'}/ngo/requests/${requestId}" 
               style="display: inline-block; background: #0f172a; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; margin-top: 10px;">
               Release Rider Payout
            </a>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="font-size: 11px; color: #94a3b8; font-weight: 800; text-transform: uppercase; tracking-widest: 1px;">ShareBite Logistics Hub | Operation Concluded</p>
          </div>
        `
      });
    }

    return NextResponse.json({
      message: "NGO takeover verified. Awaiting NGO payment to finalize payout.",
      status: "AWAITING_NGO_PAYMENT"
    });
  } catch (error) {
    console.error("Rider OTP verification error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
