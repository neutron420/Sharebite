import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL;
const fallbackRedisUrl = "redis://127.0.0.1:6379";

const redis = new Redis(redisUrl ?? fallbackRedisUrl, {
  lazyConnect: true,
  enableOfflineQueue: false,
  maxRetriesPerRequest: 1,
  connectTimeout: 1000,
  retryStrategy: (attempts) => (attempts > 1 ? null : 200),
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
  if (error.message.includes("WRONGPASS")) {
    console.error("❌ Redis Authentication Failed: Invalid password in REDIS_URL");
  } else {
    console.error("❌ Redis Error:", error.message);
  }
});

redis.on("ready", () => {
  console.log("✅ Redis connection established and authenticated.");
});

export default redis;
