import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { withSecurity } from "@/lib/api-handler";

async function getRequestDetailHandler(
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
                address: true, 
                latitude: true, 
                longitude: true 
              }
            }
          }
        },
        ngo: {
          select: { 
            id: true,
            name: true, 
            city: true, 
            address: true, 
            latitude: true, 
            longitude: true 
          }
        },
        rider: {
          select: { id: true, name: true }
        }
      }
    });

    if (!pickupRequest) {
      return NextResponse.json({ error: "Mission not found" }, { status: 404 });
    }

    // Security check: Only Donor, NGO, or Assigned Rider can see full details
    const isDonor = pickupRequest.donation.donorId === session.userId;
    const isNGO = pickupRequest.ngoId === session.userId;
    const isRider = pickupRequest.riderId === session.userId;
    const isAvailableBounty = !pickupRequest.riderId && pickupRequest.status === "APPROVED";
    const isAdmin = session.role === "ADMIN";

    if (!isDonor && !isNGO && !isRider && !isAvailableBounty && !isAdmin) {
      return NextResponse.json({ error: "Access Denied. Mission Confidential." }, { status: 403 });
    }

    return NextResponse.json(pickupRequest);
  } catch (error) {
    console.error("Mission detail error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export const GET = withSecurity(getRequestDetailHandler, { limit: 100 });
