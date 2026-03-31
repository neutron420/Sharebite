import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withSecurity } from "@/lib/api-handler";

async function getAdminPaymentsHandler() {
  try {
    const payments = await prisma.payment.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        user: {
          select: { id: true, name: true, email: true, city: true },
        },
        requests: {
          include: {
            rider: { select: { id: true, name: true, email: true, city: true } },
            ngo: { select: { id: true, name: true, email: true, city: true } },
            donation: {
              select: { id: true, title: true, category: true, city: true },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    return NextResponse.json(payments);
  } catch (error) {
    console.error("Admin payments fetch error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export const GET = withSecurity(getAdminPaymentsHandler);
