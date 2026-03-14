import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { headers } from "next/headers";

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is not set");
}

const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);

export function getCookieName(role: string): string {
  if (role === "ADMIN") return "admin_session";
  return "session";
}

export async function signToken(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(secretKey);
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, secretKey);
    return payload;
  } catch (error) {
    return null;
  }
}

/**
 * getSession() — Smart session resolver.
 * 
 * For /api/admin/* routes → checks admin_session cookie
 * For /api/donor/*, /api/ngo/*, etc. → checks session cookie
 * For everything else → checks session cookie first, then admin_session
 * 
 * This ensures Admin and Donor/NGO can be logged in at the same time
 * without conflicting with each other.
 */
export async function getSession() {
  const cookieStore = await cookies();
  
  // Try to detect the request path from headers
  let pathname = "";
  try {
    const headersList = await headers();
    const referer = headersList.get("referer") || "";
    const nextUrl = headersList.get("x-invoke-path") || headersList.get("x-matched-path") || "";
    pathname = nextUrl || new URL(referer || "http://localhost").pathname;
  } catch {
    pathname = "";
  }

  const isAdminRoute = pathname.includes("/admin") || pathname.includes("/api/admin");

  if (isAdminRoute) {
    // For admin routes, prioritize admin_session
    const adminToken = cookieStore.get("admin_session")?.value;
    if (adminToken) {
      const payload = await verifyToken(adminToken);
      if (payload) return payload;
    }
    // Fallback to regular session (backwards compatibility)
    const token = cookieStore.get("session")?.value;
    if (token) return await verifyToken(token);
    return null;
  }

  // For non-admin routes, prioritize regular session
  const token = cookieStore.get("session")?.value;
  if (token) {
    const payload = await verifyToken(token);
    if (payload) return payload;
  }

  // Fallback to admin_session (for shared APIs like /api/donations)
  const adminToken = cookieStore.get("admin_session")?.value;
  if (adminToken) {
    const payload = await verifyToken(adminToken);
    if (payload) return payload;
  }

  return null;
}
