import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { withSecurity } from "@/lib/api-handler";
import { createNotification } from "@/lib/notifications";
import { createAuditLog } from "@/lib/audit";

async function patchAdminRiderVerificationHandler(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession({ preferredRole: "ADMIN", request });
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const action = body?.action;
    const note = typeof body?.note === "string" ? body.note.trim() : undefined;

    if (action !== "approve" && action !== "reject") {
      return NextResponse.json(
        { error: "Invalid action. Use 'approve' or 'reject'." },
        { status: 400 }
      );
    }

    const existing = await prisma.riderVerificationRequest.findUnique({
      where: { id },
      include: {
        rider: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        ngo: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Verification request not found" }, { status: 404 });
    }

    if (existing.status !== "NGO_APPROVED") {
      return NextResponse.json(
        { error: "Only NGO-approved riders can be finalized by admin." },
        { status: 400 }
      );
    }

    const nextStatus = action === "approve" ? "ADMIN_APPROVED" : "ADMIN_REJECTED";

    const updated = await prisma.$transaction(async (tx) => {
      const updatedApplication = await tx.riderVerificationRequest.update({
        where: { id },
        data: {
          status: nextStatus,
          adminReviewedAt: new Date(),
          adminReviewNote: note || null,
        },
        include: {
          rider: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          ngo: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      await tx.user.update({
        where: { id: existing.riderId },
        data: {
          isVerified: nextStatus === "ADMIN_APPROVED",
        },
      });

      return updatedApplication;
    });

    await createAuditLog({
      adminId: session.userId as string,
      action: nextStatus === "ADMIN_APPROVED" ? "RIDER_VERIFIED" : "RIDER_VERIFICATION_REJECTED",
      details: `Admin ${session.email} set rider ${updated.rider.email} verification status to ${nextStatus}`,
    });

    await Promise.all([
      createNotification({
        userId: updated.rider.id,
        type: "SYSTEM",
        title:
          nextStatus === "ADMIN_APPROVED"
            ? "Rider Account Verified"
            : "Rider Verification Result",
        message:
          nextStatus === "ADMIN_APPROVED"
            ? "Your rider profile is fully verified. You can now claim missions."
            : "Your rider verification was not approved by admin. Contact support for next steps.",
        link: "/rider/settings",
      }),
      createNotification({
        userId: updated.ngo.id,
        type: "SYSTEM",
        title: "Rider Final Verification Update",
        message:
          nextStatus === "ADMIN_APPROVED"
            ? `Rider \"${updated.rider.name}\" has been finally approved by admin.`
            : `Rider \"${updated.rider.name}\" was not approved in final admin verification.`,
        link: "/ngo/riders",
      }),
    ]);

    return NextResponse.json({
      message:
        nextStatus === "ADMIN_APPROVED"
          ? "Rider verified successfully."
          : "Rider verification rejected.",
      application: updated,
    });
  } catch (error) {
    console.error("Admin rider verification update error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export const PATCH = withSecurity(patchAdminRiderVerificationHandler, { limit: 20 });
