import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { withSecurity } from "@/lib/api-handler";

async function postReportHandler(request: Request) {
  try {
    const session = await getSession();
    // RBAC check (Donors/Admins only)
    if (!session || (session.role !== "DONOR" && session.role !== "ADMIN")) {
      return NextResponse.json(
        { error: "Unauthorized. Only donors can report NGOs." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { ngoId, reason, details } = body;

    if (!ngoId || !reason) {
      return NextResponse.json(
        { error: "NGO ID and reason are required" },
        { status: 400 }
      );
    }

    // Verify NGO exists
    const ngo = await prisma.user.findUnique({
      where: { id: ngoId, role: "NGO" }
    });

    if (!ngo) {
      return NextResponse.json(
        { error: "NGO not found" },
        { status: 404 }
      );
    }

    const report = await prisma.report.create({
      data: {
        reason,
        details,
        reporterId: session.userId as string,
        ngoId: ngoId,
      }
    });

    // Notify Admins
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true }
    });

    const notificationData = admins.map(admin => ({
      userId: admin.id,
      type: "SYSTEM" as const,
      title: "New NGO Report Submitted",
      message: `A report has been filed against ${ngo.name} for "${reason}".`,
      link: `/admin/reports`
    }));

    await prisma.notification.createMany({
      data: notificationData
    });

    // Trigger real-time WebSocket broadcast (Internal logic)
    try {
      await Promise.all(admins.map(admin => 
        fetch('http://localhost:8081/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            userId: admin.id, 
            notification: {
              type: "SYSTEM",
              title: "New NGO Report Submitted",
              message: `A report has been filed against ${ngo.name} for "${reason}".`,
              link: `/admin/reports`,
              createdAt: new Date().toISOString(),
              isRead: false
            }
          })
        }).catch(() => {}) 
      ));
    } catch (e) {
      console.error("Failed to trigger WS for report:", e);
    }

    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    console.error("Report creation error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

async function getReportsHandler(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "PENDING";

    const reports = await prisma.report.findMany({
      where: { status },
      take: 20, // Added pagination
      include: {
        reporter: { select: { name: true, email: true } },
        ngo: { select: { id: true, name: true, email: true } }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(reports);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export const POST = withSecurity(postReportHandler, { limit: 5 });
export const GET = withSecurity(getReportsHandler);
