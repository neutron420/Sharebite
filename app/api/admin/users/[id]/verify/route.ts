import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { isVerified } = await request.json();
    const { id } = await params;

    const user = await prisma.user.update({
      where: { id },
      data: { isVerified },
    });

    // Create an audit log for this action
    await prisma.auditLog.create({
      data: {
        action: isVerified ? "NGO_VERIFIED" : "NGO_UNVERIFIED",
        details: `Admin ${session.email} changed verification status of user ${user.email} to ${isVerified}`,
        adminId: session.userId as string,
      },
    });

    // Also notify the user
    await prisma.notification.create({
      data: {
        userId: id,
        type: "SYSTEM",
        title: isVerified ? "Account Verified" : "Verification Update",
        message: isVerified 
          ? "Congratulations! Your NGO account has been verified. You can now start requesting food donations."
          : "Your verification status has been updated. Please contact support if you have questions.",
      },
    });

    return NextResponse.json({ message: "User status updated", user });
  } catch (error) {
    console.error("NGO verification error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
