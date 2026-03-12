import prisma from "./prisma";

export async function createAuditLog({
  adminId,
  action,
  details,
  ipAddress
}: {
  adminId: string;
  action: string;
  details?: string;
  ipAddress?: string;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        adminId,
        action,
        details,
        ipAddress
      }
    });
  } catch (error) {
    console.error("Failed to create audit log:", error);
  }
}
