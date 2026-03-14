import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAMES } from "@/lib/auth";

export async function POST() {
  const cookieStore = await cookies();

  for (const cookieName of SESSION_COOKIE_NAMES) {
    cookieStore.set(cookieName, "", {
      maxAge: 0,
      path: "/",
    });
  }

  return NextResponse.json({ message: "Logged out successfully" });
}
