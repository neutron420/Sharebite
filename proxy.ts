import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export default async function proxy(request: any) {
  const session = await getSession();
  const { pathname } = request.nextUrl;

  // Admin routes — require ADMIN role
  if (pathname.startsWith("/api/admin")) {
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // Protected routes — require any authenticated session
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

  if (pathname.startsWith("/api/chat") || pathname.startsWith("/api/notifications") || pathname.startsWith("/api/reviews")) {
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
    '/api/admin/:path*',
    '/api/chat/:path*',
    '/api/notifications/:path*',
    '/api/reviews/:path*',
  ],
};
