import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { withSecurity } from "@/lib/api-handler";
import { createAuditLog } from "@/lib/audit";
import { createNotification, relayRealtimeEvent } from "@/lib/notifications";

async function getGroundAdminsHandler(request: Request) {
  try {
    const session = await getSession({ request });
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = (searchParams.get("search") || "").trim();
    const cityFilter = (searchParams.get("city") || "").trim().toLowerCase();
    const statusFilter = searchParams.get("status") || "all"; // all, active, inactive
    const page = Math.max(1, Number(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") || "25")));

    const groundAdmins = await prisma.user.findMany({
      where: {
        role: "GROUND_ADMIN",
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
                { city: { contains: search, mode: "insensitive" } },
                { phoneNumber: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: [{ city: "asc" }, { createdAt: "desc" }],
      select: {
        id: true,
        name: true,
        email: true,
        city: true,
        address: true,
        phoneNumber: true,
        district: true,
        state: true,
        pincode: true,
        imageUrl: true,
        isVerified: true,
        isAvailable: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Get field assignment counts per ground admin
    const fieldAssignments = await prisma.ngoVerification.groupBy({
      by: ["fieldOfficerId"],
      _count: { id: true },
      where: {
        fieldOfficerId: { in: groundAdmins.map((ga) => ga.id) },
      },
    });

    const assignmentMap = new Map(
      fieldAssignments.map((a) => [a.fieldOfficerId, a._count.id])
    );

    // Get active (pending) assignments
    const activeAssignments = await prisma.ngoVerification.groupBy({
      by: ["fieldOfficerId"],
      _count: { id: true },
      where: {
        fieldOfficerId: { in: groundAdmins.map((ga) => ga.id) },
        status: "FIELD_VISIT_SCHEDULED",
      },
    });

    const activeAssignmentMap = new Map(
      activeAssignments.map((a) => [a.fieldOfficerId, a._count.id])
    );

    // Get completed (field verified) assignments
    const completedAssignments = await prisma.ngoVerification.groupBy({
      by: ["fieldOfficerId"],
      _count: { id: true },
      where: {
        fieldOfficerId: { in: groundAdmins.map((ga) => ga.id) },
        status: { in: ["FIELD_VERIFIED", "FULLY_VERIFIED"] },
      },
    });

    const completedAssignmentMap = new Map(
      completedAssignments.map((a) => [a.fieldOfficerId, a._count.id])
    );

    let items = groundAdmins.map((ga) => ({
      ...ga,
      totalAssignments: assignmentMap.get(ga.id) || 0,
      activeAssignments: activeAssignmentMap.get(ga.id) || 0,
      completedAssignments: completedAssignmentMap.get(ga.id) || 0,
    }));

    // Apply city filter
    if (cityFilter) {
      items = items.filter(
        (ga) => (ga.city || "").toLowerCase() === cityFilter
      );
    }

    // Apply status filter
    if (statusFilter === "active") {
      items = items.filter((ga) => ga.isAvailable);
    } else if (statusFilter === "inactive") {
      items = items.filter((ga) => !ga.isAvailable);
    }

    // Extract unique cities for filter dropdown
    const allCities = [
      ...new Set(
        groundAdmins
          .map((ga) => ga.city)
          .filter((c): c is string => !!c)
          .map((c) => c.trim())
      ),
    ].sort();

    const total = items.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const start = (page - 1) * limit;

    return NextResponse.json({
      items: items.slice(start, start + limit),
      cities: allCities,
      stats: {
        total: groundAdmins.length,
        active: groundAdmins.filter((ga) => ga.isAvailable).length,
        inactive: groundAdmins.filter((ga) => !ga.isAvailable).length,
        totalCities: allCities.length,
      },
      pagination: { page, limit, total, totalPages },
    });
  } catch (error) {
    console.error("Ground admins fetch error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

async function patchGroundAdminHandler(request: Request) {
  try {
    const session = await getSession({ request });
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { groundAdminId, action } = body;

    if (!groundAdminId || typeof groundAdminId !== "string") {
      return NextResponse.json(
        { error: "groundAdminId is required" },
        { status: 400 }
      );
    }

    const groundAdmin = await prisma.user.findUnique({
      where: { id: groundAdminId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isAvailable: true,
        city: true,
      },
    });

    if (!groundAdmin || groundAdmin.role !== "GROUND_ADMIN") {
      return NextResponse.json(
        { error: "Ground Admin not found" },
        { status: 404 }
      );
    }

    if (action === "ACTIVATE") {
      await prisma.user.update({
        where: { id: groundAdminId },
        data: { isAvailable: true },
      });

      await createNotification({
        userId: groundAdminId,
        type: "SYSTEM",
        title: "Account Activated",
        message:
          "Your Ground Admin account has been re-activated. You can now receive field verification assignments.",
        link: "/ground-admin",
      });

      await createAuditLog({
        adminId: session.userId as string,
        action: "GROUND_ADMIN_ACTIVATED",
        details: `Activated Ground Admin ${groundAdmin.email} (${groundAdmin.name})`,
      });

      return NextResponse.json({
        message: `${groundAdmin.name} has been activated`,
      });
    }

    if (action === "DEACTIVATE") {
      // Check for active assignments before deactivation
      const pendingAssignments = await prisma.ngoVerification.count({
        where: {
          fieldOfficerId: groundAdminId,
          status: "FIELD_VISIT_SCHEDULED",
        },
      });

      await prisma.user.update({
        where: { id: groundAdminId },
        data: { isAvailable: false },
      });

      await createNotification({
        userId: groundAdminId,
        type: "SYSTEM",
        title: "Account Deactivated",
        message:
          "Your Ground Admin account has been deactivated by an administrator. Contact support if this is unexpected.",
        link: "/ground-admin",
      });

      await createAuditLog({
        adminId: session.userId as string,
        action: "GROUND_ADMIN_DEACTIVATED",
        details: `Deactivated Ground Admin ${groundAdmin.email} (${groundAdmin.name}). Active assignments: ${pendingAssignments}`,
      });

      return NextResponse.json({
        message: `${groundAdmin.name} has been deactivated`,
        warning:
          pendingAssignments > 0
            ? `This officer has ${pendingAssignments} pending field assignment(s). Consider reassigning them.`
            : undefined,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Ground admin update error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export const GET = withSecurity(getGroundAdminsHandler);
export const PATCH = withSecurity(patchGroundAdminHandler);
