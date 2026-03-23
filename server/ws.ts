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

const wss = new WebSocketServer({ port: 8080 });

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is not set");
}

const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);

// Map to track active connections per user on THIS instance
const localClients = new Map<string, WebSocket>();

console.log("WebSocket server starting on ws://localhost:8080");

// Subscribe to Redis notifications for cross-instance delivery
sub.subscribe("notifications", (err) => {
  if (err) console.error("Redis Subscribe Error:", err);
  else console.log("Subscribed to 'notifications' channel for horizontal scaling");
});

sub.on("message", (channel, message) => {
  if (channel === "notifications") {
    try {
      const { type, userId, userIds, payload, riderId, lat, lng } = JSON.parse(message);
      
      if (type === "RIDER_LOCATION_UPDATE" && userIds) {
        userIds.forEach((id: string) => {
          const ws = localClients.get(id);
          if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "RIDER_LOCATION", payload: { riderId, lat, lng } }));
          }
        });
      } else if (userId) {
        const ws = localClients.get(userId);
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "NOTIFICATION", payload }));
        }
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
    
    localClients.set(userId, ws);
    console.log(`User ${userId} connected to this instance`);

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

          // Publish to Redis so ANY instance can deliver it to the receiver
          pub.publish("notifications", JSON.stringify({
            userId: receiverId,
            payload: savedMsg,
            type: "NEW_MESSAGE"
          }));
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

// Internal HTTP server for Next.js to trigger notifications through Redis
const httpServer = createServer(async (req, res) => {
  if (req.method === 'POST' && req.url === '/notify') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const data = JSON.parse(body);
        // Publish trigger to all instances via Redis
        await pub.publish("notifications", body);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, broadcasted: true }));
      } catch (err) {
        res.writeHead(400);
        res.end();
      }
    });
  } else {
    res.writeHead(404);
    res.end();
  }
});

httpServer.listen(8081, () => {
  console.log("Internal Trigger Server (Scalable) running on http://localhost:8081");
});

