import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { postId } = await params;

    if (!postId) {
      return NextResponse.json({ error: "Missing parameter" }, { status: 400 });
    }

    // Attempt to delete the post and all its related records (comments, likes, reports)
    // Prisma cascading deletes should handle related records if configured, but we can do a transaction if needed.
    // Assuming cascading delete is configured in Prisma schema. If not, this might fail, 
    // but Prisma typically allows deleting the parent and cascades if `onDelete: Cascade` is set.
    
    // Safety check: Does it exist?
    const existingPost = await prisma.communityPost.findUnique({
      where: { id: postId },
    });

    if (!existingPost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    await prisma.communityPost.delete({
      where: { id: postId },
    });

    return NextResponse.json({ success: true, message: "Post deleted successfully" });
  } catch (error: any) {
    console.error("Delete community post error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
