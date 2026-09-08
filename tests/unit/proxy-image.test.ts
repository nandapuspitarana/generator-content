import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GET } from "@/app/api/proxy-image/route";
import { NextRequest } from "next/server";

describe("Proxy Image API Route Handler", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should return 400 if url query parameter is missing", async () => {
    const req = new NextRequest("http://localhost:3000/api/proxy-image");
    const res = await GET(req);

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("Missing url parameter");
  });

  it("should return 400 for invalid protocol like ftp://", async () => {
    const req = new NextRequest("http://localhost:3000/api/proxy-image?url=ftp://files.example.com/pic.jpg");
    const res = await GET(req);

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("Invalid protocol");
  });

  it("should return 403 if target URL points to loopback localhost", async () => {
    const req = new NextRequest("http://localhost:3000/api/proxy-image?url=http://localhost:3000/admin");
    const res = await GET(req);

    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toContain("forbidden");
  });

  it("should return 403 if target URL points to private RFC1918 range", async () => {
    const req = new NextRequest("http://localhost:3000/api/proxy-image?url=http://192.168.1.1/router");
    const res = await GET(req);

    expect(res.status).toBe(403);
  });

  it("should return 403 if target URL points to cloud metadata endpoint", async () => {
    const req = new NextRequest("http://localhost:3000/api/proxy-image?url=http://169.254.169.254/latest/meta-data");
    const res = await GET(req);

    expect(res.status).toBe(403);
  });

  it("should return 415 if remote server returns a non-image content type", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({
        "content-type": "application/json",
      }),
      arrayBuffer: async () => new ArrayBuffer(50),
    });
    vi.stubGlobal("fetch", mockFetch);

    const req = new NextRequest("http://localhost:3000/api/proxy-image?url=https://example.com/file.json");
    const res = await GET(req);

    expect(res.status).toBe(415);
    const data = await res.json();
    expect(data.error).toContain("not a valid image format");
  });

  it("should return remote status code if remote image fetch fails (e.g. 404)", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      headers: new Headers(),
    });
    vi.stubGlobal("fetch", mockFetch);

    const req = new NextRequest("http://localhost:3000/api/proxy-image?url=https://example.com/not-found.jpg");
    const res = await GET(req);

    expect(res.status).toBe(404);
  });

  it("should return 200 with proper headers for valid public image", async () => {
    const dummyImageBuffer = new Uint8Array([0x89, 0x50, 0x4e, 0x47]).buffer; // PNG magic bytes
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({
        "content-type": "image/png",
      }),
      arrayBuffer: async () => dummyImageBuffer,
    });
    vi.stubGlobal("fetch", mockFetch);

    const req = new NextRequest("http://localhost:3000/api/proxy-image?url=https://images.unsplash.com/cover.png");
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("image/png");
    expect(res.headers.get("Cache-Control")).toContain("public");
  });

  it("should return 504 on request timeout (AbortError)", async () => {
    const abortError = new Error("The operation was aborted");
    abortError.name = "AbortError";
    const mockFetch = vi.fn().mockRejectedValue(abortError);
    vi.stubGlobal("fetch", mockFetch);

    const req = new NextRequest("http://localhost:3000/api/proxy-image?url=https://example.com/slow-image.jpg");
    const res = await GET(req);

    expect(res.status).toBe(504);
    const data = await res.json();
    expect(data.error).toContain("timed out");
  });
});
