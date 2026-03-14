import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { withSecurity } from "@/lib/api-handler";
import { createNotification } from "@/lib/notifications";
import redis from "@/lib/redis";

async function handoverHandler(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "RIDER") {
      return NextResponse.json({ error: "Unauthorized. Riders only." }, { status: 401 });
    }

    const userId = session.userId as string;

    const { id } = await params;
    const { pin } = await request.json();
    if (!pin) {
      return NextResponse.json({ error: "PIN is required for handover" }, { status: 400 });
    }

    // 1. Fetch the request and ensure the rider is the one assigned
    const pickupRequest = await prisma.pickupRequest.findUnique({
      where: { id },
      include: { donation: true }
    });

    if (!pickupRequest || pickupRequest.riderId !== userId) {
      return NextResponse.json({ error: "Unauthorized. You are not assigned to this task." }, { status: 403 });
    }

    // SECURITY: Ensure we are at the correct step (Assigned/Step 2)
    if (pickupRequest.status !== "ASSIGNED" || pickupRequest.step !== 2) {
      return NextResponse.json({ error: "Invalid request state for handover." }, { status: 400 });
    }

    // 2. PIN Validation
    if (pickupRequest.handoverPin !== pin) {
      return NextResponse.json({ error: "Invalid Handover PIN. Please check with the donor." }, { status: 400 });
    }

    // 3. Update the transaction
    const updatedRequest = await prisma.pickupRequest.update({
      where: { id },
      data: {
        status: "ON_THE_WAY", // Rider has the food and is going to NGO
        step: 4, // Handover Completed
        pickedUpAt: new Date()
      }
    });

    // 4. Update the Donation Status to COLLECTED
    await prisma.foodDonation.update({
      where: { id: pickupRequest.donationId },
      data: { status: "COLLECTED" }
    });

    // 5. Notify the NGO
    await createNotification({
      userId: pickupRequest.ngoId,
      type: "REQUEST_STATUS",
      title: "Food Collected! 📦",
      message: `The rider has successfully picked up the food for your request. It's now on the way!`,
      link: `/dashboard/requests/${id}`
    });

    // 6. Notify the Donor
    await createNotification({
      userId: pickupRequest.donation.donorId,
      type: "REQUEST_STATUS",
      title: "Handover Confirmed",
      message: `Thank you for the donation! The rider has collected the food.`,
      link: `/donor/donations/${pickupRequest.donationId}`
    });
    
    return NextResponse.json({ 
      success: true, 
      message: "Handover verified. Please deliver the food to the NGO location." 
    });

  } catch (error) {
    console.error("Handover verification error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export const PATCH = withSecurity(handoverHandler, { limit: 20 });
