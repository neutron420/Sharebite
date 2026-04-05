import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSession, getCookieName, SESSION_COOKIE_NAMES } from "@/lib/auth";

const LOGOUT_ROLES = ["ADMIN", "GROUND_ADMIN", "DONOR", "NGO", "RIDER", "COMMUNITY"] as const;

function isLogoutRole(value: unknown): value is (typeof LOGOUT_ROLES)[number] {
  return typeof value === "string" && LOGOUT_ROLES.includes(value as (typeof LOGOUT_ROLES)[number]);
}

function clearCookie(cookieStore: Awaited<ReturnType<typeof cookies>>, cookieName: string) {
  cookieStore.set(cookieName, "", {
    maxAge: 0,
    path: "/",
  });
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const session = await getSession({ request });

  let requestedRole: (typeof LOGOUT_ROLES)[number] | undefined;
  let clearAll = false;

  try {
    const body = await request.json();
    requestedRole = isLogoutRole(body?.role) ? body.role : undefined;
    clearAll = body?.clearAll === true;
  } catch {
    requestedRole = undefined;
    clearAll = false;
  }

  if (clearAll) {
    for (const cookieName of SESSION_COOKIE_NAMES) {
      clearCookie(cookieStore, cookieName);
    }

    return NextResponse.json({ message: "Logged out successfully" });
  }

  const targetRole = requestedRole || session?.role;

  if (!targetRole) {
    for (const cookieName of SESSION_COOKIE_NAMES) {
      clearCookie(cookieStore, cookieName);
    }

    return NextResponse.json({ message: "Logged out successfully" });
  }

  clearCookie(cookieStore, getCookieName(targetRole));

  return NextResponse.json({ message: "Logged out successfully" });
}
