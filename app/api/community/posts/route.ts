import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    const userId = session?.userId;

    const posts = await prisma.communityPost.findMany({
      include: {
        author: {
          select: {
            id: true,
            name: true,
            role: true,
            imageUrl: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
        ...(userId ? {
          likes: {
            where: {
              userId: userId
            },
            select: {
              id: true
            }
          }
        } : {})
      },
      orderBy: [
        {
          likes: {
            _count: "desc",
          },
        },
        {
          createdAt: "desc",
        },
      ],
    });

    const postsWithLikes = posts.map((p: any) => ({
      ...p,
      isLiked: p.likes && p.likes.length > 0
    }));

    return NextResponse.json(postsWithLikes);
  } catch (error) {
    console.error("Fetch community posts error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { caption, imageUrl } = await request.json();

    if (!caption || !imageUrl) {
      return NextResponse.json({ error: "Caption and image are required" }, { status: 400 });
    }

    const post = await prisma.communityPost.create({
      data: {
        caption,
        imageUrl,
        authorId: session.userId,
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
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });
    try {
      await fetch("http://localhost:8080/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "COMMUNITY_POST",
          payload: post,
        }),
      });
    } catch (e) {
      console.error("Failed to broadcast community post via WS:", e);
    }

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error("Create community post error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
