import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const hasUpstash = !!(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
);

const redis = hasUpstash ? Redis.fromEnv() : null;

function make(limit: number, window: `${number} s`, prefix: string) {
  return redis
    ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(limit, window), prefix })
    : null;
}

// Tiers: strict auth, generous general-API mutations, moderate AI.
const authLimiter = make(5, "60 s", "elevate:auth");
const apiLimiter = make(60, "60 s", "elevate:api");
const aiLimiter = make(10, "60 s", "elevate:ai");

async function check(limiter: Ratelimit | null, id: string) {
  if (!limiter) return { success: true };
  const { success } = await limiter.limit(id);
  return { success };
}

// ponytail: no-op when Upstash env absent — app runs Redis-free, flip on by adding the two env vars
export function rateLimit(id: string) {
  return check(authLimiter, id);
}
export function rateLimitApi(id: string) {
  return check(apiLimiter, id);
}
export function rateLimitAi(id: string) {
  return check(aiLimiter, id);
}
