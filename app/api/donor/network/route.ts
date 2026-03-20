import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { withSecurity } from "@/lib/api-handler";

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  return R * c;
}

async function getDonorNetworkHandler(request: Request) {
  try {
    const session = await getSession({ request });
    if (!session || session.role !== "DONOR") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const city = searchParams.get("city");

    // Get Donor Data to calculate distance
    const donor = await prisma.user.findUnique({
      where: { id: session.userId as string },
      select: { latitude: true, longitude: true, city: true }
    });

    const ngos = await prisma.user.findMany({
      where: {
        role: "NGO",
        isVerified: true,
        latitude: { not: null },
        longitude: { not: null },
        ...(city && city !== "ALL" && { city }),
      },
      select: {
        id: true,
        name: true,
        city: true,
        state: true,
        latitude: true,
        longitude: true,
        rating: true,
        requests: {
          select: { status: true },
        }
      }
    });

    let mappedNgos = ngos.map(ngo => {
      let distance = null;
      if (donor?.latitude && donor?.longitude && ngo.latitude && ngo.longitude) {
        distance = haversineDistance(donor.latitude, donor.longitude, ngo.latitude, ngo.longitude);
      }
      
      const completedPickups = ngo.requests.filter(r => r.status === "COMPLETED").length;
      return {
        id: ngo.id,
        name: ngo.name,
        city: ngo.city,
        state: ngo.state,
        latitude: ngo.latitude,
        longitude: ngo.longitude,
        rating: ngo.rating,
        distance: distance,
        completedPickups: completedPickups
      };
    });

    // If city is "ALL" and donor has coords, prioritize those within 15km
    if ((!city || city === "ALL") && donor?.latitude && donor?.longitude) {
       mappedNgos.sort((a, b) => {
         if (a.distance !== null && b.distance !== null) return a.distance - b.distance;
         return 0;
       });
    }

    return NextResponse.json(mappedNgos);
  } catch (error) {
    console.error("NGO network fetch error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export const GET = withSecurity(getDonorNetworkHandler);
