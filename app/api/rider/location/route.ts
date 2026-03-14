import { NextResponse } from "next/server";
import redis from "@/lib/redis";
import { withSecurity } from "@/lib/api-handler";
import { getSession } from "@/lib/auth";

/**
 * POST /api/rider/location
 * Updates the rider's current GPS location in Redis with a 60s TTL.
 */
async function postLocationHandler(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "RIDER") {
      return NextResponse.json({ error: "Unauthorized. Rider only." }, { status: 401 });
    }

    const { lat, lng } = await request.json();

    if (!lat || !lng) {
      return NextResponse.json({ error: "Missing coordinates" }, { status: 400 });
    }

    const key = `rider:pos:${session.userId}`;
    // Store as JSON string with 60s expiry
    await redis.set(key, JSON.stringify({ lat, lng, updatedAt: Date.now() }), "EX", 60);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Rider location update error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * GET /api/rider/location?riderId=...
 * Fetches a rider's last known location from Redis.
 */
async function getLocationHandler(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const riderId = searchParams.get("riderId");

    if (!riderId) {
      return NextResponse.json({ error: "Missing riderId" }, { status: 400 });
    }

    const data = await redis.get(`rider:pos:${riderId}`);
    
    if (!data) {
      return NextResponse.json({ lat: null, lng: null, offline: true });
    }

    return NextResponse.json({ ...JSON.parse(data as string), offline: false });
  } catch (error) {
    console.error("Rider location fetch error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export const POST = withSecurity(postLocationHandler, { limit: 60 }); // 1 update per second max
export const GET = withSecurity(getLocationHandler, { limit: 120 });
