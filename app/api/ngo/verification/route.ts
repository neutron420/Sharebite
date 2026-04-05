import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withSecurity } from "@/lib/api-handler";
import { getSession } from "@/lib/auth";
import { createNotification, relayRealtimeEvent } from "@/lib/notifications";

function mapVerificationResponse(
  user: {
    id: string;
    isVerified: boolean;
    verificationDoc: string | null;
    ngoVerification: {
      status: string;
      registrationCertUrl: string | null;
      panTanUrl: string | null;
      bankProofUrl: string | null;
      addressProofUrl: string | null;
      contactPersonIdUrl: string | null;
      onlineVerifiedAt: Date | null;
      fieldVerifiedAt: Date | null;
      lastVerifiedAt: Date | null;
      nextReverificationAt: Date | null;
      rejectionReason: string | null;
    } | null;
  }
) {
  const verification = user.ngoVerification;
  const status = verification?.status || (user.isVerified ? "FULLY_VERIFIED" : "PENDING");

  return {
    ngoId: user.id,
    status,
    isVerified: user.isVerified,
    onlineVerified: ["ONLINE_VERIFIED", "FIELD_VISIT_SCHEDULED", "FIELD_VERIFIED", "FULLY_VERIFIED"].includes(status),
    groundVerified: ["FIELD_VERIFIED", "FULLY_VERIFIED"].includes(status),
    registrationCertUrl: verification?.registrationCertUrl || user.verificationDoc,
    panTanUrl: verification?.panTanUrl || null,
    bankProofUrl: verification?.bankProofUrl || null,
    addressProofUrl: verification?.addressProofUrl || null,
    contactPersonIdUrl: verification?.contactPersonIdUrl || null,
    onlineVerifiedAt: verification?.onlineVerifiedAt || null,
    fieldVerifiedAt: verification?.fieldVerifiedAt || null,
    lastVerifiedAt: verification?.lastVerifiedAt || null,
    nextReverificationAt: verification?.nextReverificationAt || null,
    rejectionReason: verification?.rejectionReason || null,
  };
}

async function getNgoVerificationHandler(request: Request) {
  try {
    const session = await getSession({ preferredRole: "NGO", request });
    if (!session || session.role !== "NGO") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId as string },
      select: {
        id: true,
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
            onlineVerifiedAt: true,
            fieldVerifiedAt: true,
            lastVerifiedAt: true,
            nextReverificationAt: true,
            rejectionReason: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "NGO not found" }, { status: 404 });
    }

    if (!user.ngoVerification) {
      await prisma.ngoVerification.create({
        data: {
          ngoId: user.id,
          registrationCertUrl: user.verificationDoc || undefined,
        },
      });

      const refreshed = await prisma.user.findUnique({
        where: { id: user.id },
        select: {
          id: true,
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
              onlineVerifiedAt: true,
              fieldVerifiedAt: true,
              lastVerifiedAt: true,
              nextReverificationAt: true,
              rejectionReason: true,
            },
          },
        },
      });

      return NextResponse.json(mapVerificationResponse(refreshed as NonNullable<typeof refreshed>));
    }

    return NextResponse.json(mapVerificationResponse(user));
  } catch (error) {
    console.error("NGO verification fetch error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

async function patchNgoVerificationHandler(request: Request) {
  try {
    const session = await getSession({ preferredRole: "NGO", request });
    if (!session || session.role !== "NGO") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const registrationCertUrl = typeof body?.registrationCertUrl === "string" ? body.registrationCertUrl : undefined;
    const panTanUrl = typeof body?.panTanUrl === "string" ? body.panTanUrl : undefined;
    const bankProofUrl = typeof body?.bankProofUrl === "string" ? body.bankProofUrl : undefined;
    const addressProofUrl = typeof body?.addressProofUrl === "string" ? body.addressProofUrl : undefined;
    const contactPersonIdUrl = typeof body?.contactPersonIdUrl === "string" ? body.contactPersonIdUrl : undefined;

    const current = await prisma.ngoVerification.findUnique({
      where: { ngoId: session.userId as string },
      select: { status: true },
    });

    const updateData: Record<string, unknown> = {
      ...(registrationCertUrl !== undefined ? { registrationCertUrl } : {}),
      ...(panTanUrl !== undefined ? { panTanUrl } : {}),
      ...(bankProofUrl !== undefined ? { bankProofUrl } : {}),
      ...(addressProofUrl !== undefined ? { addressProofUrl } : {}),
      ...(contactPersonIdUrl !== undefined ? { contactPersonIdUrl } : {}),
    };

    if (current?.status === "REJECTED") {
      updateData.status = "PENDING";
      updateData.rejectionReason = null;
      updateData.rejectedAt = null;
      updateData.rejectedById = null;
    }

    const verification = await prisma.ngoVerification.upsert({
      where: { ngoId: session.userId as string },
      update: updateData,
      create: {
        ngoId: session.userId as string,
        registrationCertUrl,
        panTanUrl,
        bankProofUrl,
        addressProofUrl,
        contactPersonIdUrl,
      },
    });

    if (registrationCertUrl !== undefined) {
      await prisma.user.update({
        where: { id: session.userId as string },
        data: { verificationDoc: registrationCertUrl },
      });
    }

    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true },
      take: 50,
    });

    await createNotification({
      userIds: admins.map((admin) => admin.id),
      type: "SYSTEM",
      title: "NGO Verification Documents Updated",
      message: "An NGO has submitted or updated verification documents for review.",
      link: "/admin/verification",
    });

    const realtimePayload = {
      ngoId: session.userId as string,
      status: verification.status,
      action: "NGO_DOCS_UPDATED",
      updatedAt: new Date().toISOString(),
    };

    await Promise.all([
      relayRealtimeEvent({
        userIds: admins.map((admin) => admin.id),
        type: "NGO_VERIFICATION_UPDATED",
        payload: realtimePayload,
      }),
      relayRealtimeEvent({
        userId: session.userId as string,
        type: "NGO_VERIFICATION_UPDATED",
        payload: realtimePayload,
      }),
    ]);

    return NextResponse.json({
      message: "Verification documents updated",
      verification,
    });
  } catch (error) {
    console.error("NGO verification update error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export const GET = withSecurity(getNgoVerificationHandler);
export const PATCH = withSecurity(patchNgoVerificationHandler);
