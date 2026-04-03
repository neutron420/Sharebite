import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { withSecurity } from "@/lib/api-handler";

async function getAdminRiderVerificationsHandler(request: Request) {
  try {
    const session = await getSession({ preferredRole: "ADMIN", request });
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const statusFilter = (searchParams.get("status") || "pending").toLowerCase();

    const where =
      statusFilter === "pending"
        ? { status: "NGO_APPROVED" as const }
        : statusFilter === "approved"
          ? { status: "ADMIN_APPROVED" as const }
          : statusFilter === "rejected"
            ? { status: "ADMIN_REJECTED" as const }
            : {};

    const applications = await prisma.riderVerificationRequest.findMany({
      where,
      include: {
        rider: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
            city: true,
            state: true,
            address: true,
            pincode: true,
            verificationDoc: true,
            createdAt: true,
            isVerified: true,
          },
        },
        ngo: {
          select: {
            id: true,
            name: true,
            email: true,
            city: true,
          },
        },
      },
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    });

    const [pending, approved, rejected] = await Promise.all([
      prisma.riderVerificationRequest.count({ where: { status: "NGO_APPROVED" } }),
      prisma.riderVerificationRequest.count({ where: { status: "ADMIN_APPROVED" } }),
      prisma.riderVerificationRequest.count({ where: { status: "ADMIN_REJECTED" } }),
    ]);

    return NextResponse.json({
      applications,
      stats: {
        pending,
        approved,
        rejected,
        total: pending + approved + rejected,
      },
    });
  } catch (error) {
    console.error("Admin rider verification list error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export const GET = withSecurity(getAdminRiderVerificationsHandler);
