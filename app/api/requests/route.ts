import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { withSecurity } from "@/lib/api-handler";
import { createNotification } from "@/lib/notifications";

async function postRequestHandler(request: Request) {
  try {
    const session = await getSession({ preferredRole: "NGO", request });
    if (!session || session.role !== "NGO") {
      return NextResponse.json(
        { error: "Unauthorized. Only NGOs can make pickup requests." },
        { status: 401 }
      );
    }
    const user = await prisma.user.findUnique({
      where: { id: session.userId as string },
      select: { 
        isVerified: true, 
        isLicenseSuspended: true, 
        suspensionExpiresAt: true,
        ngoVerification: {
          select: {
            status: true,
          },
        },
      }
    });

    if (user?.isLicenseSuspended) {
      return NextResponse.json(
        { error: "Access Denied. Your NGO license has been permanently suspended due to policy violations." },
        { status: 403 }
      );
    }

    if (user?.suspensionExpiresAt && new Date() < new Date(user.suspensionExpiresAt)) {
      const remainingTime = Math.ceil((new Date(user.suspensionExpiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      return NextResponse.json(
        { error: `Access Denied. Your account is temporarily blocked for ${remainingTime} more days.` },
        { status: 403 }
      );
    }

    const verificationStatus = user?.ngoVerification?.status;
    const canOperateAfterOnlineReview =
      verificationStatus === "ONLINE_VERIFIED" ||
      verificationStatus === "FIELD_VISIT_SCHEDULED" ||
      verificationStatus === "FIELD_VERIFIED" ||
      verificationStatus === "FULLY_VERIFIED";

    if (!user?.isVerified && !canOperateAfterOnlineReview) {
      const messageByStatus: Record<string, string> = {
        PENDING: "Access Denied. Your NGO documents are pending online admin verification.",
        REJECTED: "Access Denied. Your NGO verification was rejected. Please re-upload valid documents.",
      };

      return NextResponse.json(
        {
          error:
            (verificationStatus && messageByStatus[verificationStatus]) ||
            "Access Denied. Your NGO account must complete online verification before requesting food.",
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { donationId, message } = body;

    if (!donationId) {
      return NextResponse.json({ error: "Donation ID is required" }, { status: 400 });
    }

    // Check if donation is still available and not expired
    const donation = await prisma.foodDonation.findUnique({
      where: { id: donationId },
    });

    if (!donation || donation.status !== "AVAILABLE") {
      return NextResponse.json(
        { error: "This donation is no longer available" },
        { status: 400 }
      );
    }

    if (new Date(donation.expiryTime) < new Date()) {
       // Mark it as expired in the DB for safety consistency
       await prisma.foodDonation.update({
         where: { id: donationId },
         data: { status: "EXPIRED" }
       });
       return NextResponse.json(
         { error: "Access Denied. This donation has expired and is no longer safe for human consumption." },
         { status: 400 }
       );
    }

    // Create pickup request with NGO details for the notification
    const pickupRequest = await prisma.pickupRequest.create({
      data: {
        donationId,
        ngoId: session.userId as string,
        message: message || "",
        status: "PENDING",
      },
      include: {
        ngo: { select: { name: true } }
      }
    });

    // Notify the donor with real-time socket support
    await createNotification({
      userId: donation.donorId,
      type: "REQUEST_STATUS",
      title: "New Pickup Request",
      message: `NGO "${pickupRequest.ngo.name}" has requested your donation: "${donation.title}".`,
      link: `/donor/donations/${donation.id}`,
    });

    return NextResponse.json(pickupRequest, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') { // Prisma unique constraint error
      return NextResponse.json(
        { error: "You have already requested this donation" },
        { status: 400 }
      );
    }
    console.error("Pickup request error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

async function getRequestsHandler(request: Request) {
  try {
    const session = await getSession({ request });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    let requests;

    if (session.role === "NGO") {
      // NGO views their own requests
      requests = await prisma.pickupRequest.findMany({
        where: { ngoId: session.userId as string },
        include: {
          donation: {
            include: {
              donor: {
                select: { name: true, city: true, latitude: true, longitude: true, address: true }
              }
            }
          },
          ngo: {
            select: { name: true, city: true, latitude: true, longitude: true, address: true }
          },
          rider: {
            select: { id: true, name: true }
          },
          payment: {
            select: { status: true, razorpayOrderId: true }
          },
          otps: {
            orderBy: { createdAt: "desc" },
            take: 1
          }
        }
      });
      requests = requests.map((pickupRequest: any) => ({
        ...pickupRequest,
        handoverPin: undefined,
        deliveryPin: (pickupRequest.step >= 3.4 && pickupRequest.step < 3.5 && pickupRequest.otps?.[0]) 
          ? pickupRequest.otps[0].otp 
          : undefined
      }));
    } else if (session.role === "DONOR") {
      // Donor views requests for their items
      requests = await prisma.pickupRequest.findMany({
        where: {
          donation: { donorId: session.userId as string },
          ngo: {
            isLicenseSuspended: false,
            OR: [
              { suspensionExpiresAt: null },
              { suspensionExpiresAt: { lte: new Date() } }
            ]
          }
        },
        include: {
          ngo: {
            select: { name: true, city: true, phoneNumber: true }
          },
          donation: true
        }
      });
    } else if (session.role === "RIDER") {
      const riderProfile = await prisma.user.findUnique({
        where: { id: session.userId as string },
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
        const statusMessageByStage: Record<string, string> = {
          PENDING_NGO_REVIEW: "Your rider profile is waiting for NGO verification.",
          NGO_APPROVED: "Your rider profile is NGO-approved and now waiting for final admin verification.",
          NGO_REJECTED: "Your rider onboarding request was rejected by the selected NGO.",
          ADMIN_REJECTED: "Your rider verification was rejected by admin.",
        };

        return NextResponse.json(
          {
            error:
              (verificationStatus && statusMessageByStage[verificationStatus]) ||
              "Your rider profile is not verified yet.",
            verificationStatus: verificationStatus || null,
          },
          { status: 403 }
        );
      }

      // Rider views their assigned requests OR unassigned requests that need a rider
      requests = await prisma.pickupRequest.findMany({
        where: {
          OR: [
            { riderId: session.userId as string },
            { 
              riderId: null, 
              status: { in: ["APPROVED", "ASSIGNED"] }, 
              donation: { 
                status: { not: "EXPIRED" }
              }
            }
          ]
        },
        include: {
          donation: {
            include: {
              donor: { select: { name: true, city: true, address: true, latitude: true, longitude: true } }
            }
          },
          ngo: {
             select: { name: true, city: true, address: true, latitude: true, longitude: true }
          },
          payment: {
            select: { status: true, razorpayOrderId: true }
          },
        }
      });
      requests = requests.map((pickupRequest: any) => ({
        ...pickupRequest,
        handoverPin: undefined,
      }));
    }

    return NextResponse.json(requests);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export const POST = withSecurity(postRequestHandler, { limit: 10 });
export const GET = withSecurity(getRequestsHandler, { limit: 60 });
