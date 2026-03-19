import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { withSecurity } from "@/lib/api-handler";

async function postDonorReportHandler(request: Request) {
  try {
    const session = await getSession();
    // RBAC check (NGOs/Admins only)
    if (!session || (session.role !== "NGO" && session.role !== "ADMIN")) {
      return NextResponse.json(
        { error: "Unauthorized. Only NGOs can report donors." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { donorId, reason, details } = body;

    if (!donorId || !reason) {
      return NextResponse.json(
        { error: "Donor ID and reason are required" },
        { status: 400 }
      );
    }

    // Verify Donor exists
    const donor = await prisma.user.findUnique({
      where: { id: donorId, role: "DONOR" }
    });

    if (!donor) {
      return NextResponse.json(
        { error: "Donor not found" },
        { status: 404 }
      );
    }

    const report = await prisma.donorReport.create({
      data: {
        reason,
        details,
        reporterId: session.userId as string,
        donorId: donorId,
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
      title: "New Donor Report Submitted",
      message: `A report has been filed against donor ${donor.name} for "${reason}".`,
      link: `/admin/reports`
    }));

    await prisma.notification.createMany({
      data: notificationData
    });

    // Trigger real-time WebSocket broadcast
    try {
      await Promise.all(admins.map(admin =>
        fetch('http://localhost:8081/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: admin.id,
            notification: {
              type: "SYSTEM",
              title: "New Donor Report Submitted",
              message: `A report has been filed against donor ${donor.name} for "${reason}".`,
              link: `/admin/reports`,
              createdAt: new Date().toISOString(),
              isRead: false
            }
          })
        }).catch(() => {})
      ));
    } catch (e) {
      console.error("Failed to trigger WS for donor report:", e);
    }

    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    console.error("Donor report creation error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

async function getDonorReportsHandler(request: Request) {
  try {
    const session = await getSession({ request });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    // NGOs see only their own reports; Admins see all
    const where: any = {};
    if (session.role === "NGO") {
      where.reporterId = session.userId;
    }
    if (status && status !== "ALL") {
      where.status = status;
    }

    const reports = await prisma.donorReport.findMany({
      where,
      take: 50,
      include: {
        reporter: { select: { name: true, email: true } },
        donor: { select: { id: true, name: true, email: true, imageUrl: true, donorType: true } }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(reports);
  } catch (error) {
    console.error("Get donor reports error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export const POST = withSecurity(postDonorReportHandler, { limit: 15 });
export const GET = withSecurity(getDonorReportsHandler);
