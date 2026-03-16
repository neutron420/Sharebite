import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { withSecurity } from "@/lib/api-handler";

async function patchReportHandler(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession({ request });
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status } = body; // "RESOLVED" or "DISMISSED"

    if (!status || !["RESOLVED", "DISMISSED"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be RESOLVED or DISMISSED." },
        { status: 400 }
      );
    }

    const report = await prisma.report.findUnique({ where: { id } });
    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    const updated = await prisma.report.update({
      where: { id },
      data: { status },
    });

    // Notify the donor who filed the report
    await prisma.notification.create({
      data: {
        userId: report.reporterId,
        type: "SYSTEM",
        title: status === "DISMISSED" ? "Complaint Dismissed" : "Complaint Resolved",
        message:
          status === "DISMISSED"
            ? "Your complaint has been reviewed and dismissed by the admin. If you believe this is an error, please contact support."
            : "Your complaint has been reviewed and resolved. Action has been taken against the reported NGO.",
        link: "/donor/complaints",
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Update report error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export const PATCH = withSecurity(patchReportHandler);
