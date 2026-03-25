import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function PATCH(request: Request) {
  try {
    const session = await getSession({ request });
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.notification.updateMany({
      where: { userId: session.userId as string },
      data: { isRead: true },
    });

    return NextResponse.json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("Mark all read error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
