import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { withSecurity } from "@/lib/api-handler";
import { createNotification, relayRealtimeEvent } from "@/lib/notifications";
import { createAuditLog } from "@/lib/audit";

const ACTIONS = {
  ONLINE_VERIFY: "ONLINE_VERIFY",
  SCHEDULE_FIELD_VISIT: "SCHEDULE_FIELD_VISIT",
  SUBMIT_FIELD_REPORT: "SUBMIT_FIELD_REPORT",
  FINAL_APPROVE: "FINAL_APPROVE",
  REJECT: "REJECT",
} as const;

const ADMIN_ONLY_ACTIONS = new Set<string>([
  ACTIONS.ONLINE_VERIFY,
  ACTIONS.SCHEDULE_FIELD_VISIT,
  ACTIONS.FINAL_APPROVE,
  ACTIONS.REJECT,
]);

type VerificationAction = (typeof ACTIONS)[keyof typeof ACTIONS];

function toDateOrNull(input: unknown) {
  if (!input || typeof input !== "string") return null;
  const parsed = new Date(input);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toNumberOrNull(input: unknown) {
  if (input === null || input === undefined || input === "") return null;
  const value = Number(input);
  return Number.isFinite(value) ? value : null;
}

function computeNextReverificationDate(months: number) {
  const now = new Date();
  now.setMonth(now.getMonth() + months);
  return now;
}

async function getNgoVerificationHandler(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession({ request });
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: ngoId } = await params;

    const [actor, ngo] = await Promise.all([
      prisma.user.findUnique({
        where: { id: session.userId as string },
        select: { id: true, name: true, email: true, city: true },
      }),
      prisma.user.findUnique({
        where: { id: ngoId },
        select: {
          id: true,
          role: true,
          name: true,
          email: true,
          city: true,
          address: true,
          phoneNumber: true,
          createdAt: true,
          isVerified: true,
          verificationDoc: true,
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
    ]);

    let fieldOfficers: Array<{
      id: string;
      name: string;
      email: string;
      city: string | null;
    }> = [];

    try {
      fieldOfficers = await prisma.user.findMany({
        where: {
          role: "GROUND_ADMIN",
        },
        orderBy: [{ city: "asc" }, { name: "asc" }],
        select: {
          id: true,
          name: true,
          email: true,
          city: true,
        },
      });
    } catch (fieldOfficerError) {
      console.error("Ground admin lookup failed while loading NGO verification detail:", fieldOfficerError);
    }

    if (!ngo || ngo.role !== "NGO") {
      return NextResponse.json({ error: "NGO not found" }, { status: 404 });
    }

    const record = ngo.ngoVerification;
    const status = (record?.status || (ngo.isVerified ? "FULLY_VERIFIED" : "PENDING")) as
      | "PENDING"
      | "ONLINE_VERIFIED"
      | "FIELD_VISIT_SCHEDULED"
      | "FIELD_VERIFIED"
      | "FULLY_VERIFIED"
      | "REJECTED";

    return NextResponse.json({
      item: {
        ngoId: ngo.id,
        name: ngo.name,
        email: ngo.email,
        city: ngo.city,
        address: ngo.address,
        phoneNumber: ngo.phoneNumber,
        createdAt: ngo.createdAt,
        isVerified: ngo.isVerified,
        status,
        onlineVerified:
          status === "ONLINE_VERIFIED" ||
          status === "FIELD_VISIT_SCHEDULED" ||
          status === "FIELD_VERIFIED" ||
          status === "FULLY_VERIFIED",
        groundVerified: status === "FIELD_VERIFIED" || status === "FULLY_VERIFIED",
        lastVerifiedAt: record?.lastVerifiedAt || null,
        nextReverificationAt: record?.nextReverificationAt || null,
        registrationCertUrl: record?.registrationCertUrl || ngo.verificationDoc || null,
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
      },
      fieldOfficers,
      actor: {
        id: actor?.id || session.userId,
        name: actor?.name || session.email,
        email: actor?.email || session.email,
        city: actor?.city || null,
      },
    });
  } catch (error) {
    console.error("NGO verification detail fetch error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

async function patchNgoVerificationHandler(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession({ request });
    if (!session || (session.role !== "ADMIN" && session.role !== "GROUND_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: ngoId } = await params;
    const body = await request.json();
    const action = body?.action as VerificationAction;

    if (!Object.values(ACTIONS).includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    if (ADMIN_ONLY_ACTIONS.has(action) && session.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only Admin can perform this verification step." },
        { status: 403 }
      );
    }

    if (action === ACTIONS.SUBMIT_FIELD_REPORT && session.role !== "GROUND_ADMIN") {
      return NextResponse.json(
        { error: "Only Ground Admin can submit field verification reports." },
        { status: 403 }
      );
    }

    const [actor, ngo] = await Promise.all([
      prisma.user.findUnique({
        where: { id: session.userId as string },
        select: { id: true, name: true, email: true, city: true, role: true },
      }),
      prisma.user.findUnique({
        where: { id: ngoId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          city: true,
          isVerified: true,
          verificationDoc: true,
          ngoVerification: true,
        },
      }),
    ]);

    if (!actor) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!ngo || ngo.role !== "NGO") {
      return NextResponse.json({ error: "NGO not found" }, { status: 404 });
    }

    const verification = await prisma.ngoVerification.upsert({
      where: { ngoId },
      update: {},
      create: {
        ngoId,
        registrationCertUrl: ngo.verificationDoc || undefined,
      },
    });

    const adminUsers = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true },
      take: 100,
    });
    const adminIds = adminUsers.map((user) => user.id);

    const emitVerificationRealtime = async (
      status: string,
      extraPayload: Record<string, unknown> = {}
    ) => {
      const payload = {
        ngoId,
        status,
        action,
        byUserId: actor.id,
        updatedAt: new Date().toISOString(),
        ...extraPayload,
      };

      await Promise.all([
        relayRealtimeEvent({
          userIds: adminIds,
          type: "NGO_VERIFICATION_UPDATED",
          payload,
        }),
        relayRealtimeEvent({
          userId: ngoId,
          type: "NGO_VERIFICATION_UPDATED",
          payload,
        }),
      ]);
    };

    if (action === ACTIONS.ONLINE_VERIFY) {
      if (
        verification.status === "FIELD_VISIT_SCHEDULED" ||
        verification.status === "FIELD_VERIFIED" ||
        verification.status === "FULLY_VERIFIED"
      ) {
        return NextResponse.json(
          {
            error:
              "Online verification is locked after field assignment. Wait for Ground Admin verification and final review.",
          },
          { status: 400 }
        );
      }

      const registrationCertUrl = body?.registrationCertUrl || verification.registrationCertUrl;
      const panTanUrl = body?.panTanUrl || verification.panTanUrl;
      const bankProofUrl = body?.bankProofUrl || verification.bankProofUrl;
      const addressProofUrl = body?.addressProofUrl || verification.addressProofUrl;
      const contactPersonIdUrl = body?.contactPersonIdUrl || verification.contactPersonIdUrl;

      const missingDocs = [
        ["registration certificate", registrationCertUrl],
        ["PAN/TAN", panTanUrl],
        ["bank details proof", bankProofUrl],
        ["address proof", addressProofUrl],
        ["contact person ID", contactPersonIdUrl],
      ].filter((entry) => !entry[1]);

      if (missingDocs.length > 0) {
        return NextResponse.json(
          {
            error: "All mandatory online verification documents are required.",
            missing: missingDocs.map((entry) => entry[0]),
          },
          { status: 400 }
        );
      }

      const [updatedVerification] = await prisma.$transaction([
        prisma.ngoVerification.update({
          where: { ngoId },
          data: {
            status: "ONLINE_VERIFIED",
            registrationCertUrl,
            panTanUrl,
            bankProofUrl,
            addressProofUrl,
            contactPersonIdUrl,
            onlineReviewNote: body?.onlineReviewNote || null,
            onlineVerifiedAt: new Date(),
            onlineVerifiedById: actor.id,
            rejectionReason: null,
            rejectedAt: null,
            rejectedById: null,
          },
        }),
        prisma.user.update({
          where: { id: ngoId },
          data: {
            isVerified: false,
            verificationDoc: registrationCertUrl,
          },
        }),
      ]);

      await createNotification({
        userId: ngoId,
        type: "SYSTEM",
        title: "Online Verification Completed",
        message: "Your documents have been verified online. A field visit will be scheduled next.",
        link: "/ngo/dashboard",
      });

      await createAuditLog({
        adminId: actor.id,
        action: "NGO_ONLINE_VERIFIED",
        details: `Online verification completed for NGO ${ngo.email} by ${actor.email}`,
      });

      await emitVerificationRealtime(updatedVerification.status, {
        onlineVerifiedAt: updatedVerification.onlineVerifiedAt,
      });

      return NextResponse.json({ message: "Online verification completed", verification: updatedVerification });
    }

    if (action === ACTIONS.SCHEDULE_FIELD_VISIT) {
      const fieldOfficerId = typeof body?.fieldOfficerId === "string" ? body.fieldOfficerId : "";
      const scheduledAt = toDateOrNull(body?.fieldVisitScheduledAt);
      const explicitCity = typeof body?.fieldVisitCity === "string" ? body.fieldVisitCity.trim() : "";

      if (
        verification.status === "FIELD_VISIT_SCHEDULED" ||
        verification.status === "FIELD_VERIFIED" ||
        verification.status === "FULLY_VERIFIED"
      ) {
        return NextResponse.json(
          {
            error:
              "Field assignment is locked. Ground Admin verification is in progress or already completed.",
          },
          { status: 400 }
        );
      }

      if (!fieldOfficerId) {
        return NextResponse.json({ error: "fieldOfficerId is required" }, { status: 400 });
      }

      const officer = await prisma.user.findUnique({
        where: { id: fieldOfficerId },
        select: { id: true, role: true, name: true, city: true, email: true },
      });

      if (!officer || officer.role !== "GROUND_ADMIN") {
        return NextResponse.json(
          { error: "Assigned field officer must be a Ground Admin user." },
          { status: 400 }
        );
      }

      const fieldVisitCity = explicitCity || officer.city || ngo.city || "";
      if (!fieldVisitCity) {
        return NextResponse.json({ error: "A city is required to schedule field verification" }, { status: 400 });
      }

      if (verification.status !== "ONLINE_VERIFIED") {
        return NextResponse.json(
          { error: "NGO must be online verified before scheduling a field visit" },
          { status: 400 }
        );
      }

      const updatedVerification = await prisma.ngoVerification.update({
        where: { ngoId },
        data: {
          status: "FIELD_VISIT_SCHEDULED",
          fieldOfficerId: officer.id,
          fieldOfficerName: officer.name,
          fieldVisitCity,
          fieldVisitScheduledAt: scheduledAt,
        },
      });

      await Promise.all([
        createNotification({
          userId: ngoId,
          type: "SYSTEM",
          title: "Field Visit Scheduled",
          message: `Your NGO will be visited by ${officer.name} for on-ground verification in ${fieldVisitCity}.`,
          link: "/ngo/dashboard",
        }),
        createNotification({
          userId: officer.id,
          type: "SYSTEM",
          title: "New NGO Field Verification Assignment",
          message: `${ngo.name} was assigned to you for on-ground verification in ${fieldVisitCity}.`,
          link: "/ground-admin",
        }),
      ]);

      await createAuditLog({
        adminId: actor.id,
        action: "NGO_FIELD_VISIT_SCHEDULED",
        details: `Scheduled field visit for NGO ${ngo.email} to officer ${officer.email} (${fieldVisitCity})`,
      });

      await emitVerificationRealtime(updatedVerification.status, {
        fieldOfficerId: updatedVerification.fieldOfficerId,
        fieldOfficerName: updatedVerification.fieldOfficerName,
        fieldVisitCity: updatedVerification.fieldVisitCity,
        fieldVisitScheduledAt: updatedVerification.fieldVisitScheduledAt,
      });

      return NextResponse.json({ message: "Field visit scheduled", verification: updatedVerification });
    }

    if (action === ACTIONS.SUBMIT_FIELD_REPORT) {
      if (verification.status !== "FIELD_VISIT_SCHEDULED") {
        return NextResponse.json({ error: "Field visit must be scheduled first" }, { status: 400 });
      }

      const assignedToActor = verification.fieldOfficerId === actor.id;
      const sameCityAsAssignment =
        !!actor.city && !!verification.fieldVisitCity && actor.city.toLowerCase() === verification.fieldVisitCity.toLowerCase();

      if (!assignedToActor && !sameCityAsAssignment) {
        return NextResponse.json(
          { error: "Only the assigned or same-city field officer can submit this report" },
          { status: 403 }
        );
      }

      const officeExists = typeof body?.officeExists === "boolean" ? body.officeExists : null;
      const keyPersonConfirmed = typeof body?.keyPersonConfirmed === "boolean" ? body.keyPersonConfirmed : null;

      if (officeExists === null || keyPersonConfirmed === null) {
        return NextResponse.json(
          { error: "officeExists and keyPersonConfirmed are required booleans" },
          { status: 400 }
        );
      }

      const checklist = typeof body?.fieldChecklist === "object" && body?.fieldChecklist !== null ? body.fieldChecklist : null;
      const evidencePhotoUrls = Array.isArray(body?.fieldEvidencePhotoUrls)
        ? body.fieldEvidencePhotoUrls.filter((v: unknown) => typeof v === "string")
        : null;

      const updatedVerification = await prisma.ngoVerification.update({
        where: { ngoId },
        data: {
          status: "FIELD_VERIFIED",
          officeExists,
          keyPersonConfirmed,
          fieldChecklist: checklist,
          fieldEvidencePhotoUrls: evidencePhotoUrls,
          fieldNotes: typeof body?.fieldNotes === "string" ? body.fieldNotes : null,
          fieldCheckInAt: toDateOrNull(body?.fieldCheckInAt) || verification.fieldCheckInAt || new Date(),
          fieldCheckOutAt: toDateOrNull(body?.fieldCheckOutAt) || new Date(),
          fieldCheckInLatitude: toNumberOrNull(body?.fieldCheckInLatitude),
          fieldCheckInLongitude: toNumberOrNull(body?.fieldCheckInLongitude),
          fieldCheckOutLatitude: toNumberOrNull(body?.fieldCheckOutLatitude),
          fieldCheckOutLongitude: toNumberOrNull(body?.fieldCheckOutLongitude),
          fieldVerifiedAt: new Date(),
          fieldVerifiedById: actor.id,
        },
      });

      await createNotification({
        userId: ngoId,
        type: "SYSTEM",
        title: "Field Verification Completed",
        message: "On-ground verification has been completed. Final admin review is pending.",
        link: "/ngo/dashboard",
      });

      if (adminIds.length > 0) {
        await createNotification({
          userIds: adminIds,
          type: "SYSTEM",
          title: "Ground Report Submitted",
          message: `${ngo.name} field verification report was submitted by ${actor.name}. Final approval is pending.`,
          link: `/admin/verification/${ngoId}`,
        });
      }

      await createAuditLog({
        adminId: actor.id,
        action: "NGO_FIELD_VERIFIED",
        details: `Field report submitted for NGO ${ngo.email} by ${actor.email}`,
      });

      await emitVerificationRealtime(updatedVerification.status, {
        fieldVerifiedAt: updatedVerification.fieldVerifiedAt,
        fieldVerifiedById: updatedVerification.fieldVerifiedById,
      });

      return NextResponse.json({ message: "Field report submitted", verification: updatedVerification });
    }

    if (action === ACTIONS.FINAL_APPROVE) {
      if (verification.status !== "FIELD_VERIFIED") {
        return NextResponse.json(
          { error: "Final approval is only allowed after field verification" },
          { status: 400 }
        );
      }

      const requestedMonths = Number(body?.reverifyInMonths ?? 6);
      const reverifyInMonths = Math.min(12, Math.max(6, Number.isFinite(requestedMonths) ? requestedMonths : 6));
      const nextReverificationAt = computeNextReverificationDate(reverifyInMonths);

      const [updatedVerification] = await prisma.$transaction([
        prisma.ngoVerification.update({
          where: { ngoId },
          data: {
            status: "FULLY_VERIFIED",
            finalReviewNote: typeof body?.finalReviewNote === "string" ? body.finalReviewNote : null,
            finalReviewedAt: new Date(),
            finalReviewedById: actor.id,
            lastVerifiedAt: new Date(),
            nextReverificationAt,
            rejectionReason: null,
            rejectedAt: null,
            rejectedById: null,
          },
        }),
        prisma.user.update({
          where: { id: ngoId },
          data: { isVerified: true },
        }),
      ]);

      await createNotification({
        userId: ngoId,
        type: "SYSTEM",
        title: "NGO Fully Verified",
        message: "Congratulations. Your NGO has passed online and on-ground verification and is now fully verified.",
        link: "/ngo/dashboard",
      });

      await createAuditLog({
        adminId: actor.id,
        action: "NGO_FULLY_VERIFIED",
        details: `Final approval completed for NGO ${ngo.email} by ${actor.email}`,
      });

      await emitVerificationRealtime(updatedVerification.status, {
        lastVerifiedAt: updatedVerification.lastVerifiedAt,
        nextReverificationAt: updatedVerification.nextReverificationAt,
      });

      return NextResponse.json({ message: "NGO fully verified", verification: updatedVerification });
    }

    if (action === ACTIONS.REJECT) {
      const rejectionReason =
        typeof body?.rejectionReason === "string" && body.rejectionReason.trim().length > 0
          ? body.rejectionReason.trim()
          : "Verification rejected. Please update documents/details and request review again.";

      const [updatedVerification] = await prisma.$transaction([
        prisma.ngoVerification.update({
          where: { ngoId },
          data: {
            status: "REJECTED",
            rejectionReason,
            rejectedAt: new Date(),
            rejectedById: actor.id,
          },
        }),
        prisma.user.update({
          where: { id: ngoId },
          data: { isVerified: false },
        }),
      ]);

      await createNotification({
        userId: ngoId,
        type: "SYSTEM",
        title: body?.needsRecheck ? "Verification Needs Recheck" : "Verification Rejected",
        message: rejectionReason,
        link: "/ngo/dashboard",
      });

      await createAuditLog({
        adminId: actor.id,
        action: body?.needsRecheck ? "NGO_NEEDS_RECHECK" : "NGO_REJECTED",
        details: `Verification rejected for NGO ${ngo.email}. Reason: ${rejectionReason}`,
      });

      await emitVerificationRealtime(updatedVerification.status, {
        rejectionReason: updatedVerification.rejectionReason,
      });

      return NextResponse.json({ message: "Verification status updated", verification: updatedVerification });
    }

    return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
  } catch (error) {
    console.error("NGO verification update error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export const GET = withSecurity(getNgoVerificationHandler);
export const PATCH = withSecurity(patchNgoVerificationHandler);
