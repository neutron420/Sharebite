import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  const cookieStore = await cookies();

  // Clear both session cookies so Admin and Donor/NGO sessions are fully cleared
  cookieStore.set("session", "", {
    maxAge: 0,
    path: "/",
  });
  cookieStore.set("admin_session", "", {
    maxAge: 0,
    path: "/",
  });

  return NextResponse.json({ message: "Logged out successfully" });
}
