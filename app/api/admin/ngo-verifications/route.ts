import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { withSecurity } from "@/lib/api-handler";

const GROUND_ADMIN_ACTIONS = ["GROUND_ADMIN_ROLE_LOCK", "GROUND_ADMIN_LOGIN"] as const;

const ALLOWED_STATUSES = [
  "PENDING",
  "ONLINE_VERIFIED",
  "FIELD_VISIT_SCHEDULED",
  "FIELD_VERIFIED",
  "FULLY_VERIFIED",
  "REJECTED",
] as const;

type VerificationStatus = (typeof ALLOWED_STATUSES)[number];

function normalizeStatus(status: string | null): VerificationStatus | null {
  if (!status) return null;
  return (ALLOWED_STATUSES as readonly string[]).includes(status) ? (status as VerificationStatus) : null;
}

function isOnlineVerifiedStatus(status: VerificationStatus) {
  return status !== "PENDING" && status !== "REJECTED";
}

function isGroundVerifiedStatus(status: VerificationStatus) {
  return status === "FIELD_VERIFIED" || status === "FULLY_VERIFIED";
}

async function getNgoVerificationsHandler(request: Request) {
  try {
    const session = await getSession({ preferredRole: "ADMIN", request });
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = (searchParams.get("search") || "").trim();
    const statusFilter = normalizeStatus(searchParams.get("status"));
    const scope = (searchParams.get("scope") || "admin").toLowerCase();
    const cityFilter = (searchParams.get("city") || "").trim().toLowerCase();
    const page = Math.max(1, Number(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") || "25")));

    const [actor, ngos, groundAdminLoginEvents] = await Promise.all([
      prisma.user.findUnique({
        where: { id: session.userId as string },
        select: { id: true, name: true, email: true, city: true },
      }),
      prisma.user.findMany({
        where: {
          role: "NGO",
          ...(search
            ? {
                OR: [
                  { name: { contains: search, mode: "insensitive" } },
                  { email: { contains: search, mode: "insensitive" } },
                  { city: { contains: search, mode: "insensitive" } },
                ],
              }
            : {}),
        },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          city: true,
          address: true,
          phoneNumber: true,
          createdAt: true,
          isVerified: true,
          ngoVerification: {
            select: {
              status: true,
              registrationCertUrl: true,
              panTanUrl: true,
              bankProofUrl: true,
              addressProofUrl: true,
              contactPersonIdUrl: true,
              onlineReviewNote: true,
              onlineVerifiedAt: true,
              onlineVerifiedById: true,
              fieldVisitCity: true,
              fieldOfficerId: true,
              fieldOfficerName: true,
              fieldVisitScheduledAt: true,
              fieldChecklist: true,
              officeExists: true,
              keyPersonConfirmed: true,
              fieldEvidencePhotoUrls: true,
              fieldNotes: true,
              fieldCheckInAt: true,
              fieldCheckOutAt: true,
              fieldCheckInLatitude: true,
              fieldCheckInLongitude: true,
              fieldCheckOutLatitude: true,
              fieldCheckOutLongitude: true,
              fieldVerifiedAt: true,
              fieldVerifiedById: true,
              finalReviewNote: true,
              finalReviewedAt: true,
              finalReviewedById: true,
              rejectionReason: true,
              rejectedAt: true,
              rejectedById: true,
              lastVerifiedAt: true,
              nextReverificationAt: true,
              updatedAt: true,
            },
          },
        },
      }),
      prisma.auditLog.findMany({
        where: {
          action: {
            in: [...GROUND_ADMIN_ACTIONS],
          },
        },
        select: {
          adminId: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 2000,
      }),
    ]);

    const groundAdminIds = Array.from(new Set(groundAdminLoginEvents.map((event) => event.adminId)));
    const fieldOfficers =
      groundAdminIds.length > 0
        ? await prisma.user.findMany({
            where: {
              role: "ADMIN",
              id: {
                in: groundAdminIds,
              },
            },
            orderBy: [{ city: "asc" }, { name: "asc" }],
            select: {
              id: true,
              name: true,
              email: true,
              city: true,
            },
          })
        : [];

    const actorCity = actor?.city?.toLowerCase() || "";
    const isGroundAdminActor = groundAdminIds.includes(session.userId as string);

    const items = ngos
      .map((ngo) => {
        const record = ngo.ngoVerification;
        const status = (record?.status || (ngo.isVerified ? "FULLY_VERIFIED" : "PENDING")) as VerificationStatus;

        return {
          ngoId: ngo.id,
          name: ngo.name,
          email: ngo.email,
          city: ngo.city,
          address: ngo.address,
          phoneNumber: ngo.phoneNumber,
          createdAt: ngo.createdAt,
          isVerified: ngo.isVerified,
          status,
          onlineVerified: isOnlineVerifiedStatus(status),
          groundVerified: isGroundVerifiedStatus(status),
          lastVerifiedAt: record?.lastVerifiedAt || null,
          nextReverificationAt: record?.nextReverificationAt || null,
          registrationCertUrl: record?.registrationCertUrl || null,
          panTanUrl: record?.panTanUrl || null,
          bankProofUrl: record?.bankProofUrl || null,
          addressProofUrl: record?.addressProofUrl || null,
          contactPersonIdUrl: record?.contactPersonIdUrl || null,
          onlineReviewNote: record?.onlineReviewNote || null,
          onlineVerifiedAt: record?.onlineVerifiedAt || null,
          onlineVerifiedById: record?.onlineVerifiedById || null,
          fieldVisitCity: record?.fieldVisitCity || ngo.city || null,
          fieldOfficerId: record?.fieldOfficerId || null,
          fieldOfficerName: record?.fieldOfficerName || null,
          fieldVisitScheduledAt: record?.fieldVisitScheduledAt || null,
          fieldChecklist: record?.fieldChecklist || null,
          officeExists: record?.officeExists ?? null,
          keyPersonConfirmed: record?.keyPersonConfirmed ?? null,
          fieldEvidencePhotoUrls: record?.fieldEvidencePhotoUrls || null,
          fieldNotes: record?.fieldNotes || null,
          fieldCheckInAt: record?.fieldCheckInAt || null,
          fieldCheckOutAt: record?.fieldCheckOutAt || null,
          fieldCheckInLatitude: record?.fieldCheckInLatitude ?? null,
          fieldCheckInLongitude: record?.fieldCheckInLongitude ?? null,
          fieldCheckOutLatitude: record?.fieldCheckOutLatitude ?? null,
          fieldCheckOutLongitude: record?.fieldCheckOutLongitude ?? null,
          fieldVerifiedAt: record?.fieldVerifiedAt || null,
          fieldVerifiedById: record?.fieldVerifiedById || null,
          finalReviewNote: record?.finalReviewNote || null,
          finalReviewedAt: record?.finalReviewedAt || null,
          finalReviewedById: record?.finalReviewedById || null,
          rejectionReason: record?.rejectionReason || null,
          rejectedAt: record?.rejectedAt || null,
          rejectedById: record?.rejectedById || null,
          updatedAt: record?.updatedAt || ngo.createdAt,
        };
      })
      .filter((item) => {
        if (statusFilter && item.status !== statusFilter) return false;

        if (cityFilter) {
          const itemCity = (item.fieldVisitCity || item.city || "").toLowerCase();
          if (itemCity !== cityFilter) return false;
        }

        if (scope === "field") {
          if (!isGroundAdminActor) return false;
          if (item.status !== "FIELD_VISIT_SCHEDULED") return false;

          const assignedToActor = item.fieldOfficerId === (session.userId as string);
          const sameCityAsActor = !!actorCity && (item.fieldVisitCity || "").toLowerCase() === actorCity;
          return assignedToActor || sameCityAsActor;
        }

        return true;
      });

    const total = items.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const start = (page - 1) * limit;

    return NextResponse.json({
      items: items.slice(start, start + limit),
      fieldOfficers,
      actor: {
        id: actor?.id || session.userId,
        name: actor?.name || session.email,
        email: actor?.email || session.email,
        city: actor?.city || null,
      },
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error("NGO verifications fetch error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export const GET = withSecurity(getNgoVerificationsHandler);
