import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { withSecurity } from "@/lib/api-handler";

async function getMessagesHandler(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: conversationId } = await params;
    const userId = session.userId as string;

    // SECURITY: Verify the user is a participant in this conversation
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { participantAId: true, participantBId: true }
    });

    if (!conversation || (conversation.participantAId !== userId && conversation.participantBId !== userId)) {
      return NextResponse.json({ error: "Access denied to this conversation" }, { status: 403 });
    }

    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
      include: {
        sender: { select: { name: true, imageUrl: true } }
      }
    });

    return NextResponse.json(messages);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
async function postMessageHandler(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: conversationId } = await params;
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
      body = await request.json();
    } catch (jsonError) {
      // Handle cases where the body is not valid JSON or is empty
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
        sender: { select: { name: true, imageUrl: true } }
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

export const GET = withSecurity(getMessagesHandler, { limit: 100 });
export const POST = withSecurity(postMessageHandler, { limit: 30 }); // Rate limit chat to prevent spam
