import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;
    const comments = await prisma.communityComment.findMany({
      where: { postId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            role: true,
            imageUrl: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(comments);
  } catch (error) {
    console.error("Fetch comments error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

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
    const { content } = await request.json();
    if (!content) {
      return NextResponse.json({ error: "Comment content is required" }, { status: 400 });
    }

    const comment = await prisma.communityComment.create({
      data: {
        postId: postId,
        authorId: session.userId,
        content,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            role: true,
            imageUrl: true,
          },
        },
      },
    });

    // Get updated counts for the post
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

    // Broadcast both the comment AND the post update via WS
    try {
      await fetch("http://localhost:8080/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "COMMUNITY_POST_UPDATE",
          payload: post,
        }),
      });
      // Optionally broadcast NEW_COMMENT too
    } catch (e) {
      console.error("WS Broadcast failed:", e);
    }

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error("Comment error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
