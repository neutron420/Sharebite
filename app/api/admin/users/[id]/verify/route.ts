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

    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: { role: true, email: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (targetUser.role === "RIDER") {
      return NextResponse.json(
        { error: "Use the Riders Verification page for final rider approvals." },
        { status: 400 }
      );
    }

    const user = await prisma.user.update({
      where: { id },
      data: { isVerified },
    });

    const roleLabel = user.role === "RIDER" ? "Rider" : user.role === "NGO" ? "NGO" : "User";
    const approvedMessageByRole: Record<string, string> = {
      RIDER: "Congratulations! Your rider account has been verified. You can now claim delivery missions.",
      NGO: "Congratulations! Your NGO account has been verified. You can now start requesting food donations.",
      DONOR: "Your donor account has been verified.",
      COMMUNITY: "Your community account has been verified.",
      ADMIN: "Your account has been verified.",
    };
    const approvedMessage = approvedMessageByRole[user.role] || "Your account has been verified.";

    // Create an audit log for this action
    await createAuditLog({
      adminId: session.userId as string,
      action: isVerified ? `${user.role}_VERIFIED` : `${user.role}_UNVERIFIED`,
      details: `Admin ${session.email} changed verification status of ${roleLabel.toLowerCase()} ${user.email} to ${isVerified}`,
    });

    // Also notify the user
    await createNotification({
      userId: id,
      type: "SYSTEM",
      title: isVerified ? "Account Verified" : "Verification Update",
      message: isVerified 
        ? approvedMessage
        : "Your verification status has been updated. Please contact support if you have questions.",
      link: "/dashboard"
    });

    return NextResponse.json({ message: "User status updated", user });
  } catch (error) {
    console.error("User verification error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
