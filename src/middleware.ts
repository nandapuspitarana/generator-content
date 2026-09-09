import { NextRequest, NextResponse } from "next/server"

interface RateLimitRecord {
  count: number
  resetTime: number
}

// In-memory sliding rate limiter map
const ipRateLimitMap = new Map<string, RateLimitRecord>()

// Clean up stale entries every 5 minutes to prevent memory leak
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000
let lastCleanup = Date.now()

function cleanupStaleRecords(now: number) {
  if (now - lastCleanup > CLEANUP_INTERVAL_MS) {
    lastCleanup = now
    for (const [key, record] of ipRateLimitMap.entries()) {
      if (now > record.resetTime) {
        ipRateLimitMap.delete(key)
      }
    }
  }
}

function checkRateLimit(key: string, limit: number, windowMs: number): { allowed: boolean; remaining: number; retryAfterSec: number } {
  const now = Date.now()
  cleanupStaleRecords(now)

  const record = ipRateLimitMap.get(key)

  if (!record || now > record.resetTime) {
    ipRateLimitMap.set(key, {
      count: 1,
      resetTime: now + windowMs,
    })
    return { allowed: true, remaining: limit - 1, retryAfterSec: 0 }
  }

  if (record.count >= limit) {
    const retryAfterSec = Math.max(1, Math.ceil((record.resetTime - now) / 1000))
    return { allowed: false, remaining: 0, retryAfterSec }
  }

  record.count += 1
  return { allowed: true, remaining: limit - record.count, retryAfterSec: 0 }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Only apply rate limiting to API routes
  if (!pathname.startsWith("/api/")) {
    return NextResponse.next()
  }

  // Determine client IP
  const forwardedFor = request.headers.get("x-forwarded-for")
  const clientIp = forwardedFor ? forwardedFor.split(",")[0].trim() : request.headers.get("x-real-ip") || "anonymous-client"

  // Check if it's a high-cost generation, TTS, or publishing route
  const isHighCostRoute =
    pathname.startsWith("/api/generate") ||
    pathname.startsWith("/api/podcast/generate") ||
    pathname.startsWith("/api/tts") ||
    pathname.startsWith("/api/medium/publish") ||
    pathname.startsWith("/api/medium/batch-sync")

  const limit = isHighCostRoute ? 20 : 100 // 20 req/min for high-cost, 100 req/min for general API
  const windowMs = 60 * 1000 // 1 minute window
  const rateLimitKey = `${clientIp}:${isHighCostRoute ? "heavy" : "general"}`

  const { allowed, remaining, retryAfterSec } = checkRateLimit(rateLimitKey, limit, windowMs)

  if (!allowed) {
    return NextResponse.json(
      {
        error: "Rate limit exceeded. Too many requests. Please wait and try again later.",
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfterSec),
          "X-RateLimit-Limit": String(limit),
          "X-RateLimit-Remaining": "0",
        },
      }
    )
  }

  const response = NextResponse.next()
  response.headers.set("X-RateLimit-Limit", String(limit))
  response.headers.set("X-RateLimit-Remaining", String(remaining))

  return response
}

export const config = {
  matcher: ["/api/:path*"],
}
