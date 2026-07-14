// Lightweight in-memory sliding-window rate limiter.
// Per warm server instance — shields upstream APIs from abusive bursts.

type Bucket = { count: number; resetAt: number }

const buckets = new Map<string, Bucket>()

export type RateLimitResult = {
  ok: boolean
  remaining: number
  resetAt: number
}

/**
 * Fixed-window limiter.
 * @param key    Unique caller identity (usually IP + route).
 * @param limit  Max requests allowed within the window.
 * @param windowMs Window length in milliseconds.
 */
export function rateLimit(key: string, limit = 20, windowMs = 60_000): RateLimitResult {
  const now = Date.now()
  const bucket = buckets.get(key)

  if (!bucket || now >= bucket.resetAt) {
    const resetAt = now + windowMs
    buckets.set(key, { count: 1, resetAt })
    return { ok: true, remaining: limit - 1, resetAt }
  }

  bucket.count += 1
  const ok = bucket.count <= limit
  return { ok, remaining: Math.max(0, limit - bucket.count), resetAt: bucket.resetAt }
}

/** Best-effort client IP extraction from standard proxy headers. */
export function clientIp(req: Request): string {
  const h = req.headers
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    h.get("cf-connecting-ip") ||
    "anonymous"
  )
}

// Periodic cleanup to keep the map bounded on long-lived instances.
if (typeof setInterval !== "undefined") {
  const timer = setInterval(() => {
    const now = Date.now()
    for (const [key, bucket] of buckets) {
      if (now >= bucket.resetAt) buckets.delete(key)
    }
  }, 60_000)
  // Don't keep the event loop alive purely for cleanup.
  if (typeof (timer as { unref?: () => void }).unref === "function") {
    ;(timer as { unref?: () => void }).unref!()
  }
}
