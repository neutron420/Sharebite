import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { withSecurity } from "@/lib/api-handler";

async function getNgoNotificationsHandler(request: Request) {
  try {
    const session = await getSession({ preferredRole: "NGO", request });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "NGO") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const notifications = await prisma.notification.findMany({
      where: { userId: session.userId as string },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json(notifications);
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

async function markAllNgoNotificationsAsReadHandler(request: Request) {
  try {
    const session = await getSession({ preferredRole: "NGO", request });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "NGO") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    await prisma.notification.updateMany({
      where: { userId: session.userId as string, isRead: false },
      data: { isRead: true },
    });

    return NextResponse.json({ message: "All notifications marked as read" });
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

async function clearAllNgoNotificationsHandler(request: Request) {
  try {
    const session = await getSession({ preferredRole: "NGO", request });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "NGO") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    await prisma.notification.deleteMany({
      where: { userId: session.userId as string },
    });

    return NextResponse.json({ message: "All notifications cleared" });
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export const GET = withSecurity(getNgoNotificationsHandler);
export const PATCH = withSecurity(markAllNgoNotificationsAsReadHandler);
export const DELETE = withSecurity(clearAllNgoNotificationsHandler);
