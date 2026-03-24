import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getSession({ request: req });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          { participantAId: session.userId },
          { participantBId: session.userId },
        ],
      },
      include: {
        donation: {
          select: {
            id: true,
            title: true,
            imageUrl: true,
          },
        },
        participantA: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
            role: true,
          },
        },
        participantB: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
            role: true,
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(conversations);
  } catch (error) {
    console.error("Fetch conversations error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession({ request: req });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { donationId, participantId } = await req.json();

    if (!donationId || !participantId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    const donation = await prisma.foodDonation.findUnique({
      where: { id: donationId },
      select: { donorId: true },
    });

    if (!donation) {
      return NextResponse.json({ error: "Donation not found" }, { status: 404 });
    }

    // Identify participants
    const participantAId = session.userId;
    const participantBId = participantId;

    // Check if conversation already exists
    let conversation = await prisma.conversation.findFirst({
      where: {
        donationId,
        OR: [
          { participantAId, participantBId },
          { participantAId: participantBId, participantBId: participantAId },
        ],
      },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          donationId,
          participantAId,
          participantBId,
        },
      });
    }

    return NextResponse.json(conversation);
  } catch (error) {
    console.error("Create conversation error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
