import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";
import { relayRealtimeEvent } from "@/lib/notifications";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { isVerified, role } = body;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    if (user.role === "NGO" && isVerified !== undefined) {
      const verification = await prisma.ngoVerification.upsert({
        where: { ngoId: id },
        update: {},
        create: {
          ngoId: id,
          registrationCertUrl: user.verificationDoc || undefined,
        },
      });

      if (isVerified === true && verification.status !== "FIELD_VERIFIED" && verification.status !== "FULLY_VERIFIED") {
        return NextResponse.json(
          {
            error:
              "NGO can only be fully verified after online and field verification are complete.",
          },
          { status: 400 }
        );
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { 
        ...(isVerified !== undefined && { isVerified }),
        ...(role !== undefined && { role })
      },
    });

    // Audit Log
    if (isVerified !== undefined) {
      await createAuditLog({
        adminId: session.userId as string,
        action: "VERIFY_NGO",
        details: `Set verification for ${user.email} to ${isVerified}`,
      });

      if (user.role === "NGO") {
        if (isVerified === true) {
          const nextReverificationAt = new Date();
          nextReverificationAt.setMonth(nextReverificationAt.getMonth() + 6);

          await prisma.ngoVerification.update({
            where: { ngoId: id },
            data: {
              status: "FULLY_VERIFIED",
              finalReviewedAt: new Date(),
              finalReviewedById: session.userId as string,
              lastVerifiedAt: new Date(),
              nextReverificationAt,
            },
          });
        } else {
          await prisma.ngoVerification.update({
            where: { ngoId: id },
            data: {
              status: "REJECTED",
              rejectedAt: new Date(),
              rejectedById: session.userId as string,
              rejectionReason: "Verification revoked by admin.",
            },
          });
        }

        const adminUsers = await prisma.user.findMany({
          where: { role: "ADMIN" },
          select: { id: true },
          take: 100,
        });

        await relayRealtimeEvent({
          userIds: adminUsers.map((admin) => admin.id),
          type: "NGO_VERIFICATION_UPDATED",
          payload: {
            ngoId: id,
            status: isVerified ? "FULLY_VERIFIED" : "REJECTED",
            action: isVerified ? "LEGACY_PATCH_FINAL_APPROVE" : "LEGACY_PATCH_REVOKE",
            byUserId: session.userId as string,
            updatedAt: new Date().toISOString(),
          },
        });
      }
    }

    return NextResponse.json(updatedUser);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const user = await prisma.user.findUnique({ where: { id } });
    
    if (user) {
      await prisma.user.delete({ where: { id } });
      
      await createAuditLog({
        adminId: session.userId as string,
        action: "DELETE_USER",
        details: `Deleted user: ${user.email} (${user.role})`,
      });
    }

    return NextResponse.json({ message: "User deleted" });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
