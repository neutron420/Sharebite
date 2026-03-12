import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "NGO") {
      return NextResponse.json(
        { error: "Unauthorized. Only NGOs can make pickup requests." },
        { status: 401 }
      );
    }

    // Check if NGO is verified
    const user = await prisma.user.findUnique({
      where: { id: session.userId as string },
      select: { isVerified: true }
    });

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

export async function GET() {
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
                select: { name: true, city: true }
              }
            }
          }
        }
      });
    } else if (session.role === "DONOR") {
      // Donor views requests for their items
      requests = await prisma.pickupRequest.findMany({
        where: {
          donation: { donorId: session.userId as string }
        },
        include: {
          ngo: {
            select: { name: true, city: true, phoneNumber: true }
          },
          donation: true
        }
      });
    }

    return NextResponse.json(requests);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
