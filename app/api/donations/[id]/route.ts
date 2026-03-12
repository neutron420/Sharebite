import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const donation = await prisma.foodDonation.findUnique({
      where: { id },
      include: {
        donor: {
          select: {
            name: true,
            email: true,
            phoneNumber: true,
            address: true,
            city: true,
            imageUrl: true,
          },
        },
        requests: {
          include: {
            ngo: {
              select: {
                name: true,
                city: true,
              },
            },
          },
        },
      },
    });

    if (!donation) {
      return NextResponse.json({ error: "Donation not found" }, { status: 404 });
    }

    return NextResponse.json(donation);
  } catch (error) {
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

    return NextResponse.json(updatedDonation);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
