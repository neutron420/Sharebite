import { NotificationType } from "@/app/generated/prisma";
import prisma from "./prisma";

export async function createNotification({
  userId,
  userIds,
  type,
  title,
  message,
  link
}: {
  userId?: string;
  userIds?: string[];
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}) {
  try {
    const recipients = userIds || (userId ? [userId] : []);
    if (recipients.length === 0) return;

    if (recipients.length === 1) {
      const notification = await prisma.notification.create({
        data: {
          userId: recipients[0],
          type,
          title,
          message,
          link,
        }
      });
      
      await relayNotification({ userId: recipients[0], payload: notification, type: 'NOTIFICATION' });
      return notification;
    } else {
      const data = recipients.map(id => ({ userId: id, type, title, message, link }));
      await prisma.notification.createMany({ data });
      
      await relayNotification({ 
        userIds: recipients, 
        payload: { type, title, message, link, createdAt: new Date(), isRead: false }, 
        type: 'NOTIFICATION' 
      });
    }
  } catch (error) {
    console.error("Failed to create notification:", error);
  }
}

async function relayNotification(body: any) {
  if (typeof window === 'undefined') {
    const internalWsUrl = process.env.INTERNAL_WS_URL || 'http://localhost:8081';
    return fetch(`${internalWsUrl}/notify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }).catch(err => console.error("WS Relay failed:", err.message));
  }
}
