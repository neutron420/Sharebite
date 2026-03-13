import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status } = body; // APPROVED, REJECTED, COMPLETED

    const pickupRequest = await prisma.pickupRequest.findUnique({
      where: { id },
      include: { donation: true },
    });

    if (!pickupRequest) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    // Authorization checks
    const isDonor = pickupRequest.donation.donorId === session.userId;
    const isNGO = pickupRequest.ngoId === session.userId;
    const isAdmin = session.role === "ADMIN";

    if (!isDonor && !isNGO && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Logic for updating status
    const updateData: any = {};
    if (status) updateData.status = status;
    const { step } = body;

    // 1. Approval Logic (Donor/Admin only)
    if (status === "APPROVED" && (isDonor || isAdmin)) {
      // Generate a random 4-digit PIN for secure handover
      const rawPin = Math.floor(1000 + Math.random() * 9000).toString();
      updateData.handoverPin = rawPin;
      updateData.step = 2; // Move to Approved step

      await prisma.foodDonation.update({
        where: { id: pickupRequest.donationId },
        data: { status: "APPROVED" },
      });
      
      // Reject all other pending requests for the same donation
      await prisma.pickupRequest.updateMany({
        where: {
          donationId: pickupRequest.donationId,
          id: { not: id },
          status: "PENDING",
        },
        data: { status: "REJECTED" },
      });

      // Special notification for NGO with PIN instructions (don't send PIN in notification for security, tell them to check dashboard)
      await createNotification({
        userId: pickupRequest.ngoId,
        type: "REQUEST_STATUS",
        title: "Request Approved!",
        message: `Your request for "${pickupRequest.donation.title}" is approved. Check your dashboard for the Handover PIN.`,
        link: `/dashboard/requests/${id}`
      });
    }

    // 2. NGO marks as "Out for Pickup" (NGO only)
    if (step === 3 && isNGO) {
      updateData.step = 3;
      
      // Notify Donor that NGO is on the way
      await createNotification({
        userId: pickupRequest.donation.donorId,
        type: "REQUEST_STATUS",
        title: "NGO is on the way!",
        message: `An NGO representative for "${pickupRequest.donation.title}" has started the pickup journey.`,
        link: `/dashboard/requests/${id}`
      });
    }

    // 3. Status COMPLETED (Handled via PIN verification route usually, but keeping here for Admin)
    if (status === "COMPLETED" && (isDonor || isAdmin)) {
      updateData.step = 4;
      await prisma.foodDonation.update({
        where: { id: pickupRequest.donationId },
        data: { status: "COLLECTED" },
      });
    }

    const updatedRequest = await prisma.pickupRequest.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updatedRequest);
  } catch (error) {
    console.error("Update request error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
