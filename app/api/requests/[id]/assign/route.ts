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
    if (!session || session.role !== "NGO") {
      return NextResponse.json({ error: "Unauthorized. NGO only." }, { status: 401 });
    }

    const userId = session.userId as string;

    const { id } = await params;
    const { riderId } = await request.json();
    if (!riderId) {
      return NextResponse.json({ error: "Rider ID is required" }, { status: 400 });
    }

    // 1. Verify the request belongs to this NGO and is in a valid state
    const pickupRequest = await prisma.pickupRequest.findUnique({
      where: { id },
      include: { donation: true }
    });

    if (!pickupRequest || pickupRequest.ngoId !== userId) {
      return NextResponse.json({ error: "Request not found or access denied" }, { status: 404 });
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
        riderId,
        status: "ASSIGNED",
        handoverPin: pin,
        step: 2 // Move to 'Assigned' step
      }
    });

    // 4. Update Rider availability
    await prisma.user.update({
      where: { id: riderId },
      data: { isAvailable: false }
    });

    // 5. Notify the Rider
    await createNotification({
      userId: riderId,
      type: "REQUEST_STATUS",
      title: "New Delivery Assigned! 🛵",
      message: `You have been assigned to pick up food for ${updatedRequest.id.split('-')[0]}. Drive safe!`,
      link: `/rider/tasks/${updatedRequest.id}`
    });

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
