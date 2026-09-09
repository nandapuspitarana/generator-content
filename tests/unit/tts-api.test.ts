import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GET, POST } from "@/app/api/tts/route";
import { NextRequest } from "next/server";
import { TtsSynthesizeSchema } from "@/lib/validation/schemas";

describe("ChatTTS API Route Handler & Schema (/api/tts)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    delete process.env.CHATTTS_ENABLED;
    delete process.env.CHATTTS_SERVICE_URL;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("TtsSynthesizeSchema Validation", () => {
    it("should accept valid payload with defaults", () => {
      const result = TtsSynthesizeSchema.safeParse({
        text: "Halo, selamat datang di podcast AsikReview.",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.temperature).toBe(0.3);
        expect(result.data.voice_seed).toBe(2222);
        expect(result.data.speed).toBe(1.0);
      }
    });

    it("should reject empty text", () => {
      const result = TtsSynthesizeSchema.safeParse({ text: "" });
      expect(result.success).toBe(false);
    });

    it("should reject text exceeding 5000 characters", () => {
      const longText = "a".repeat(5001);
      const result = TtsSynthesizeSchema.safeParse({ text: longText });
      expect(result.success).toBe(false);
    });

    it("should accept custom voice parameters within bounds", () => {
      const result = TtsSynthesizeSchema.safeParse({
        text: "Testing custom voice parameters.",
        temperature: 0.5,
        top_P: 0.8,
        top_K: 30,
        voice_seed: 8888,
        speed: 1.2,
      });
      expect(result.success).toBe(true);
    });

    it("should reject invalid speed parameter (e.g. out of range)", () => {
      const result = TtsSynthesizeSchema.safeParse({
        text: "Valid text",
        speed: 3.5, // max is 2.0
      });
      expect(result.success).toBe(false);
    });
  });

  describe("GET /api/tts (Health & Status)", () => {
    it("should return disabled status when CHATTTS_ENABLED is false", async () => {
      process.env.CHATTTS_ENABLED = "false";
      const res = await GET();
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.enabled).toBe(false);
      expect(data.status).toBe("disabled");
    });

    it("should return connected status when ChatTTS service responds healthy", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          status: "healthy",
          service: "chattts-microservice",
          model_loaded: true,
        }),
      });
      vi.stubGlobal("fetch", mockFetch);

      const res = await GET();
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.enabled).toBe(true);
      expect(data.status).toBe("connected");
      expect(data.details.model_loaded).toBe(true);
    });

    it("should return 503 unreachable when ChatTTS microservice is down", async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error("ECONNREFUSED"));
      vi.stubGlobal("fetch", mockFetch);

      const res = await GET();
      expect(res.status).toBe(503);
      const data = await res.json();
      expect(data.status).toBe("unreachable");
    });
  });

  describe("POST /api/tts (Speech Synthesis)", () => {
    it("should return 503 when service is disabled via CHATTTS_ENABLED=false", async () => {
      process.env.CHATTTS_ENABLED = "false";
      const req = new NextRequest("http://localhost:3000/api/tts", {
        method: "POST",
        body: JSON.stringify({ text: "Test audio" }),
      });
      const res = await POST(req);
      expect(res.status).toBe(503);
      const data = await res.json();
      expect(data.error).toContain("disabled");
    });

    it("should return 400 if request body is invalid JSON", async () => {
      const req = new NextRequest("http://localhost:3000/api/tts", {
        method: "POST",
        body: "invalid-json-string{",
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it("should return 400 if text is missing or empty", async () => {
      const req = new NextRequest("http://localhost:3000/api/tts", {
        method: "POST",
        body: JSON.stringify({ text: "" }),
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("Validasi gagal");
    });

    it("should proxy request to ChatTTS service and return audio/wav buffer on success", async () => {
      const fakeWavBytes = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00]); // "RIFF" header
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        arrayBuffer: async () => fakeWavBytes.buffer,
      });
      vi.stubGlobal("fetch", mockFetch);

      const req = new NextRequest("http://localhost:3000/api/tts", {
        method: "POST",
        body: JSON.stringify({ text: "Selamat pagi pendengar setia podcast AsikReview!" }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      expect(res.headers.get("Content-Type")).toBe("audio/wav");
      expect(res.headers.get("Content-Disposition")).toContain("inline");

      const arrayBuffer = await res.arrayBuffer();
      expect(arrayBuffer.byteLength).toBe(fakeWavBytes.byteLength);
    });

    it("should return 504 Gateway Timeout if ChatTTS synthesis times out", async () => {
      const timeoutError = new Error("AbortError");
      timeoutError.name = "AbortError";
      const mockFetch = vi.fn().mockRejectedValue(timeoutError);
      vi.stubGlobal("fetch", mockFetch);

      const req = new NextRequest("http://localhost:3000/api/tts", {
        method: "POST",
        body: JSON.stringify({ text: "Sintesis naskah panjang..." }),
      });

      const res = await POST(req);
      expect(res.status).toBe(504);
      const data = await res.json();
      expect(data.error).toContain("timeout");
    });

    it("should return 503 if ChatTTS service cannot be reached", async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error("connect ECONNREFUSED 127.0.0.1:8765"));
      vi.stubGlobal("fetch", mockFetch);

      const req = new NextRequest("http://localhost:3000/api/tts", {
        method: "POST",
        body: JSON.stringify({ text: "Halo dunia" }),
      });

      const res = await POST(req);
      expect(res.status).toBe(503);
      const data = await res.json();
      expect(data.error).toContain("tidak dapat dihubungi");
    });
  });
});
