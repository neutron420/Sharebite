import { NotificationType } from "@/app/generated/prisma";
import prisma from "./prisma";

export async function createNotification({
  userId,
  type,
  title,
  message,
  link
}: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        link,
      }
    });

    // Trigger real-time delivery via internal WS server (Fire and forget for speed)
    if (typeof window === 'undefined') { // Only on server
      const internalWsUrl = process.env.INTERNAL_WS_URL || 'http://localhost:8081';
      fetch(`${internalWsUrl}/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, notification })
      }).catch(err => console.error("WS Relay failed:", err.message));
    }

    return notification;
  } catch (error) {
    console.error("Failed to create notification:", error);
  }
}
