import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { withSecurity } from "@/lib/api-handler";

async function postReadHandler(
  req: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const session = await getSession({ request: req });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { conversationId } = await params;

    // SECURITY: Verify participant
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { participantAId: true, participantBId: true }
    });

    if (!conversation || (conversation.participantAId !== session.userId && conversation.participantBId !== session.userId)) {
      return NextResponse.json({ error: "Access denied to this conversation" }, { status: 403 });
    }

    // Mark all messages in this conversation not sent by current user as read
    await prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: session.userId },
        isRead: false,
      },
      data: { isRead: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Mark as read error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export const POST = withSecurity(postReadHandler as any, { limit: 100 });
