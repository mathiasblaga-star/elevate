import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const hasUpstash = !!(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
);

const limiter = hasUpstash
  ? new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(5, "60 s"),
      prefix: "elevate",
    })
  : null;

// ponytail: no-op when Upstash env absent — app runs Redis-free, flip on by adding the two env vars
export async function rateLimit(identifier: string): Promise<{ success: boolean }> {
  if (!limiter) return { success: true };
  const { success } = await limiter.limit(identifier);
  return { success };
}
