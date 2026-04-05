import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "");

const allowedOrigins = [
  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",

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

  // 2. Global Auth Protection
  const protectedPaths = ["/api/admin", "/api/donor", "/api/ngo", "/api/rider", "/api/notifications", "/api/requests", "/api/reports"];
  const isProtected = protectedPaths.some(p => pathname.startsWith(p));

  if (isProtected) {
    let prioritizedCookie = "";
    if (pathname.startsWith("/api/admin")) {
      let isGroundAdminContext = false;
      try {
        const referer = request.headers.get("referer") || "";
        const refererPath = referer ? new URL(referer).pathname.toLowerCase() : "";
        isGroundAdminContext = refererPath.includes("/ground-admin") || refererPath.includes("/admin/ground-verification");
      } catch {
        isGroundAdminContext = false;
      }
      prioritizedCookie = isGroundAdminContext ? "ground_admin_session" : "admin_session";
    }
    else if (pathname.startsWith("/api/donor")) prioritizedCookie = "donor_session";
    else if (pathname.startsWith("/api/ngo")) prioritizedCookie = "ngo_session";
    else if (pathname.startsWith("/api/rider")) prioritizedCookie = "rider_session";

    const allCookieNames = ["admin_session", "ground_admin_session", "donor_session", "ngo_session", "rider_session", "community_session", "session"];
    const tokensToCheck: string[] = [];

    // Prioritize the cookie matching the route
    if (prioritizedCookie) {
      const pToken = request.cookies.get(prioritizedCookie)?.value;
      if (pToken) tokensToCheck.push(pToken);
    }

    // Add remaining cookies as fallbacks
    for (const name of allCookieNames) {
      if (name !== prioritizedCookie) {
        const token = request.cookies.get(name)?.value;
        if (token) tokensToCheck.push(token);
      }
    }

    let isValid = false;
    let decodedRole = "";

    for (const token of tokensToCheck) {
      try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        if (payload) {
          isValid = true;
          decodedRole = payload.role as string;
          break;
        }
      } catch (e) {
        continue;
      }
    }

    if (!isValid) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Strict Admin Check at Proxy Level
    if (pathname.startsWith("/api/admin")) {
      const groundAdminAllowedPath = pathname.startsWith("/api/admin/ngo-verifications");
      const isGroundAdmin = decodedRole === "GROUND_ADMIN";
      const isAdmin = decodedRole === "ADMIN";

      if (!isAdmin) {
        if (!(groundAdminAllowedPath && isGroundAdmin)) {
          return NextResponse.json({ error: "Forbidden: Admin access only" }, { status: 403 });
        }
      }
    }
  }

  return response;
}

export const config = {
  matcher: ["/api/:path*"],
};
