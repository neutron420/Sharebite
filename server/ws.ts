import { WebSocketServer, WebSocket } from "ws";
import { parse } from "url";
import { jwtVerify } from "jose";
import { PrismaClient } from "../app/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });
const wss = new WebSocketServer({ port: 8080 });

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is not set");
}

const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);

// Map to track active connections per user
const clients = new Map<string, WebSocket>();

console.log("WebSocket server starting on ws://localhost:8080");

wss.on("connection", async (ws, req) => {
  const { query } = parse(req.url || "", true);
  const token = query.token as string;

  if (!token) {
    ws.close(1008, "Token missing");
    return;
  }

  try {
    const { payload } = await jwtVerify(token, secretKey);
    const userId = payload.userId as string;
    
    clients.set(userId, ws);
    console.log(`User ${userId} connected`);

    ws.on("message", async (data) => {
      try {
        const message = JSON.parse(data.toString());
        const { type, payload: msgPayload } = message;

        if (type === "SEND_MESSAGE") {
          const { conversationId, text, receiverId, imageUrl, location } = msgPayload;

          const savedMsg = await prisma.message.create({
            data: {
              conversationId,
              senderId: userId,
              text,
              imageUrl,
              locationLat: location?.lat,
              locationLng: location?.lng,
            },
          });

          // Forward to receiver if online
          const receiverWs = clients.get(receiverId);
          if (receiverWs && receiverWs.readyState === WebSocket.OPEN) {
            receiverWs.send(JSON.stringify({
              type: "NEW_MESSAGE",
              payload: savedMsg
            }));
          }
        }
      } catch (err) {
        console.error("Message processing error:", err);
      }
    });

    ws.on("close", () => {
      clients.delete(userId);
      console.log(`User ${userId} disconnected`);
    });

  } catch {
    ws.close(1008, "Invalid token");
  }
});

export async function sendNotification(userId: string, notification: Record<string, unknown>) {
  const ws = clients.get(userId);
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: "NOTIFICATION",
      payload: notification
    }));
  }
}
