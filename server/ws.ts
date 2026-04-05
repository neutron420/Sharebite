import { WebSocketServer, WebSocket } from "ws";
import { parse } from "url";
import { jwtVerify } from "jose";
import { PrismaClient } from "../app/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { createServer } from "http";
import Redis from "ioredis";
import { Counter, Gauge, Registry, collectDefaultMetrics } from "prom-client";
import "dotenv/config";

const wsMetricsRegistry = new Registry();
collectDefaultMetrics({ register: wsMetricsRegistry, prefix: "sharebite_ws_" });

const wsConnectionsActive = new Gauge({
  name: "sharebite_ws_connections_active",
  help: "Current number of active websocket connections.",
  registers: [wsMetricsRegistry],
});

const wsMessagesTotal = new Counter({
  name: "sharebite_ws_messages_total",
  help: "Total websocket messages by direction and type.",
  labelNames: ["direction", "type"],
  registers: [wsMetricsRegistry],
});

const wsErrorsTotal = new Counter({
  name: "sharebite_ws_errors_total",
  help: "Total websocket server errors by stage.",
  labelNames: ["stage"],
  registers: [wsMetricsRegistry],
});

const wsNotifyRequestsTotal = new Counter({
  name: "sharebite_ws_notify_requests_total",
  help: "Total HTTP /notify requests accepted by websocket server.",
  registers: [wsMetricsRegistry],
});

const wsRedisAvailable = new Gauge({
  name: "sharebite_ws_redis_available",
  help: "Redis availability status for websocket fanout (1=up, 0=down).",
  registers: [wsMetricsRegistry],
});

function sendWsMessage(ws: WebSocket, type: string, payload: any) {
  ws.send(JSON.stringify({ type, payload }));
  wsMessagesTotal.inc({ direction: "out", type });
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

// Track Redis availability
let redisAvailable = false;
let lastRedisLog = 0;
wsRedisAvailable.set(0);

function logRedis(msg: string) {
  const now = Date.now();
  if (now - lastRedisLog > 10000) {
    console.log(msg);
    lastRedisLog = now;
  }
}

// Create Redis clients with safe options
const redisOptions: any = {
  maxRetriesPerRequest: 1,
  connectTimeout: 5000,
  retryStrategy: (times: number) => {
    if (times > 3) {
      logRedis("⚠️  Redis unavailable — falling back to local-only delivery");
      return null; 
    }
    return Math.min(times * 1000, 5000);
  },
  lazyConnect: true,
  enableOfflineQueue: false,
};

let pub: Redis | null = null;
let sub: Redis | null = null;

async function initRedis() {
  try {
    pub = new Redis(redisUrl, redisOptions);
    sub = new Redis(redisUrl, redisOptions);

    pub.on("error", (err) => logRedis(`Redis Pub Error: ${err.message}`));
    sub.on("error", (err) => logRedis(`Redis Sub Error: ${err.message}`));

    pub.on("ready", () => {
      redisAvailable = true;
      wsRedisAvailable.set(1);
      console.log("✅ Redis connected");
    });
    
    pub.on("close", () => {
      redisAvailable = false;
      wsRedisAvailable.set(0);
    });

    sub.on("ready", () => {
      sub!.subscribe("notifications", (err) => {
        if (err) console.error("Redis Subscribe Error:", err.message);
        else console.log("📡 Subscribed to global notifications channel");
      });
    });

    sub.on("message", handleBroadcast);

    await Promise.all([
      pub.connect().catch(() => {}),
      sub.connect().catch(() => {}),
    ]);
  } catch (err) {
    logRedis("⚠️  Redis failed — using local-only mode");
  }
}

function deliverToUser(userId: string, type: string, payload: any) {
  const client = localClients.get(userId);
  if (client && client.ws.readyState === WebSocket.OPEN) {
    sendWsMessage(client.ws, type, payload);
  }
}

function handleBroadcast(channel: string, message: string) {
  if (channel !== "notifications") return;
  try {
    const { type, userId, userIds, targetRole, payload, riderId, lat, lng } = JSON.parse(message);

    if (type === "COMMUNITY_POST") {
      localClients.forEach(c => {
        if (c.ws.readyState === WebSocket.OPEN) sendWsMessage(c.ws, type, payload);
      });
    } else if (type === "RIDER_LOCATION_UPDATE" && userIds) {
      userIds.forEach((id: string) => deliverToUser(id, "RIDER_LOCATION", { riderId, lat, lng }));
    } else if (type === "NEW_MESSAGE" && userId) {
      deliverToUser(userId, "NEW_MESSAGE", payload);
    } else if (targetRole) {
      localClients.forEach(c => {
        if (c.role === targetRole && c.ws.readyState === WebSocket.OPEN) {
          sendWsMessage(c.ws, type || "NOTIFICATION", payload);
        }
      });
    } else if (userId) {
      deliverToUser(userId, type || "NOTIFICATION", payload);
    } else if (userIds && Array.isArray(userIds)) {
      userIds.forEach((id: string) => deliverToUser(id, type || "NOTIFICATION", payload));
    }
  } catch (err) {
    wsErrorsTotal.inc({ stage: "broadcast" });
    console.error("Message processing error:", err);
  }
}

function gracefulShutdown() {
  console.log("Shutting down... closing connections");
  if (pub) pub.disconnect();
  if (sub) sub.disconnect();
  prisma.$disconnect();
  process.exit(0);
}
process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);

