import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "");

// 1. CORS Configuration
const allowedOrigins = [
  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  // Add production/staging domains here
];

/**
 * Next.js 16+ Proxy Handler (formerly Middleware)
 * Handles global CORS, Auth Enforcement, and RBAC
 */
export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();

  // Handle CORS
  const origin = request.headers.get("origin");
  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    response.headers.set("Access-Control-Allow-Credentials", "true");
  }

  // Handle Preflight (OPTIONS)
  if (request.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers: response.headers });
  }

  // 2. Global Auth Protection for /api/admin
  if (pathname.startsWith("/api/admin")) {
    const session = request.cookies.get("session")?.value;

    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    try {
      const { payload } = await jwtVerify(session, JWT_SECRET);
      
      // Strict Admin Check at Proxy Level
      if (payload.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden: Admin access only" }, { status: 403 });
      }
    } catch (error) {
      return NextResponse.json({ error: "Invalid or expired session" }, { status: 401 });
    }
  }

  // 3. General Auth check for protected routes (non-public)
  const protectedPaths = ["/api/donor", "/api/ngo", "/api/chat", "/api/notifications", "/api/requests", "/api/reports"];
  const isProtected = protectedPaths.some(p => pathname.startsWith(p));

  if (isProtected) {
    const session = request.cookies.get("session")?.value;
    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
  }

  return response;
}

export const config = {
  matcher: ["/api/:path*"],
};
