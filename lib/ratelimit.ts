import redis from "./redis";
export async function checkRateLimit(
  identifier: string,
  limit: number = 60,
  windowSeconds: number = 60
) {
  const key = `ratelimit:${identifier}`;
  
  const [incrResult, ttlResult] = await redis
    .multi()
    .incr(key)
    .ttl(key)
    .exec() || [];

  const count = (incrResult?.[1] as number) || 0;
  let ttl = (ttlResult?.[1] as number) || -1;

  // Set expiry on first request
  if (count === 1 || ttl === -1) {
    await redis.expire(key, windowSeconds);
    ttl = windowSeconds;
  }

  const reset = Math.floor(Date.now() / 1000) + ttl;

  return {
    success: count <= limit,
    limit,
    remaining: Math.max(0, limit - count),
    reset,
  };
}
