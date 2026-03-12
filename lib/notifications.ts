import prisma from "./prisma";

export async function createNotification({
  userId,
  type,
  title,
  message,
  link
}: {
  userId: string;
  type: "REQUEST_STATUS" | "NEW_DONATION" | "URGENT_EXPIRY" | "SYSTEM";
  title: string;
  message: string;
  link?: string;
}) {
  try {
    return await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        link,
      }
    });
  } catch (error) {
    console.error("Failed to create notification:", error);
  }
}
