import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL;
const fallbackRedisUrl = "redis://127.0.0.1:6379";
let lastErrorMessage = "";
let lastErrorLogAt = 0;

function shouldLogRedisError(message: string) {
  const now = Date.now();
  const isRepeat = message === lastErrorMessage;
  const isRecent = now - lastErrorLogAt < 10000;

  if (isRepeat && isRecent) {
    return false;
  }

  lastErrorMessage = message;
  lastErrorLogAt = now;
  return true;
}

const redis = new Redis(redisUrl ?? fallbackRedisUrl, {
  lazyConnect: true,
  enableOfflineQueue: false,
  maxRetriesPerRequest: 1,
  connectTimeout: 1000,
  retryStrategy: (attempts) => Math.min(attempts * 500, 5000),
});

if (!redisUrl) {
  console.warn("REDIS_URL is not defined. Redis-backed features will fail open.");
}

try {
  const url = new URL(redisUrl ?? fallbackRedisUrl);
  console.log(`📡 Attempting Redis connection to: ${url.hostname}`);
} catch {
  console.error("❌ Malformed REDIS_URL in .env");
}

redis.on("error", (error) => {
  if (!shouldLogRedisError(error.message)) {
    return;
  }

  if (error.message.includes("WRONGPASS")) {
    console.error("❌ Redis Authentication Failed: Invalid password in REDIS_URL");
  } else {
    console.error("❌ Redis Error:", error.message);
  }
});

redis.on("ready", () => {
  console.log("✅ Redis connection established and authenticated.");
});

export async function ensureRedisConnection() {
  if (redis.status === "ready" || redis.status === "connecting") {
    return;
  }

  try {
    await redis.connect();
  } catch {
    // Allow API handlers to fail open when Redis is unavailable.
  }
}

void ensureRedisConnection();

export default redis;
