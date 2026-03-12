import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

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
    const updateData: any = { status };

    // If a donor approves a request, mark the donation as 'REQUESTED' (or 'APPROVED')
    if (status === "APPROVED" && (isDonor || isAdmin)) {
      await prisma.foodDonation.update({
        where: { id: pickupRequest.donationId },
        data: { status: "REQUESTED" },
      });
      
      // Optionally reject all other pending requests for the same donation
      await prisma.pickupRequest.updateMany({
        where: {
          donationId: pickupRequest.donationId,
          id: { not: id },
          status: "PENDING",
        },
        data: { status: "REJECTED" },
      });
    }

    // If marked as COMPLETED, update the donation status to 'COLLECTED'
    if (status === "COMPLETED") {
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
