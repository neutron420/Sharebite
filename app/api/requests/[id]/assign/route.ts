import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { withSecurity } from "@/lib/api-handler";
import { createNotification } from "@/lib/notifications";
import { sendEmail } from "@/lib/email";



async function assignRiderHandler(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "NGO" && session.role !== "RIDER")) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const userId = session.userId as string;
    const { id } = await params;
    const body = await request.json();
    const targetRiderId = session.role === "RIDER" ? userId : body.riderId;

    if (!targetRiderId) {
      return NextResponse.json({ error: "Rider ID is required" }, { status: 400 });
    }

    // 1. Verify the request is in a valid state
    const pickupRequest = await prisma.pickupRequest.findUnique({
      where: { id },
      include: { 
        donation: true,
        ngo: true 
      }
    });


    if (!pickupRequest) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    // Role specific access checks
    if (session.role === "NGO" && pickupRequest.ngoId !== userId) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    if (pickupRequest.status !== "APPROVED") {
      return NextResponse.json(
        { error: "Rider can only be assigned to approved requests" },
        { status: 400 }
      );
    }

    // 2. Generate handover PIN if not exists
    const pin = pickupRequest.handoverPin || Math.floor(1000 + Math.random() * 9000).toString();

    // 3. Update the request
    const updatedRequest = await prisma.pickupRequest.update({
      where: { id },
      data: {
        riderId: targetRiderId,
        status: "ASSIGNED",
        handoverPin: pin,
        step: 2 // Move to 'Assigned' step
      }
    });

    // 4. Update Rider availability
    await prisma.user.update({
      where: { id: targetRiderId },
      data: { isAvailable: false }
    });

    // 5. Notify the Rider (if assigned by NGO)
    if (session.role === "NGO") {
      await createNotification({
        userId: targetRiderId,
        type: "REQUEST_STATUS",
        title: "New Delivery Assigned! 🛵",
        message: `You have been assigned to pick up food for "${pickupRequest.donation.title}".`,
        link: `/rider/mission/${updatedRequest.id}`
      });
    }

    // 6. Notify the NGO (if claimed by Rider)
    if (session.role === "RIDER") {
        await createNotification({
            userId: pickupRequest.ngoId,
            type: "REQUEST_STATUS",
            title: "Rider Claimed Bounty! 🛵",
            message: `An Elite Operative has claimed your pickup request for "${pickupRequest.donation.title}".`,
            link: `/ngo/requests`
        });
    }

    // 7. Send PIN to NGO Email
    if (pickupRequest.ngo?.email) {
      await sendEmail({
        to: pickupRequest.ngo.email,
        subject: `Handover PIN for "${pickupRequest.donation.title}"`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #ea580c;">Handover PIN Generated</h2>
            <p>A rider has been assigned to your pickup request: <strong>${pickupRequest.donation.title}</strong>.</p>
            <div style="background: #f8fafc; padding: 20px; text-align: center; border-radius: 10px; margin: 20px 0;">
              <p style="text-transform: uppercase; font-size: 12px; font-weight: bold; color: #64748b; margin-bottom: 5px;">Handover PIN</p>
              <h1 style="font-size: 48px; font-weight: 900; color: #0f172a; margin: 0; letter-spacing: 10px;">${pin}</h1>
            </div>
            <p style="font-size: 14px; color: #64748b;">Share this PIN with the donor. The rider will need it to verify the collection.</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="font-size: 12px; color: #94a3b8;">ShareBite Logistics Intelligence Hub</p>
          </div>
        `
      });
    }


    return NextResponse.json({
      message: "Rider assigned successfully",
      requestId: updatedRequest.id,
      handoverPin: pin // Only returned to NGO (who will tell the Donor)
    });
  } catch (error) {
    console.error("Rider assignment error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export const PATCH = withSecurity(assignRiderHandler, { limit: 10 });
