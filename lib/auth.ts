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
    .setExpirationTime("7d") // Extended to 7 days as requested
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
  
  // 1. Detect if we are in an admin context to prioritize the right cookie
  let isAdminPath = false;
  try {
    const headersList = await headers();
    const referer = headersList.get("referer") || "";
    const nextUrl = headersList.get("x-invoke-path") || headersList.get("x-matched-path") || "";
    
    // Check if the URL contains admin keywords
    const pathString = (nextUrl + "|" + referer).toLowerCase();
    isAdminPath = pathString.includes("/admin") || pathString.includes("/api/admin");
  } catch (err) {
    // Fail silently, default to false
  }

  const sessionToken = cookieStore.get("session")?.value;
  const adminToken = cookieStore.get("admin_session")?.value;

  // 2. Priority check based on path
  if (isAdminPath) {
    if (adminToken) {
      const payload = await verifyToken(adminToken);
      if (payload) {
        return payload;
      }
    }
    // Fallback to regular session
    if (sessionToken) {
      const payload = await verifyToken(sessionToken);
      if (payload) {
        return payload;
      }
    }
  } else {
    // Default: Check regular session first
    if (sessionToken) {
      const payload = await verifyToken(sessionToken);
      if (payload) {
        return payload;
      }
    }
    // Fallback to admin session
    if (adminToken) {
      const payload = await verifyToken(adminToken);
      if (payload) {
        return payload;
      }
    }
  }

  // Debug logging for missing sessions to help find issues
  if (sessionToken || adminToken) {
    console.warn("Session tokens found but failed verification (possibly expired or invalid secret)");
  }

  return null;
}
