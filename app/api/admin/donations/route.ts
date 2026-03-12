import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const donations = await prisma.foodDonation.findMany({
      include: {
        donor: { select: { name: true, email: true } },
        _count: { select: { requests: true } }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(donations);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
    try {
      const session = await getSession();
      if (!session || session.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
  
      const { searchParams } = new URL(request.url);
      const id = searchParams.get("id");
  
      if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
  
      const donation = await prisma.foodDonation.findUnique({ where: { id } });
      if (donation) {
        await prisma.foodDonation.delete({ where: { id } });
        
        await createAuditLog({
          adminId: session.userId as string,
          action: "DELETE_DONATION",
          details: `Deleted donation: ${donation.title} (ID: ${id})`,
        });
      }
  
      return NextResponse.json({ message: "Donation deleted by admin" });
    } catch (error) {
      return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
  }
