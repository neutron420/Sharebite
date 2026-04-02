import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { validateCommunityImage, validateCommunityText } from "@/lib/self/moderation";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    const userId = session?.userId;
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || "";
    const sort = searchParams.get("sort") || "popular";

    const posts = await prisma.communityPost.findMany({
      where: {
        OR: [
          { caption: { contains: q, mode: "insensitive" } },
          { author: { name: { contains: q, mode: "insensitive" } } },
        ],
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
      orderBy: sort === "newest" ? [
        { createdAt: "desc" }
      ] : [
        { likes: { _count: "desc" } },
        { createdAt: "desc" },
      ],
    });

    const postsWithLikes = posts.map((p: any) => ({
      ...p,
      isLiked: p.likes && p.likes.length > 0,
      likes: undefined
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

    const [textMod, imgModResult] = await Promise.all([
      validateCommunityText(caption),
      (async () => {
        try {
          const imgRes = await fetch(imageUrl);
          const buffer = await imgRes.arrayBuffer();
          const base64 = Buffer.from(buffer).toString("base64");
          const mime = imgRes.headers.get("content-type") || "image/jpeg";
          return await validateCommunityImage(base64, mime);
        } catch (e) {
          console.warn("Signal check bypassed due to network error:", e);
          return { isSafe: true };
        }
      })()
    ]);

    // Handle Violations
    if (!textMod.isSafe || !imgModResult.isSafe) {
      // Log Text Violation if any
      if (!textMod.isSafe) {
        await prisma.hiveViolation.create({
          data: {
            userId: session.userId,
            type: "TEXT",
            content: caption,
            reason: textMod.reason || "Inappropriate language",
          }
        });
      }

      // Log Image Violation if any
      if (!imgModResult.isSafe) {
        await prisma.hiveViolation.create({
          data: {
            userId: session.userId,
            type: "IMAGE",
            content: imageUrl,
            reason: imgModResult.reason || "Inappropriate image content",
          }
        });
      }
      
      const finalReason = !imgModResult.isSafe 
        ? imgModResult.reason 
        : textMod.reason;

      return NextResponse.json({ 
        error: `Hive Guard: ${finalReason}`,
        isImageBad: !imgModResult.isSafe,
        isTextBad: !textMod.isSafe
      }, { status: 400 });
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
