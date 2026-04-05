import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSession, getCookieName, SESSION_COOKIE_NAMES } from "@/lib/auth";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const session = await getSession({ request });

  // Clear all known auth cookies to avoid stale parallel sessions.
  for (const cookieName of SESSION_COOKIE_NAMES) {
    cookieStore.set(cookieName, "", {
      maxAge: 0,
      path: "/",
    });
  }

  if (session) {
    const roleCookie = getCookieName(session.role);
    cookieStore.set(roleCookie, "", {
      maxAge: 0,
      path: "/",
    });
  }

  return NextResponse.json({ message: "Logged out successfully" });
}
