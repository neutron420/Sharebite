import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        role: true,
        imageUrl: true,
        badges: { include: { badge: true } },
        createdAt: true,
        communityPosts: {
          orderBy: { createdAt: "desc" },
          include: {
            author: { select: { id: true, name: true, role: true, imageUrl: true } },
            _count: { select: { likes: true, comments: true } }
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Format posts appropriately
    const formattedPosts = user.communityPosts.map(p => ({
      ...p,
      isLiked: false // the profile page could do an extra fetch to see if liked by current user, simplified for now
    }));

    return NextResponse.json({ ...user, communityPosts: formattedPosts });
  } catch (error) {
    console.error("Fetch profile error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
