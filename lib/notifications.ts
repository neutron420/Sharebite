import { NotificationType } from "@/app/generated/prisma";
import prisma from "./prisma";

type RelayBody = {
  userId?: string;
  userIds?: string[];
  targetRole?: string;
  type: string;
  payload: unknown;
};

function getInternalNotifyUrl() {
  const raw = (process.env.INTERNAL_WS_URL || "http://localhost:8080")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .trim()
    .replace(/\/+$/, "");

  return `${raw.replace(":8081", ":8080")}/notify`;
}

async function postWithTimeout(url: string, body: RelayBody, timeoutMs = 1200) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

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
      
      void relayNotification({ userId: recipients[0], payload: notification, type: "NOTIFICATION" });
      return notification;
    } else {
      const data = recipients.map(id => ({ userId: id, type, title, message, link }));
      await prisma.notification.createMany({ data });
      
      void relayNotification({ 
        userIds: recipients, 
        payload: { type, title, message, link, createdAt: new Date(), isRead: false }, 
        type: "NOTIFICATION" 
      });
    }
  } catch (error) {
    console.error("Failed to create notification:", error);
  }
}

async function relayNotification(body: RelayBody) {
  if (typeof window === 'undefined') {
    const notifyUrl = getInternalNotifyUrl();
    return postWithTimeout(notifyUrl, body).catch((err: unknown) => {
      const message = err instanceof Error ? err.message : "Unknown relay error";
      console.error("WS Relay failed:", message);
    });
  }
}

export async function relayRealtimeEvent(body: RelayBody) {
  if (typeof window !== "undefined") return;

  const notifyUrl = getInternalNotifyUrl();
  return postWithTimeout(notifyUrl, body).catch((err: unknown) => {
    const message = err instanceof Error ? err.message : "Unknown realtime relay error";
    console.error("Realtime WS relay failed:", message);
  });
}
