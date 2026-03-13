import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized. Admin only." }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { isVerified } = body;

    if (typeof isVerified !== "boolean") {
      return NextResponse.json({ error: "Invalid input. isVerified must be boolean." }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id, role: "NGO" },
      data: { isVerified },
    });

    // Notify the NGO about their verification status
    await createNotification({
      userId: id,
      type: "SYSTEM",
      title: isVerified ? "Account Verified!" : "Verification Update",
      message: isVerified 
        ? "Congratulations! Your NGO account has been verified. You can now start requesting food donations." 
        : "Your verification status has been updated. Please contact support if you have questions.",
      link: "/dashboard"
    });

    return NextResponse.json({
      message: `NGO ${isVerified ? "verified" : "unverified"} successfully`,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        isVerified: updatedUser.isVerified
      }
    });

  } catch (error) {
    console.error("NGO verification error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized. Admin only." }, { status: 401 });
    }

    const { id } = await params;

    await prisma.user.delete({
      where: { id, role: "NGO" },
    });

    return NextResponse.json({ message: "NGO account deleted successfully" });
  } catch (error) {
    console.error("NGO deletion error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
