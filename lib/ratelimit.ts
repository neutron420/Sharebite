import redis from "./redis";

/**
 * Checks if a user has exceeded their request limit.
 * @param identifier A unique string like user ID or IP address
 * @param limit Number of allowed requests in the window
 * @param windowSeconds Time window in seconds
 * @returns { success: boolean, remaining: number }
 */
export async function checkRateLimit(
  identifier: string,
  limit: number = 10,
  windowSeconds: number = 60
) {
  const key = `ratelimit:${identifier}`;
  
  // Increment and set expiry in one atomic operation
  const current = await redis.incr(key);
  
  if (current === 1) {
    await redis.expire(key, windowSeconds);
  }
  
  const success = current <= limit;
  
  return {
    success,
    remaining: Math.max(0, limit - current),
  };
}
