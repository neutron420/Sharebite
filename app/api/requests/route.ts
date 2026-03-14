import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { withSecurity } from "@/lib/api-handler";

async function postRequestHandler(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "NGO") {
      return NextResponse.json(
        { error: "Unauthorized. Only NGOs can make pickup requests." },
        { status: 401 }
      );
    }

    // Check for verification, blocks, and license suspension
    const user = await prisma.user.findUnique({
      where: { id: session.userId as string },
      select: { 
        isVerified: true, 
        isLicenseSuspended: true, 
        suspensionExpiresAt: true 
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

    if (!user?.isVerified) {
      return NextResponse.json(
        { error: "Access Denied. Your NGO account must be verified by an admin before you can request food." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { donationId, message } = body;

    if (!donationId) {
      return NextResponse.json({ error: "Donation ID is required" }, { status: 400 });
    }

    // Check if donation is still available
    const donation = await prisma.foodDonation.findUnique({
      where: { id: donationId },
    });

    if (!donation || donation.status !== "AVAILABLE") {
      return NextResponse.json(
        { error: "This donation is no longer available" },
        { status: 400 }
      );
    }

    // Create pickup request
    const pickupRequest = await prisma.pickupRequest.create({
      data: {
        donationId,
        ngoId: session.userId as string,
        message,
        status: "PENDING",
      },
    });

    // Notify the donor
    await prisma.notification.create({
      data: {
        userId: donation.donorId,
        type: "REQUEST_STATUS",
        title: "New Pickup Request",
        message: `Your donation "${donation.title}" has a new request from an NGO.`,
        link: `/dashboard/requests/${pickupRequest.id}`,
      }
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

async function getRequestsHandler() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
          }
        }
      });
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
      // Rider views their assigned requests OR unassigned requests that need a rider
      requests = await prisma.pickupRequest.findMany({
        where: {
          OR: [
            { riderId: session.userId as string },
            { 
              riderId: null, 
              status: "APPROVED", // Ready for a rider to pick up
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
          }
        }
      });
    }

    return NextResponse.json(requests);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export const POST = withSecurity(postRequestHandler, { limit: 10 });
export const GET = withSecurity(getRequestsHandler, { limit: 60 });
