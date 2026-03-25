import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { withSecurity } from "@/lib/api-handler";

async function getNotificationsHandler(request: Request) {
  try {
    const session = await getSession({ request });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const notifications = await prisma.notification.findMany({
      where: { userId: session.userId as string },
      orderBy: { createdAt: "desc" },
      take: 50
    });

    return NextResponse.json(notifications);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// Mark all as read
async function markAllAsReadHandler(request: Request) {
    try {
      const session = await getSession({ request });
      if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
      await prisma.notification.updateMany({
        where: { userId: session.userId as string, isRead: false },
        data: { isRead: true }
      });
  
      return NextResponse.json({ message: "All notifications marked as read" });
    } catch (error) {
      return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export const GET = withSecurity(getNotificationsHandler);
export const PATCH = withSecurity(markAllAsReadHandler);
