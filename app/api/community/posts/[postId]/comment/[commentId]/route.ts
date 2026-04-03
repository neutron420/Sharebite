import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ postId: string; commentId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { postId, commentId } = await params;

    // Check if comment exists
    const comment = await prisma.communityComment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    // Check if the user is the author of the comment or the author of the post
    const post = await prisma.communityPost.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (comment.authorId !== session.userId && post.authorId !== session.userId && session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: You cannot delete this comment" }, { status: 403 });
    }

    await prisma.communityComment.delete({
      where: { id: commentId },
    });
    const updatedPost = await prisma.communityPost.findUnique({
      where: { id: postId },
      include: {
        _count: { select: { likes: true, comments: true } },
      },
    });

    try {
      await fetch("http://localhost:8080/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "COMMUNITY_POST_UPDATE",
          payload: updatedPost,
        }),
      });
    } catch (e) {
      console.error("WS Broadcast failed:", e);
    }

    return NextResponse.json({ message: "Comment deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Delete comment error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
