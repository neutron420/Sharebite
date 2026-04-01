import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { reason, details } = await request.json();
    if (!reason) {
      return NextResponse.json({ error: "Reason for report is required" }, { status: 400 });
    }

    const report = await prisma.communityReport.create({
      data: {
        postId: postId,
        reporterId: session.userId,
        reason,
        details,
      },
    });

    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    console.error("Report create error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
