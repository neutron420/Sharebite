import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import { createAuditLog } from "@/lib/audit";
import { withSecurity } from "@/lib/api-handler";

const NGO_SELECT = {
  id: true,
  email: true,
  name: true,
  role: true,
  phoneNumber: true,
  address: true,
  city: true,
  imageUrl: true,
  isVerified: true,
  strikeCount: true,
  suspensionExpiresAt: true,
  isLicenseSuspended: true,
  createdAt: true,
  updatedAt: true,
};

async function getNgoHandler(
  request: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ngo = await prisma.user.findUnique({
      where: { id, role: "NGO" },
      select: {
        ...NGO_SELECT,
        violations: {
          orderBy: { createdAt: "desc" }
        },
        reports: {
          where: { status: "PENDING" },
          include: {
            reporter: {
              select: { name: true, email: true }
            }
          },
          orderBy: { createdAt: "desc" }
        },
        _count: {
          select: { requests: true }
        }
      }
    });

    if (!ngo) {
      return NextResponse.json({ error: "NGO not found" }, { status: 404 });
    }

    return NextResponse.json(ngo);
  } catch (error) {
    console.error("Admin NGO fetch error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

async function updateNgoHandler(
	request: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { isVerified, action, reason } = body;

    // We assume withSecurity or Middleware handles initial Admin check
    // But we need session for Audit logs
    const session = request.headers.get("x-user-id"); // Injected by some wrappers or logic

    // Handle normal verification toggle
    if (action === undefined && typeof isVerified === "boolean") {
      const updatedUser = await prisma.user.update({
        where: { id, role: "NGO" },
        data: { isVerified },
        select: NGO_SELECT
      });

      await createNotification({
        userId: id,
        type: "SYSTEM",
        title: isVerified ? "Account Verified!" : "Verification Update",
        message: isVerified 
          ? "Congratulations! Your NGO account has been verified." 
          : "Your verification status has been updated. Please contact support.",
        link: "/dashboard"
      });

      await createAuditLog({
        adminId: "ADMIN_SYSTEM", // Ideally passed from wrapper
        action: isVerified ? "VERIFY_NGO" : "UNVERIFY_NGO",
        details: `${isVerified ? 'Verified' : 'Unverified'} NGO: ${id}`
      });

      return NextResponse.json({ message: "Verification status updated", user: updatedUser });
    }

    // Handle Strike/Warning System
    if (action === "STRIKE") {
      const { level, reportId } = body;
      const ngo = await prisma.user.findUnique({
        where: { id, role: "NGO" },
        select: { strikeCount: true, name: true }
      });

      if (!ngo) {
        return NextResponse.json({ error: "NGO not found" }, { status: 404 });
      }

      const strikeLevel = level ? Number(level) : ngo.strikeCount + 1;
      const updateData: any = { strikeCount: strikeLevel };
      let notificationTitle = "";
      let notificationMessage = "";

      if (strikeLevel === 1) {
        notificationTitle = "Level 1 Warning: Policy Violation";
        notificationMessage = `Warning: ${reason || "Mischievous activities detected"}. Further violations will lead to a 1-month block.`;
      } else if (strikeLevel === 2) {
        notificationTitle = "Level 2 Critical: 1-Month Block";
        const oneMonthFromNow = new Date();
        oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);
        updateData.suspensionExpiresAt = oneMonthFromNow;
        notificationMessage = `Your account has been blocked for 1 month due to violations. Reason: ${reason}`;
      } else {
        notificationTitle = "Level 3 Final: License Suspended";
        updateData.isLicenseSuspended = true;
        updateData.isVerified = false;
        notificationMessage = "Your NGO license has been permanently suspended due to critical violations. You can no longer use Sharebite.";
      }

      const transaction = [];
      transaction.push(prisma.user.update({
        where: { id },
        data: updateData,
        select: NGO_SELECT
      }));

      transaction.push(prisma.violation.create({
        data: {
          userId: id,
          level: strikeLevel > 3 ? 3 : strikeLevel,
          reason: reason || "Mischievous activity",
          adminId: "ADMIN_SYSTEM"
        }
      }));

      if (reportId) {
        transaction.push(prisma.report.update({
          where: { id: reportId },
          data: { status: "RESOLVED" }
        }));
      }

      const [updatedUser] = await prisma.$transaction(transaction);

      await createNotification({
        userId: id,
        type: "SYSTEM",
        title: notificationTitle,
        message: notificationMessage,
        link: "/dashboard"
      });

      await createAuditLog({
        adminId: "ADMIN_SYSTEM",
        action: "ISSUE_STRIKE",
        details: `Issued Strike Level ${strikeLevel} to NGO ${ngo.name} (${id}). Reason: ${reason}`
      });

      return NextResponse.json({
        message: `Strike Level ${strikeLevel} issued successfully`,
        user: updatedUser
      });
    }

    if (action === "UNBLOCK") {
      const [updatedUser] = await prisma.$transaction([
        prisma.user.update({
          where: { id },
          data: {
            strikeCount: 0,
            suspensionExpiresAt: null,
            isLicenseSuspended: false,
            isVerified: true
          },
          select: NGO_SELECT
        }),
        prisma.report.updateMany({
          where: { ngoId: id, status: "PENDING" },
          data: { status: "RESOLVED" }
        }),
        prisma.violation.create({
          data: {
            userId: id,
            level: 0,
            reason: reason || "Penalty lifted by admin",
            adminId: "ADMIN_SYSTEM"
          }
        })
      ]);

      await createNotification({
        userId: id,
        type: "SYSTEM",
        title: "Account Status: Restored",
        message: `Your account access has been fully restored by the administrator. ${reason ? "Reason: " + reason : ""}`,
        link: "/dashboard"
      });

      await createAuditLog({
        adminId: "ADMIN_SYSTEM",
        action: "RESTORE_NGO",
        details: `Restored NGO account: ${id}. Reason: ${reason || "Admin manual restore"}`
      });

      return NextResponse.json({
        message: "NGO account unblocked successfully",
        user: updatedUser
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("NGO administration error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

async function deleteNgoHandler(
	request: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
  try {
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

export const GET = withSecurity(getNgoHandler);
export const PATCH = withSecurity(updateNgoHandler);
export const DELETE = withSecurity(deleteNgoHandler);
