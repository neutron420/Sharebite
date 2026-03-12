import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function middleware(request: any) {
  const session = await getSession();
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/donations") && request.method === "POST") {
    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
  }

  if (pathname.startsWith("/api/requests")) {
    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/donations/:path*',
    '/api/requests/:path*',
  ],
};
