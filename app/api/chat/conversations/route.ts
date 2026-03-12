import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
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

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { donationId, participantBId } = await request.json();

    if (!donationId || !participantBId) {
       return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const conversation = await prisma.conversation.upsert({
      where: {
        donationId_participantAId_participantBId: {
          donationId,
          participantAId: session.userId as string,
          participantBId,
        },
      },
      update: {},
      create: {
        donationId,
        participantAId: session.userId as string,
        participantBId,
      },
    });

    return NextResponse.json(conversation);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
