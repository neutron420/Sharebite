import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { withSecurity } from "@/lib/api-handler";
import { createNotification } from "@/lib/notifications";

async function patchNgoRiderVerificationHandler(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession({ preferredRole: "NGO", request });

    if (!session || session.role !== "NGO") {
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
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Verification request not found" }, { status: 404 });
    }

    if (existing.ngoId !== (session.userId as string)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (existing.status !== "PENDING_NGO_REVIEW") {
      return NextResponse.json(
        { error: "This rider has already been reviewed by your NGO." },
        { status: 400 }
      );
    }

    const nextStatus = action === "approve" ? "NGO_APPROVED" : "NGO_REJECTED";

    const updated = await prisma.riderVerificationRequest.update({
      where: { id },
      data: {
        status: nextStatus,
        ngoReviewedAt: new Date(),
        ngoReviewNote: note || null,
      },
      include: {
        rider: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (nextStatus === "NGO_APPROVED") {
      const admins = await prisma.user.findMany({
        where: { role: "ADMIN" },
        select: { id: true },
      });

      await Promise.all([
        createNotification({
          userId: updated.rider.id,
          type: "SYSTEM",
          title: "NGO Review Completed",
          message: "Your rider application was approved by the NGO and sent to admin for final verification.",
          link: "/rider/settings",
        }),
        admins.length > 0
          ? createNotification({
              userIds: admins.map((admin) => admin.id),
              type: "SYSTEM",
              title: "Rider Awaiting Final Verification",
              message: `Rider \"${updated.rider.name}\" was approved by an NGO and is waiting for final admin verification.`,
              link: "/admin/riders-verification",
            })
          : Promise.resolve(),
      ]);
    } else {
      await createNotification({
        userId: updated.rider.id,
        type: "SYSTEM",
        title: "Rider Application Update",
        message: "Your rider application was not approved by the selected NGO. You can contact support for clarification.",
        link: "/rider/settings",
      });
    }

    return NextResponse.json({
      message:
        nextStatus === "NGO_APPROVED"
          ? "Rider approved and forwarded to admin for final verification."
          : "Rider application rejected.",
      application: updated,
    });
  } catch (error) {
    console.error("NGO rider verification update error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export const PATCH = withSecurity(patchNgoRiderVerificationHandler, { limit: 20 });
