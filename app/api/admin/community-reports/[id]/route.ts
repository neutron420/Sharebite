import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { status } = await request.json();

    if (!["PENDING", "RESOLVED", "DISMISSED"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const report = await prisma.communityReport.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json(report);
  } catch (error) {
    console.error("Update community report error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
