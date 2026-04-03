import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { withSecurity } from "@/lib/api-handler";

async function getNgoRiderVerificationsHandler(request: Request) {
  try {
    const session = await getSession({ preferredRole: "NGO", request });

    if (!session || session.role !== "NGO") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ngoId = session.userId as string;

    const applications = await prisma.riderVerificationRequest.findMany({
      where: { ngoId },
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
      },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    });

    const stats = {
      total: applications.length,
      pendingNgoReview: applications.filter((item) => item.status === "PENDING_NGO_REVIEW").length,
      approvedByNgo: applications.filter((item) => item.status === "NGO_APPROVED").length,
      ngoRejected: applications.filter((item) => item.status === "NGO_REJECTED").length,
      finalApproved: applications.filter((item) => item.status === "ADMIN_APPROVED").length,
      finalRejected: applications.filter((item) => item.status === "ADMIN_REJECTED").length,
    };

    return NextResponse.json({ applications, stats });
  } catch (error) {
    console.error("NGO rider verification list error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export const GET = withSecurity(getNgoRiderVerificationsHandler);
