import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { withSecurity } from "@/lib/api-handler";

async function getConversationsHandler() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = session.userId as string;

    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          { participantAId: userId },
          { participantBId: userId },
        ],
      },
      include: {
        donation: {
          select: { title: true, imageUrl: true }
        },
        participantA: { select: { name: true, imageUrl: true, role: true } },
        participantB: { select: { name: true, imageUrl: true, role: true } },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(conversations);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

async function createConversationHandler(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { donationId, participantBId } = await request.json();

    if (!donationId || !participantBId) {
       return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const userId = session.userId as string;

    const existing = await prisma.conversation.findFirst({
      where: {
        donationId,
        OR: [
          { participantAId: userId, participantBId },
          { participantAId: participantBId, participantBId: userId },
        ],
      },
    });

    const conversation = existing ?? await prisma.conversation.create({
      data: {
        donationId,
        participantAId: userId,
        participantBId,
      },
    });

    return NextResponse.json(conversation);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export const GET = withSecurity(getConversationsHandler, { limit: 30 });
export const POST = withSecurity(createConversationHandler, { limit: 20 });