const PORT = 8080;
const server = createServer();
const wss = new WebSocketServer({ noServer: true });

server.on("request", async (req, res) => {
  const { pathname } = parse(req.url || "", true);
  if (pathname === "/metrics") {
    res.writeHead(200, { "Content-Type": wsMetricsRegistry.contentType });
    res.end(await wsMetricsRegistry.metrics());
    return;
  }

  if (pathname === "/") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "healthy", connected: localClients.size, redis: redisAvailable }));
    return;
  }
  if (req.method === "POST" && pathname === "/notify") {
    wsNotifyRequestsTotal.inc();
    let body = "";
    req.on("data", c => body += c);
    req.on("end", async () => {
      try {
        if (redisAvailable) await pub!.publish("notifications", body);
        else handleBroadcast("notifications", body);
        res.writeHead(200); res.end(JSON.stringify({ success: true }));
      } catch (err) {
        wsErrorsTotal.inc({ stage: "notify_route" });
        res.writeHead(500); res.end();
      }
    });
    return;
  }
  res.writeHead(404); res.end();
});

server.on("upgrade", (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit("connection", ws, request);
  });
});

if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET missing");
const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);
const localClients = new Map<string, { ws: WebSocket; role: string }>();

wss.on("connection", async (ws, req) => {
  const { query } = parse(req.url || "", true);
  const token = query.token as string;
  if (!token) { ws.close(1008, "Token missing"); return; }

  try {
    const { payload } = await jwtVerify(token, secretKey);
    const userId = payload.userId as string;
    const role = (payload.role as string) || "GUEST";
    localClients.set(userId, { ws, role });
    wsConnectionsActive.inc();

    ws.on("message", async (data) => {
      try {
        const message = JSON.parse(data.toString());
        const { type, payload: msgPayload } = message;
        wsMessagesTotal.inc({ direction: "in", type: type || "UNKNOWN" });

        if (type === "SEND_MESSAGE") {
          const { conversationId, text, receiverId, imageUrl, location } = msgPayload;
          const savedMsg = await prisma.message.create({
            data: { conversationId, senderId: userId, text, imageUrl, locationLat: location?.lat, locationLng: location?.lng, isRead: false },
            include: { sender: { select: { id: true, name: true, imageUrl: true } } }
          });
          await prisma.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } });

          const redisMsg = JSON.stringify({ userId: receiverId, payload: savedMsg, type: "NEW_MESSAGE" });
          const redisMsgSender = JSON.stringify({ userId, payload: savedMsg, type: "NEW_MESSAGE" });

          if (redisAvailable) {
            pub!.publish("notifications", redisMsg).catch(() => {});
            pub!.publish("notifications", redisMsgSender).catch(() => {});
          } else {
            deliverToUser(receiverId, "NEW_MESSAGE", savedMsg);
            deliverToUser(userId, "NEW_MESSAGE", savedMsg);
          }
        } else if (type === "TYPING_STATUS") {
          const { receiverId, conversationId, isTyping } = msgPayload;
          const typingMsg = JSON.stringify({ userId: receiverId, type: "TYPING_INDICATOR", payload: { conversationId, isTyping, userId } });
          if (redisAvailable) pub!.publish("notifications", typingMsg).catch(() => {});
          else deliverToUser(receiverId, "TYPING_INDICATOR", { conversationId, isTyping, userId });
        } else if (type === "HEARTBEAT") {
          sendWsMessage(ws, "HEARTBEAT_ACK", undefined);
        }
      } catch (err) {
        wsErrorsTotal.inc({ stage: "message_handler" });
        console.error("Error processing message:", err);
      }
    });

    ws.on("close", () => {
      localClients.delete(userId);
      wsConnectionsActive.dec();
    });
  } catch {
    wsErrorsTotal.inc({ stage: "auth" });
    ws.close(1008, "Invalid token");
  }
});

server.listen(PORT, async () => {
  console.log(`🚀 ShareBite Hub listening on port ${PORT}`);
  await initRedis();
});
