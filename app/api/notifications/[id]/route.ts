import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession({ request });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification || notification.userId !== session.userId) {
        return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true }
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession({ request });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    // Verify ownership before deletion
    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification || notification.userId !== session.userId) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    }

    await prisma.notification.delete({ where: { id } });

    return NextResponse.json({ message: "Notification deleted" });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
