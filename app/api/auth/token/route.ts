import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAMES } from "@/lib/auth";

export async function GET() {
  try {
    const cookieStore = await cookies();

    const token = SESSION_COOKIE_NAMES
      .map((name) => cookieStore.get(name)?.value)
      .find((value): value is string => Boolean(value));

    if (!token) {
      return NextResponse.json({ error: "No token found" }, { status: 401 });
    }

    return NextResponse.json({ token });
  } catch (error) {
    console.error("Token fetch error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
