import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get donations with location data
    const donations = await prisma.foodDonation.findMany({
      where: {
        latitude: { not: null },
        longitude: { not: null },
      },
      select: {
        id: true,
        title: true,
        category: true,
        status: true,
        city: true,
        state: true,
        district: true,
        pincode: true,
        latitude: true,
        longitude: true,
        imageUrl: true,
        quantity: true,
        createdAt: true,
        donor: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 500,
    });

    // Get NGOs with location data
    const ngos = await prisma.user.findMany({
      where: {
        role: "NGO",
        latitude: { not: null },
        longitude: { not: null },
      },
      select: {
        id: true,
        name: true,
        city: true,
        state: true,
        district: true,
        pincode: true,
        latitude: true,
        longitude: true,
        imageUrl: true,
        isVerified: true,
        _count: {
          select: { requests: true }
        }
      },
    });

    // Get donors with location data
    const donors = await prisma.user.findMany({
      where: {
        role: "DONOR",
        latitude: { not: null },
        longitude: { not: null },
      },
      select: {
        id: true,
        name: true,
        city: true,
        state: true,
        district: true,
        pincode: true,
        latitude: true,
        longitude: true,
        imageUrl: true,
        _count: {
          select: { donations: true }
        }
      },
    });

    // Get stats by city
    const cityStats = await prisma.foodDonation.groupBy({
      by: ["city"],
      _count: { id: true },
    });

    // Get stats by state
    const stateStats = await prisma.foodDonation.groupBy({
      by: ["state"],
      where: { state: { not: null } },
      _count: { id: true },
    });

    return NextResponse.json({
      donations,
      ngos,
      donors,
      cityStats,
      stateStats,
    });
  } catch (error) {
    console.error("Map data fetch error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
