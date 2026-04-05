import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createNotification, relayRealtimeEvent } from "@/lib/notifications";
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

    if (typeof isVerified !== "boolean") {
      return NextResponse.json({ error: "isVerified must be a boolean" }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: { role: true, email: true, verificationDoc: true },
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

    if (targetUser.role === "NGO") {
      const ngoVerification = await prisma.ngoVerification.upsert({
        where: { ngoId: id },
        update: {},
        create: {
          ngoId: id,
          registrationCertUrl: targetUser.verificationDoc || undefined,
        },
      });

      if (isVerified && ngoVerification.status !== "FIELD_VERIFIED" && ngoVerification.status !== "FULLY_VERIFIED") {
        return NextResponse.json(
          {
            error:
              "NGO can only be fully verified after field verification. Complete online + field steps first.",
          },
          { status: 400 }
        );
      }

      if (isVerified) {
        const nextReverificationAt = new Date();
        nextReverificationAt.setMonth(nextReverificationAt.getMonth() + 6);

        await prisma.$transaction([
          prisma.user.update({
            where: { id },
            data: { isVerified: true },
          }),
          prisma.ngoVerification.update({
            where: { ngoId: id },
            data: {
              status: "FULLY_VERIFIED",
              finalReviewedAt: new Date(),
              finalReviewedById: session.userId as string,
              lastVerifiedAt: new Date(),
              nextReverificationAt,
            },
          }),
        ]);
      } else {
        await prisma.$transaction([
          prisma.user.update({
            where: { id },
            data: { isVerified: false },
          }),
          prisma.ngoVerification.update({
            where: { ngoId: id },
            data: {
              status: "REJECTED",
              rejectedAt: new Date(),
              rejectedById: session.userId as string,
              rejectionReason: "Verification revoked by admin.",
            },
          }),
        ]);
      }

      await createAuditLog({
        adminId: session.userId as string,
        action: isVerified ? "NGO_FULLY_VERIFIED" : "NGO_VERIFICATION_REVOKED",
        details: `Admin ${session.email} changed NGO ${targetUser.email} final verification to ${isVerified}`,
      });

      await createNotification({
        userId: id,
        type: "SYSTEM",
        title: isVerified ? "NGO Fully Verified" : "Verification Revoked",
        message: isVerified
          ? "Your NGO is now fully verified after successful online and on-ground checks."
          : "Your NGO verification was revoked. Please contact support for next steps.",
        link: "/dashboard",
      });

      const adminUsers = await prisma.user.findMany({
        where: { role: "ADMIN" },
        select: { id: true },
        take: 100,
      });

      await relayRealtimeEvent({
        userIds: adminUsers.map((admin) => admin.id),
        type: "NGO_VERIFICATION_UPDATED",
        payload: {
          ngoId: id,
          status: isVerified ? "FULLY_VERIFIED" : "REJECTED",
          action: isVerified ? "LEGACY_FINAL_APPROVE" : "LEGACY_REVOKE",
          byUserId: session.userId as string,
          updatedAt: new Date().toISOString(),
        },
      });

      return NextResponse.json({ message: "NGO verification status updated" });
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
