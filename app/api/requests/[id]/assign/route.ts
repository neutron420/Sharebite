import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { withSecurity } from "@/lib/api-handler";
import { createNotification } from "@/lib/notifications";

/**
 * PATCH /api/requests/[id]/assign
 * Allows an NGO to assign a RIDER to their pickup request.
 */
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
      include: { donation: true }
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
