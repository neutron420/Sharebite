import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { withSecurity } from "@/lib/api-handler";

async function getDataReportsHandler(request: Request) {
  try {
    const session = await getSession({ request });
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const monthParam = searchParams.get("month");
    const yearParam = searchParams.get("year");
    
    const currentDate = new Date();
    const month = monthParam !== null ? parseInt(monthParam) : currentDate.getMonth();
    const year = yearParam !== null ? parseInt(yearParam) : currentDate.getFullYear();

    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);

    const whereClause = {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    // Parallel fetch
    const [
      donations,
      pickups,
      newUsers,
      totalWeightResult
    ] = await Promise.all([
      prisma.foodDonation.findMany({ where: whereClause, include: { donor: true } }),
      prisma.pickupRequest.findMany({ where: whereClause, include: { ngo: true, rider: true, donation: true } }),
      prisma.user.findMany({ where: whereClause }),
      prisma.foodDonation.aggregate({
        where: whereClause,
        _sum: { weight: true }
      })
    ]);

    const activeDonations = donations.filter(d => d.status !== 'EXPIRED');
    const completedPickups = pickups.filter(p => p.status === 'COMPLETED');
    const totalWeight = totalWeightResult._sum.weight || 0;

    return NextResponse.json({
      summary: {
        totalDonations: donations.length,
        activeDonations: activeDonations.length,
        totalPickups: pickups.length,
        completedPickups: completedPickups.length,
        newUsers: newUsers.length,
        totalWeight
      },
      donations: donations.map(d => ({
        id: d.id,
        title: d.title,
        status: d.status,
        category: d.category,
        weight: d.weight,
        donorName: d.donor?.name || 'Unknown',
        createdAt: d.createdAt
      })),
      pickups: pickups.map(p => ({
        id: p.id,
        status: p.status,
        ngoName: p.ngo?.name || 'Unknown',
        riderName: p.rider?.name || 'Unassigned',
        donationTitle: p.donation?.title || 'Unknown',
        createdAt: p.createdAt,
        completedAt: p.completedAt
      })),
      users: newUsers.map(u => ({
        id: u.id,
        name: u.name,
        role: u.role,
        email: u.email,
        createdAt: u.createdAt,
        isVerified: u.isVerified
      }))
    });
  } catch (error) {
    console.error("Data Reports Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export const GET = withSecurity(getDataReportsHandler);
