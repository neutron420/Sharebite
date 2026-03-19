import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import { createAuditLog } from "@/lib/audit";
import { withSecurity } from "@/lib/api-handler";
import { getSession } from "@/lib/auth";

async function handleUserAction(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, reason, level, reportId, reportType } = body;

    const session = await getSession({ request });
    const adminId = session?.userId;

    if (!session || session.role !== "ADMIN" || !adminId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (action === "STRIKE") {
      const user = await prisma.user.findUnique({
        where: { id },
        select: { strikeCount: true, name: true, role: true }
      });

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      const strikeLevel = level ? Number(level) : user.strikeCount + 1;
      const updateData: any = { strikeCount: strikeLevel };
      let notificationTitle = "";
      let notificationMessage = "";

      if (strikeLevel === 1) {
        notificationTitle = "Warning: Policy Violation";
        notificationMessage = `Warning: ${reason || "Misconduct detected"}. Further violations will lead to a 1-month block.`;
      } else if (strikeLevel === 2) {
        notificationTitle = "Critical Warning: 1-Month Block";
        const oneMonthFromNow = new Date();
        oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);
        updateData.suspensionExpiresAt = oneMonthFromNow;
        notificationMessage = `Your account has been blocked for 1 month due to violations. Reason: ${reason}`;
      } else {
        notificationTitle = "Account Permanently Suspended";
        updateData.isLicenseSuspended = true;
        updateData.isVerified = false;
        notificationMessage = "Your account has been permanently suspended due to critical violations.";
      }

      const transaction = [];
      transaction.push(prisma.user.update({
        where: { id },
        data: updateData
      }));

      transaction.push(prisma.violation.create({
        data: {
          userId: id,
          level: strikeLevel > 3 ? 3 : strikeLevel,
          reason: reason || "System misconduct",
          adminId
        }
      }));

      // Resolve the report (NGO report or Donor report)
      if (reportId) {
        if (reportType === "DONOR_REPORT") {
          transaction.push(prisma.donorReport.update({
            where: { id: reportId },
            data: { status: "RESOLVED" }
          }));
        } else {
          transaction.push(prisma.report.update({
            where: { id: reportId },
            data: { status: "RESOLVED" }
          }));
        }
      }

      await prisma.$transaction(transaction);

      await createNotification({
        userId: id,
        type: "SYSTEM",
        title: notificationTitle,
        message: notificationMessage,
        link: "/dashboard"
      });

      await createAuditLog({
        adminId,
        action: "ISSUE_STRIKE",
        details: `Issued Strike Level ${strikeLevel} to ${user.role} ${user.name} (${id}). Reason: ${reason}`
      });

      return NextResponse.json({ message: `Action applied successfully` });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("User action error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export const POST = withSecurity(handleUserAction);
