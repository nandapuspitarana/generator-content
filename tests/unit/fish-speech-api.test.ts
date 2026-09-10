import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GET, POST } from "@/app/api/tts/route";
import { NextRequest } from "next/server";
import { TtsSynthesizeSchema } from "@/lib/validation/schemas";

describe("Fish-Speech API & Features (/api/tts)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    delete process.env.FISH_SPEECH_ENABLED;
    delete process.env.CHATTTS_ENABLED;
    delete process.env.FISH_SPEECH_SERVICE_URL;
    delete process.env.CHATTTS_SERVICE_URL;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("TtsSynthesizeSchema with Fish-Speech Extensions", () => {
    it("should accept voice cloning parameters (reference_audio & reference_text)", () => {
      const result = TtsSynthesizeSchema.safeParse({
        text: "Selamat datang di studio podcast suara Indonesia.",
        reference_audio: "data:audio/wav;base64,UklGRi4AAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=",
        reference_text: "Halo, ini suara referensi.",
        model: "indonesia-lora",
        speed: 1.1,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.reference_audio).toBeDefined();
        expect(result.data.reference_text).toBe("Halo, ini suara referensi.");
        expect(result.data.model).toBe("indonesia-lora");
        expect(result.data.speed).toBe(1.1);
      }
    });

    it("should default model to 'default' when unspecified", () => {
      const result = TtsSynthesizeSchema.safeParse({
        text: "Uji coba sintesis teks biasa",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.model).toBe("default");
      }
    });
  });

  describe("GET /api/tts (Fish-Speech Health & Status)", () => {
    it("should return connected status with fish-speech engine metadata", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          status: "healthy",
          service: "fish-speech-service",
          model_loaded: true,
          device: "cuda:0 (NVIDIA GeForce GTX 1650)",
          checkpoint: "indonesia-tts-merged",
          capabilities: ["text-to-speech", "zero-shot-voice-clone", "lora-adaptation"]
        }),
      });
      vi.stubGlobal("fetch", mockFetch);

      const res = await GET();
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.enabled).toBe(true);
      expect(data.status).toBe("connected");
      expect(data.engine).toBe("fish-speech");
      expect(data.details.device).toContain("GTX 1650");
    });
  });

  describe("POST /api/tts (Voice Clone & Async Synthesis)", () => {
    it("should proxy voice cloning payload to Fish-Speech microservice", async () => {
      const fakeWavBuffer = new Uint8Array([82, 73, 70, 70, 36, 0, 0, 0, 87, 65, 86, 69]).buffer;
      let capturedPayload: any = null;

      const mockFetch = vi.fn().mockImplementation((url, opts) => {
        if (opts && opts.body) {
          capturedPayload = JSON.parse(opts.body);
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          headers: new Headers({
            "Content-Type": "audio/wav",
            "X-TTS-Engine": "fish-speech",
            "X-Model-Mode": "real",
          }),
          arrayBuffer: async () => fakeWavBuffer,
        });
      });
      vi.stubGlobal("fetch", mockFetch);

      const req = new NextRequest("http://localhost:3300/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: "Halo semua, ini uji coba Fish-Speech Indonesia.",
          model: "indonesia-lora",
          reference_audio: "data:audio/wav;base64,AAAA",
          speed: 1.0,
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      expect(res.headers.get("X-TTS-Engine")).toBe("fish-speech");
      expect(capturedPayload).not.toBeNull();
      expect(capturedPayload.model).toBe("indonesia-lora");
      expect(capturedPayload.reference_audio).toBe("data:audio/wav;base64,AAAA");
    });

    it("should strip malicious script tags in Indonesian dialogue", async () => {
      let capturedPayload: any = null;
      const fakeWavBuffer = new Uint8Array([82, 73, 70, 70]).buffer;

      const mockFetch = vi.fn().mockImplementation((url, opts) => {
        if (opts && opts.body) {
          capturedPayload = JSON.parse(opts.body);
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          headers: new Headers({ "Content-Type": "audio/wav" }),
          arrayBuffer: async () => fakeWavBuffer,
        });
      });
      vi.stubGlobal("fetch", mockFetch);

      const req = new NextRequest("http://localhost:3300/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: 'Halo <script>alert("XSS")</script> selamat datang di podcast.',
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      expect(capturedPayload.text).not.toContain("<script>");
      expect(capturedPayload.text).toContain("Halo  selamat datang di podcast.");
    });

    it("should enqueue async synthesis job when mode=async is specified", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          job_id: "fish-job-999",
          status: "queued",
          total_segments: 10,
          engine: "fish-speech",
        }),
      });
      vi.stubGlobal("fetch", mockFetch);

      const req = new NextRequest("http://localhost:3300/api/tts?mode=async", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: "Naskah podcast panjang berdurasi 10 menit...",
          model: "indonesia-lora",
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.mode).toBe("async");
      expect(data.job_id).toBe("fish-job-999");
      expect(data.statusUrl).toBe("/api/tts?jobId=fish-job-999");
      expect(data.audioUrl).toBe("/api/tts?jobId=fish-job-999&audio=true");
    });
  });
});
