import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { withSecurity } from "@/lib/api-handler";

async function getMessagesHandler(
  req: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const session = await getSession({ request: req });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { conversationId } = await params;

    // Check if user is participant of the conversation
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: {
        participantAId: true,
        participantBId: true,
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    if (
      conversation.participantAId !== session.userId &&
      conversation.participantBId !== session.userId
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const cursor = searchParams.get("cursor");

    const messages = await prisma.message.findMany({
      where: { conversationId },
      take: limit,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { createdAt: "desc" },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
          },
        },
      },
    });

    const nextCursor =
      messages.length === limit ? messages[messages.length - 1].id : null;

    return NextResponse.json({
      messages: messages.reverse(),
      nextCursor,
    });
  } catch (error) {
    console.error("Fetch messages error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

async function postMessageHandler(
  req: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const session = await getSession({ request: req });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { conversationId } = await params;
    const userId = session.userId as string;

    // SECURITY: Verify participant
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { participantAId: true, participantBId: true }
    });

    if (!conversation || (conversation.participantAId !== userId && conversation.participantBId !== userId)) {
      return NextResponse.json({ error: "Access denied to this conversation" }, { status: 403 });
    }

    let body;
    try {
      body = await req.json();
    } catch (jsonError) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { text, imageUrl, locationLat, locationLng } = body;

    if (!text && !imageUrl && !locationLat) {
      return NextResponse.json({ error: "Empty message" }, { status: 400 });
    }

    const message = await prisma.message.create({
      data: {
        text,
        imageUrl,
        locationLat,
        locationLng,
        conversationId,
        senderId: userId,
      },
      include: {
        sender: { select: { id: true, name: true, imageUrl: true } }
      }
    });

    // Update conversation updatedAt timestamp
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() }
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error("Send message error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export const GET = withSecurity(getMessagesHandler as any, { limit: 100 });
export const POST = withSecurity(postMessageHandler as any, { limit: 30 });
