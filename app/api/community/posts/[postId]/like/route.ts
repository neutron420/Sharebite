import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { postId } = await params;

    // Check if user already liked
    const existingLike = await prisma.communityLike.findUnique({
      where: {
        postId_userId: {
          postId,
          userId: session.userId,
        },
      },
    });

    if (existingLike) {
      // Unlike
      await prisma.communityLike.delete({
        where: {
          id: existingLike.id,
        },
      });
    } else {
      // Like
      await prisma.communityLike.create({
        data: {
          postId,
          userId: session.userId,
        },
      });
    }

    // Get updated count
    const post = await prisma.communityPost.findUnique({
      where: { id: postId },
      include: {
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });

    // Broadcast update via WebSocket
    try {
      await fetch("http://localhost:8080/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "COMMUNITY_POST_UPDATE",
          payload: post,
        }),
      });
    } catch (e) {
      console.error("WS Broadcast failed:", e);
    }

    return NextResponse.json({ 
      liked: !existingLike, 
      count: post?._count.likes || 0 
    });
  } catch (error) {
    console.error("Like toggle error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
