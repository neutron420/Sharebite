import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";
import redis from "@/lib/redis";
import { RequestStatus } from "@/app/generated/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const pickupRequest = await prisma.pickupRequest.findUnique({
      where: { id },
      include: {
        donation: {
          include: {
            donor: {
              select: {
                id: true,
                name: true,
                city: true,
                latitude: true,
                longitude: true,
                phoneNumber: true
              }
            }
          }
        },
        ngo: {
          select: {
            id: true,
            name: true,
            city: true,
            latitude: true,
            longitude: true
          }
        },
        rider: {
          select: {
            id: true,
            name: true,
            city: true
          }
        },
        payment: true
      }
    });

    if (!pickupRequest) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    // Role-based authorization
    const isDonor = pickupRequest.donation.donorId === session.userId;
    const isNGO = pickupRequest.ngoId === session.userId;
    const isAdmin = session.role === "ADMIN";
    const isRider = pickupRequest.riderId === session.userId;

    if (!isDonor && !isNGO && !isAdmin && !isRider) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let responseData: any = { ...pickupRequest };

    // Share the latest OTP with the NGO so they can tell the rider
    if (isNGO && (pickupRequest.step || 0) >= 3.4 && (pickupRequest.step || 0) < 3.5) {
      const otpEntry = await prisma.oTPVerification.findFirst({
        where: { orderId: id },
        orderBy: { createdAt: "desc" }
      });
      if (otpEntry) {
        responseData.deliveryPin = otpEntry.otp;
      }
    }

    if (!isDonor && !isAdmin) {
      responseData.handoverPin = undefined;
    }

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Fetch request error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

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
    const updateData: {
      status?: RequestStatus;
      handoverPin?: string;
      step?: number;
    } = {};
    if (status) updateData.status = status as RequestStatus;
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

      // Special notification for NGO with PIN instructions
      await createNotification({
        userId: pickupRequest.ngoId,
        type: "REQUEST_STATUS",
        title: "Request Approved!",
        message: `Your request for "${pickupRequest.donation.title}" is approved. The donor pickup PIN is separate and will be shared at collection time.`,
        link: `/ngo/requests/${id}`
      });

      // Broadcast to Riders that a "Bounty" is available
      const riders = await prisma.user.findMany({
        where: { role: "RIDER", isVerified: true, isAvailable: true },
        select: { id: true }
      });

      if (riders.length > 0) {
        await createNotification({
          userIds: riders.map(r => r.id),
          type: "SYSTEM",
          title: "New Bounty Available! 📦",
          message: `A new pickup for "${pickupRequest.donation.title}" in ${pickupRequest.donation.city} needs a rider.`,
          link: `/rider/mission/${id}`
        });
      }
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
        link: `/donor/requests`
      });
    }

    // 3. Status COMPLETED (Handled via PIN verification route usually, but keeping here for Admin)
    if (status === "COMPLETED" && (isDonor || isAdmin)) {
      updateData.step = 4;
      await prisma.foodDonation.update({
        where: { id: pickupRequest.donationId },
        data: { status: "COLLECTED" },
      });

      // Remove from map
      await redis.zrem("donations:geo", pickupRequest.donationId);
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
