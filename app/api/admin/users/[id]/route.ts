import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";

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
