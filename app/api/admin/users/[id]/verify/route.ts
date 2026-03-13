import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import { createAuditLog } from "@/lib/audit";
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

    const { isVerified } = await request.json();
    const { id } = await params;

    const user = await prisma.user.update({
      where: { id },
      data: { isVerified },
    });

    // Create an audit log for this action
    await createAuditLog({
      adminId: session.userId as string,
      action: isVerified ? "NGO_VERIFIED" : "NGO_UNVERIFIED",
      details: `Admin ${session.email} changed verification status of user ${user.email} to ${isVerified}`,
    });

    // Also notify the user
    await createNotification({
      userId: id,
      type: "SYSTEM",
      title: isVerified ? "Account Verified" : "Verification Update",
      message: isVerified 
        ? "Congratulations! Your NGO account has been verified. You can now start requesting food donations."
        : "Your verification status has been updated. Please contact support if you have questions.",
      link: "/dashboard"
    });

    return NextResponse.json({ message: "User status updated", user });
  } catch (error) {
    console.error("NGO verification error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
