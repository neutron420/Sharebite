import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import redis from "@/lib/redis";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();

    const donation = await prisma.foodDonation.findUnique({
      where: { id },
      include: {
        donor: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
            address: true,
            city: true,
            imageUrl: true,
            latitude: true,
            longitude: true,
          },
        },
        requests: {
          include: {
            ngo: {
              select: {
                id: true,
                name: true,
                city: true,
                imageUrl: true,
                latitude: true,
                longitude: true,
              },
            },
            rider: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!donation) {
      return NextResponse.json({ error: "Donation not found" }, { status: 404 });
    }

    // Check if user is authorized to see sensitive info
    const isOwner = session?.userId === donation.donorId;
    const isAdmin = session?.role === "ADMIN";
    
    // Process requests to hide/show PIN and other data
    donation.requests = donation.requests.map((req: any) => {
      // Only donor/admin sees the PIN
      if (!isOwner && !isAdmin) {
        req.handoverPin = undefined;
      }
      return req;
    });

    let isApprovedNGO = false;
    if (session?.role === "NGO") {
      const approvedRequest = donation.requests.find(
        (req: any) => req.ngoId === session.userId && req.status === "APPROVED"
      );
      if (approvedRequest) isApprovedNGO = true;
    }

    const canSeeSensitiveInfo = isOwner || isAdmin || isApprovedNGO;

    if (!canSeeSensitiveInfo) {
      // Hide exact sensitive details for public/unauthorized users
      (donation.donor as any).email = undefined;
      (donation.donor as any).phoneNumber = undefined;
      (donation.donor as any).address = "Hidden until request is approved";
    }

    return NextResponse.json(donation);
  } catch (error) {
    console.error("Fetch donation error:", error);
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
    const { status } = body;

    const validStatuses = ["AVAILABLE", "REQUESTED", "APPROVED", "COLLECTED", "EXPIRED"];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status. Must be one of: " + validStatuses.join(", ") }, { status: 400 });
    }

    const donation = await prisma.foodDonation.findUnique({
      where: { id },
    });

    if (!donation) {
      return NextResponse.json({ error: "Donation not found" }, { status: 404 });
    }

    // Only donor of this item or admin can update status
    if (donation.donorId !== session.userId && session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updatedDonation = await prisma.foodDonation.update({
      where: { id },
      data: { status },
    });

    // If no longer available, remove from Redis GEO index
    if (status !== "AVAILABLE") {
       await redis.zrem("donations:geo", id);
    }

    return NextResponse.json(updatedDonation);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const donation = await prisma.foodDonation.findUnique({
      where: { id },
    });

    if (!donation) {
      return NextResponse.json({ error: "Donation not found" }, { status: 404 });
    }

    // Only donor of this item or admin can delete
    if (donation.donorId !== session.userId && session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.foodDonation.delete({
      where: { id },
    });

    // Remove from Redis GEO index
    await redis.zrem("donations:geo", id);

    return NextResponse.json({ message: "Donation deleted successfully" });
  } catch (error) {
    console.error("Delete donation error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

