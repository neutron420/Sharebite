import { WebSocketServer, WebSocket } from "ws";
import { parse } from "url";
import { jwtVerify } from "jose";
import { PrismaClient } from "../app/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { createServer } from "http";
import Redis from "ioredis";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
const pub = new Redis(redisUrl);
const sub = new Redis(redisUrl);

pub.on("error", (err) => {
  console.log("Redis Pub Error:", err.message || "Redis server is not reachable");
});

sub.on("error", (err) => {
  console.log("Redis Sub Error:", err.message || "Redis server is not reachable");
});

const PORT = 8080;
const server = createServer();
const wss = new WebSocketServer({ noServer: true });
server.on("request", async (req, res) => {
  const { pathname } = parse(req.url || "", true);

  if (pathname === "/") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "healthy", service: "ShareBite WebSocket Guard" }));
    return;
  }

  if (req.method === "POST" && pathname === "/notify") {
    let body = "";
    req.on("data", (chunk) => { body += chunk; });
    req.on("end", async () => {
      try {
        await pub.publish("notifications", body);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true, broadcasted: true }));
      } catch (err) {
        res.writeHead(400);
        res.end();
      }
    });
    return;
  }

  res.writeHead(404);
  res.end();
});

// Handle WebSocket Upgrades
server.on("upgrade", (request, socket, head) => {
  const { pathname } = parse(request.url || "", true);
  
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit("connection", ws, request);
  });
});

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is not set");
}

const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);

// Map to track active connections per user on THIS instance, including their role
const localClients = new Map<string, { ws: WebSocket; role: string }>();

console.log("WebSocket server starting on ws://localhost:8080");

// Subscribe to Redis notifications for cross-instance delivery
sub.subscribe("notifications", (err) => {
  if (err) console.error("Redis Subscribe Error:", err);
  else console.log("Subscribed to 'notifications' channel for horizontal scaling");
});

sub.on("message", (channel, message) => {
  if (channel === "notifications") {
    try {
      const { type, userId, userIds, targetRole, payload, riderId, lat, lng } = JSON.parse(message);
      
      // COMMUNITY_POST: Global broadcast to ALL connected clients for real-time feed
      if (type === "COMMUNITY_POST") {
        localClients.forEach((client) => {
          if (client.ws.readyState === WebSocket.OPEN) {
            client.ws.send(JSON.stringify({ type: "COMMUNITY_POST", payload }));
          }
        });
      } else if (type === "RIDER_LOCATION_UPDATE" && userIds) {
        userIds.forEach((id: string) => {
          const client = localClients.get(id);
          if (client && client.ws.readyState === WebSocket.OPEN) {
            client.ws.send(JSON.stringify({ type: "RIDER_LOCATION", payload: { riderId, lat, lng } }));
          }
        });
      } else if (targetRole) {
        // Broadcast to ALL users with a specific role on this instance
        localClients.forEach((client) => {
          if (client.role === targetRole && client.ws.readyState === WebSocket.OPEN) {
            client.ws.send(JSON.stringify({ type, payload }));
          }
        });
      } else if (userId) {
        const client = localClients.get(userId);
        if (client && client.ws.readyState === WebSocket.OPEN) {
          client.ws.send(JSON.stringify({ type: "NOTIFICATION", payload }));
        }
      } else if (userIds && Array.isArray(userIds)) {
        userIds.forEach((id: string) => {
          const client = localClients.get(id);
          if (client && client.ws.readyState === WebSocket.OPEN) {
            client.ws.send(JSON.stringify({ type: "NOTIFICATION", payload }));
          }
        });
      }
    } catch (err) {
      console.error("Redis Message Error:", err);
    }
  }
});

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
    const role = (payload.role as string) || "GUEST";
    
    localClients.set(userId, { ws, role });
    console.log(`User ${userId} [${role}] connected to this instance`);

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
              isRead: false,
            },
            include: {
              sender: {
                select: { id: true, name: true, imageUrl: true }
              }
            }
          });

          // Update conversation last updated field
          await prisma.conversation.update({
            where: { id: conversationId },
            data: { updatedAt: new Date() }
          });

          // Publish to Redis so ANY instance can deliver it to the receiver
          pub.publish("notifications", JSON.stringify({
            userId: receiverId,
            payload: savedMsg,
            type: "NEW_MESSAGE"
          }));
        } else if (type === "TYPING_STATUS") {
          const { receiverId, conversationId, isTyping } = msgPayload;
          
          pub.publish("notifications", JSON.stringify({
            userId: receiverId,
            type: "TYPING_INDICATOR",
            payload: {
              conversationId,
              isTyping,
              userId: userId
            }
          }));
        } else if (type === "HEARTBEAT") {
          ws.send(JSON.stringify({ type: "HEARTBEAT_ACK" }));
        }
      } catch (err) {
        console.error("Message processing error:", err);
      }
    });

    ws.on("close", () => {
      localClients.delete(userId);
      console.log(`User ${userId} disconnected from this instance`);
    });

  } catch {
    ws.close(1008, "Invalid token");
  }
});

server.listen(PORT, () => {
  console.log(`🚀 ShareBite Unified Hub running on port ${PORT}`);
  console.log(`- WebSocket: wss://ws.youdomain.com (via ALB)`);
  console.log(`- Health/Notify: http://localhost:${PORT}`);
});
