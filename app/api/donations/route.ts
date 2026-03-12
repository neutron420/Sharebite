import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { donationSchema } from "@/lib/validations/donation";
import { getSession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "DONOR" && session.role !== "ADMIN")) {
      return NextResponse.json(
        { error: "Unauthorized. Only donors can create donations." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = donationSchema.parse(body);

    const donation = await prisma.foodDonation.create({
      data: {
        ...validatedData,
        weight: validatedData.weight || 0,
        expiryTime: new Date(validatedData.expiryTime),
        pickupStartTime: new Date(validatedData.pickupStartTime),
        pickupEndTime: new Date(validatedData.pickupEndTime),
        donorId: session.userId as string,
        status: "AVAILABLE",
      },
    });

    return NextResponse.json(donation, { status: 201 });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Donation creation error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const status = searchParams.get("status") || "AVAILABLE";

    const donations = await prisma.foodDonation.findMany({
      where: {
        status: status as any,
        ...(category && { category: category as any }),
      },
      include: {
        donor: {
          select: {
            name: true,
            city: true,
            imageUrl: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(donations);
  } catch (error) {
    console.error("Fetch donations error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
