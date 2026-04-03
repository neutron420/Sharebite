import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { withSecurity } from "@/lib/api-handler";
import { createNotification } from "@/lib/notifications";



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

    if (session.role === "RIDER") {
      const riderProfile = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          isVerified: true,
          riderVerifications: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { status: true },
          },
        },
      });

      if (!riderProfile?.isVerified) {
        const verificationStatus = riderProfile?.riderVerifications?.[0]?.status;
        return NextResponse.json(
          {
            error:
              verificationStatus === "NGO_APPROVED"
                ? "Final admin verification is pending. You cannot claim missions yet."
                : "Your rider profile is not verified yet.",
            verificationStatus: verificationStatus || null,
          },
          { status: 403 }
        );
      }
    }

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

    // 7. Tell the donor to share the pickup PIN directly with the rider.
    await createNotification({
      userId: pickupRequest.donation.donorId,
      type: "REQUEST_STATUS",
      title: "Rider Assigned",
      message: `A rider has been assigned for "${pickupRequest.donation.title}". Please share your pickup PIN directly with the rider at collection time.`,
      link: `/donor/donations/${pickupRequest.donationId}`
    });


    return NextResponse.json({
      message: "Rider assigned successfully",
      requestId: updatedRequest.id,
      handoverPinRequired: true
    });
  } catch (error) {
    console.error("Rider assignment error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export const PATCH = withSecurity(assignRiderHandler, { limit: 10 });
