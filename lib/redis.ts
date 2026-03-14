import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  throw new Error("REDIS_URL is not defined in environment variables");
}

const redis = new Redis(redisUrl);

try {
  const url = new URL(redisUrl);
  console.log(`📡 Attempting Redis connection to: ${url.hostname}`);
} catch (e) {
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
