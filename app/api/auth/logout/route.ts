import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSession, getCookieName, SESSION_COOKIE_NAMES } from "@/lib/auth";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const session = await getSession({ request });

  if (session) {
    // Clear only the specific role cookie requesting the logout
    const cookieName = getCookieName(session.role);
    cookieStore.set(cookieName, "", {
      maxAge: 0,
      path: "/",
    });
    
    // Also clear the lingering legacy shared session if it exists to be safe
    cookieStore.set("session", "", { maxAge: 0, path: "/" });
  } else {
    // Fallback: If session can't be resolved, clear them all
    for (const cookieName of SESSION_COOKIE_NAMES) {
      cookieStore.set(cookieName, "", {
        maxAge: 0,
        path: "/",
      });
    }
  }

  return NextResponse.json({ message: "Logged out successfully" });
}
