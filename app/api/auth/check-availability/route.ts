import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");
    const phoneNumber = searchParams.get("phoneNumber");

    if (!email && !phoneNumber) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    if (email) {
      const existing = await prisma.user.findUnique({
        where: { email },
        select: { id: true },
      });
      return NextResponse.json({ available: !existing });
    }

    if (phoneNumber) {
      const existing = await prisma.user.findFirst({
        where: { phoneNumber },
        select: { id: true },
      });
      return NextResponse.json({ available: !existing });
    }

    return NextResponse.json({ available: true });
  } catch (error) {
    console.error("Availability check error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
