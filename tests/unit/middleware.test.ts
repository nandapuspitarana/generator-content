import { describe, it, expect, beforeEach } from "vitest";
import { middleware } from "@/middleware";
import { NextRequest } from "next/server";

describe("Rate Limiting Middleware", () => {
  it("should ignore non-API routes", () => {
    const req = new NextRequest("http://localhost:3000/dashboard");
    const res = middleware(req);
    expect(res.headers.get("X-RateLimit-Limit")).toBeNull();
  });

  it("should allow normal API requests and attach rate limit headers", () => {
    const req = new NextRequest("http://localhost:3000/api/articles", {
      headers: { "x-forwarded-for": "198.51.100.1" },
    });
    const res = middleware(req);

    expect(res.status).toBe(200);
    expect(res.headers.get("X-RateLimit-Limit")).toBe("100");
    expect(res.headers.get("X-RateLimit-Remaining")).toBe("99");
  });

  it("should enforce lower limit (20) on high-cost generation routes", () => {
    const req = new NextRequest("http://localhost:3000/api/generate", {
      headers: { "x-forwarded-for": "198.51.100.2" },
    });
    const res = middleware(req);

    expect(res.status).toBe(200);
    expect(res.headers.get("X-RateLimit-Limit")).toBe("20");
    expect(res.headers.get("X-RateLimit-Remaining")).toBe("19");
  });

  it("should block requests and return 429 when rate limit is exceeded", async () => {
    const testIp = "198.51.100.99";

    // Exhaust 20 requests
    for (let i = 0; i < 20; i++) {
      const req = new NextRequest("http://localhost:3000/api/generate", {
        headers: { "x-forwarded-for": testIp },
      });
      middleware(req);
    }

    // 21st request should be blocked
    const blockedReq = new NextRequest("http://localhost:3000/api/generate", {
      headers: { "x-forwarded-for": testIp },
    });
    const blockedRes = middleware(blockedReq);

    expect(blockedRes.status).toBe(429);
    expect(blockedRes.headers.get("Retry-After")).toBeDefined();
    
    const body = await blockedRes.json();
    expect(body.error).toContain("Rate limit exceeded");
  });
});
