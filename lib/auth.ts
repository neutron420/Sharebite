import { JWTPayload, SignJWT, jwtVerify } from "jose";
import { cookies, headers } from "next/headers";

const getSecretKey = () => {
  if (!process.env.JWT_SECRET) {
    if (process.env.NODE_ENV === "production") {
      console.warn("JWT_SECRET is missing. This will cause authentication failures.");
    }
    return new TextEncoder().encode("development-fallback-secret-do-not-use");
  }
  return new TextEncoder().encode(process.env.JWT_SECRET);
};

const sessionRoles = ["ADMIN", "DONOR", "NGO", "RIDER"] as const;
export const SESSION_COOKIE_NAMES = [
  "session",
  "admin_session",
  "donor_session",
  "ngo_session",
  "rider_session",
] as const;

export type SessionRole = (typeof sessionRoles)[number];

export interface SessionPayload extends JWTPayload {
  userId: string;
  email: string;
  role: SessionRole;
}

interface GetSessionOptions {
  preferredRole?: SessionRole;
  request?: Request;
}

export function getCookieName(role: string): string {
  if (role === "ADMIN") return "admin_session";
  if (role === "DONOR") return "donor_session";
  if (role === "NGO") return "ngo_session";
  if (role === "RIDER") return "rider_session";
  return "session";
}

function isSessionRole(value: unknown): value is SessionRole {
  return typeof value === "string" && sessionRoles.includes(value as SessionRole);
}

function isSessionPayload(payload: JWTPayload): payload is SessionPayload {
  return (
    typeof payload.userId === "string" &&
    typeof payload.email === "string" &&
    isSessionRole(payload.role)
  );
}

function inferPreferredRole(currentPath: string): SessionRole | undefined {
  if (currentPath.includes("/admin")) return "ADMIN";
  if (currentPath.includes("/donor")) return "DONOR";
  if (currentPath.includes("/ngo")) return "NGO";
  if (currentPath.includes("/rider")) return "RIDER";
  return undefined;
}

export async function signToken(payload: SessionPayload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d") // Extended to 7 days as requested
    .sign(getSecretKey());
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return isSessionPayload(payload) ? payload : null;
  } catch {
    return null;
  }
}

/**
 * getSession() — Smart session resolver.
 * 
 * It can prefer a role explicitly or infer the route context from the request.
 * This keeps shared APIs like /api/auth/me and /api/requests aligned with the
 * dashboard that initiated the request.
 * 
 * For everything else it falls back to the general session first, then role cookies.
 */
export async function getSession(options?: GetSessionOptions): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  
  // 1. Detect current path context
  let currentPath = "";
  if (options?.request) {
    const requestPath = new URL(options.request.url).pathname.toLowerCase();
    let refererPath = "";

    try {
      const referer = options.request.headers.get("referer") || "";
      refererPath = referer ? new URL(referer).pathname.toLowerCase() : "";
    } catch {
      refererPath = "";
    }

    currentPath = `${requestPath}|${refererPath}`;
  }

  if (!currentPath) {
    try {
      const headersList = await headers();
      const referer = headersList.get("referer") || "";
      const refererPath = referer ? new URL(referer).pathname : "";
      const nextUrl =
        headersList.get("x-invoke-path") ||
        headersList.get("x-matched-path") ||
        headersList.get("next-url") ||
        "";

      currentPath = `${nextUrl}|${refererPath}`.toLowerCase();
    } catch {
      // Fail silently and fall back to the default cookie order below.
    }
  }

  // 2. Get all session tokens
  const adminToken = cookieStore.get("admin_session")?.value;
  const donorToken = cookieStore.get("donor_session")?.value;
  const ngoToken = cookieStore.get("ngo_session")?.value;
  const riderToken = cookieStore.get("rider_session")?.value;
  const generalToken = cookieStore.get("session")?.value;

  // 3. Priority check based on path context
  const tokenByRole: Record<SessionRole, string | undefined> = {
    ADMIN: adminToken,
    DONOR: donorToken,
    NGO: ngoToken,
    RIDER: riderToken,
  };
  const tokenChecks: Array<string | undefined> = [];
  const preferredRole = options?.preferredRole ?? inferPreferredRole(currentPath);

  if (preferredRole) {
    tokenChecks.push(tokenByRole[preferredRole], generalToken);

    for (const role of sessionRoles) {
      if (role !== preferredRole) {
        tokenChecks.push(tokenByRole[role]);
      }
    }
  } else {
    // Default order: check all tokens
    tokenChecks.push(generalToken, adminToken, donorToken, ngoToken, riderToken);
  }

  // 4. Verify tokens in priority order
  const uniqueTokenChecks = Array.from(
    new Set(tokenChecks.filter((token): token is string => Boolean(token)))
  );

  for (const token of uniqueTokenChecks) {
    if (token) {
      const payload = await verifyToken(token);
      if (payload) {
        return payload;
      }
    }
  }

  return null;
}
