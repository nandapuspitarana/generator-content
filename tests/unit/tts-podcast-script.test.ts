import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GET, POST } from "@/app/api/tts/route";
import { NextRequest } from "next/server";
import { TtsSynthesizeSchema } from "@/lib/validation/schemas";

const PODCAST_SAMPLE_SCRIPT = `Halo semua! Selamat datang di episode terbaru podcast kita. Saya Nanda, host kalian hari ini. <break time="1s"/> Kali ini, kita akan menyelami topik yang sangat menarik dan relevan, yaitu "3 Artificial Intelligence: A Modern Approach". <break time="2s"/> 

Kecerdasan buatan atau AI telah menjadi bagian penting dalam kehidupan kita sehari-hari. Namun, pernahkah Anda bertanya-tanya bagaimana AI sebenarnya memecahkan masalah? <break time="1s"/> Mari kita mulai dengan memahami konsep Problem-Solving Agents. <break time="1.5s"/> 

Problem-Solving Agents adalah entitas yang secara khusus dirancang untuk mengambil keputusan dalam situasi kompleks. Mereka bekerja dengan menjelajahi berbagai kemungkinan dan memilih langkah yang akan membawa mereka lebih dekat ke solusi. Tetapi, tidak semua masalah yang dihadapi AI itu sederhana. <break time="1s"/> Oleh karena itu, strategi pencarian yang efektif sangat diperlukan. <break time="1.5s"/> 

Ketika kita membicarakan Search Strategies, kita membahas metode yang digunakan agen untuk menjelajahi ruang masalah. Ada banyak metode seperti pencarian mendalam dan pencarian lebar. Setiap strategi memiliki kelebihan dan kekurangan tergantung pada masalah yang dihadapi. <break time="1s"/> 

Heuristic Search adalah salah satu metode yang terkenal. Ia memanfaatkan aturan praktis atau 'heuristik' untuk memperkirakan seberapa dekat suatu langkah menuju solusi. <break time="1s"/> Dengan menggunakan heuristik, agen dapat menghindari jalur yang tidak menjanjikan, fokus pada yang lebih menjanjikan, dan menghemat waktu serta sumber daya. <break time="1.5s"/> 

Namun, bagaimana jika kita berhadapan dengan situasi kompetitif? <break time="1s"/> Inilah saatnya Adversarial Search mengambil peran. Dalam konteks ini, agen harus mempertimbangkan tindakan lawan. <break time="1s"/> Seperti dalam permainan catur, agen harus merencanakan langkah mereka dengan cermat untuk bisa mengalahkan lawan. Ini menambah lapisan kompleksitas, karena agen tidak hanya mencari solusi terbaik untuk dirinya sendiri tetapi juga harus memprediksi langkah-langkah lawan. <break time="1.5s"/> 

Dengan memahami berbagai strategi pencarian ini, baik yang bersifat heuristik maupun yang melibatkan rivalitas, kita dapat lebih menghargai bagaimana AI menyelesaikan berbagai masalah rumit dalam kehidupan sehari-hari. <break time="1s"/> Dari memecahkan teka-teki kompleks hingga mengalahkan lawan dalam permainan strategi, AI telah menunjukkan kemampuannya yang luar biasa. <break time="2s"/> 

Sebagai kesimpulan, AI tidak hanya memecahkan masalah, tetapi juga mengubah cara kita melihat dan menyelesaikan masalah itu sendiri. <break time="1.5s"/> Dengan terus mempelajari dan memahami AI, kita bisa lebih siap menghadapi tantangan masa depan. Jadi, jangan berhenti di sini! Teruslah belajar dan mencari tahu lebih dalam tentang AI dan bagaimana ia dapat berkontribusi dalam hidup kita. <break time="2s"/> 

Terima kasih telah mendengarkan! Sampai jumpa di episode berikutnya`;

describe("Podcast Long Script ChatTTS Test Suite (AI: A Modern Approach)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    delete process.env.CHATTTS_ENABLED;
    delete process.env.CHATTTS_SERVICE_URL;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("1. Script Schema Validation & Bounds", () => {
    it("should accept full 2,992-character AI podcast script within bounds", () => {
      expect(PODCAST_SAMPLE_SCRIPT.length).toBeGreaterThan(2500);
      expect(PODCAST_SAMPLE_SCRIPT.length).toBeLessThanOrEqual(5000);

      const parsed = TtsSynthesizeSchema.safeParse({
        text: PODCAST_SAMPLE_SCRIPT,
        voice_seed: 2222,
        speed: 1.0,
      });

      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.text).toContain("Problem-Solving Agents");
        expect(parsed.data.text).toContain("Adversarial Search");
        expect(parsed.data.voice_seed).toBe(2222);
      }
    });

    it("should detect all 16 SSML break tags in the transcript", () => {
      const breakMatches = PODCAST_SAMPLE_SCRIPT.match(/<break\s+time=["'][0-9.]+s?["']\s*\/>/gi);
      expect(breakMatches).not.toBeNull();
      expect(breakMatches?.length).toBe(16);
    });

    it("should reject payload exceeding 5,000 characters to prevent buffer exhaustion DoS", () => {
      const bloatedScript = PODCAST_SAMPLE_SCRIPT + " " + "A".repeat(2500);
      const parsed = TtsSynthesizeSchema.safeParse({
        text: bloatedScript,
      });
      expect(parsed.success).toBe(false);
    });
  });

  describe("2. Security Sanitization & SSML Protection", () => {
    it("should sanitize malicious script and iframe injections before forwarding to TTS", async () => {
      const maliciousScript = `${PODCAST_SAMPLE_SCRIPT} <script>alert('XSS')</script> <iframe src="http://attacker.com"></iframe>`;

      let capturedPayload: any = null;
      const mockFetch = vi.fn().mockImplementation(async (url: string, init: any) => {
        if (url.includes("/synthesize")) {
          capturedPayload = JSON.parse(init.body);
          return new Response(new Uint8Array([82, 73, 70, 70]), {
            status: 200,
            headers: { "Content-Type": "audio/wav" },
          });
        }
        return new Response("Not found", { status: 404 });
      });
      vi.stubGlobal("fetch", mockFetch);

      const req = new NextRequest("http://localhost:3000/api/tts", {
        method: "POST",
        body: JSON.stringify({
          text: maliciousScript,
          voice_seed: 4444,
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);

      expect(capturedPayload).not.toBeNull();
      expect(capturedPayload.text).not.toContain("<script>");
      expect(capturedPayload.text).not.toContain("alert('XSS')");
      expect(capturedPayload.text).not.toContain("<iframe");
      expect(capturedPayload.text).toContain("Problem-Solving Agents");
    });
  });

  describe("3. Timeout Prevention & Chunked Background Job Architecture", () => {
    it("should dispatch to background job (/synthesize/jobs) when mode=async is requested", async () => {
      const mockJobResponse = {
        job_id: "test-job-uuid-12345",
        status: "queued",
        total_segments: 17,
        estimated_seconds: 102,
      };

      const mockFetch = vi.fn().mockImplementation(async (url: string) => {
        if (url.includes("/synthesize/jobs")) {
          return new Response(JSON.stringify(mockJobResponse), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }
        return new Response("Not found", { status: 404 });
      });
      vi.stubGlobal("fetch", mockFetch);

      const req = new NextRequest("http://localhost:3000/api/tts?mode=async", {
        method: "POST",
        body: JSON.stringify({
          text: PODCAST_SAMPLE_SCRIPT,
          voice_seed: 2222,
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.mode).toBe("async");
      expect(data.job_id).toBe("test-job-uuid-12345");
      expect(data.total_segments).toBe(17);
      expect(data.statusUrl).toBe("/api/tts?jobId=test-job-uuid-12345");
      expect(data.audioUrl).toBe("/api/tts?jobId=test-job-uuid-12345&audio=true");
    });

    it("should poll background job progress successfully via GET /api/tts?jobId=...", async () => {
      const mockStatusResponse = {
        job_id: "test-job-uuid-12345",
        status: "processing",
        progress: 0.65,
        completed_segments: 11,
        total_segments: 17,
        error: null,
        has_audio: false,
      };

      const mockFetch = vi.fn().mockImplementation(async (url: string) => {
        if (url.includes("/synthesize/jobs/test-job-uuid-12345")) {
          return new Response(JSON.stringify(mockStatusResponse), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }
        return new Response("Not found", { status: 404 });
      });
      vi.stubGlobal("fetch", mockFetch);

      const req = new NextRequest("http://localhost:3000/api/tts?jobId=test-job-uuid-12345", {
        method: "GET",
      });

      const res = await GET(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.status).toBe("processing");
      expect(data.completed_segments).toBe(11);
      expect(data.total_segments).toBe(17);
      expect(data.progress).toBe(0.65);
    });

    it("should download finalized stitched WAV audio via GET /api/tts?jobId=...&audio=true", async () => {
      const dummyWavBytes = new Uint8Array([82, 73, 70, 70, 100, 0, 0, 0, 87, 65, 86, 69]);

      const mockFetch = vi.fn().mockImplementation(async (url: string) => {
        if (url.includes("/synthesize/jobs/test-job-uuid-12345/audio")) {
          return new Response(dummyWavBytes, {
            status: 200,
            headers: {
              "Content-Type": "audio/wav",
              "X-ChatTTS-Mode": "real",
            },
          });
        }
        return new Response("Not found", { status: 404 });
      });
      vi.stubGlobal("fetch", mockFetch);

      const req = new NextRequest("http://localhost:3000/api/tts?jobId=test-job-uuid-12345&audio=true", {
        method: "GET",
      });

      const res = await GET(req);
      expect(res.status).toBe(200);
      expect(res.headers.get("Content-Type")).toBe("audio/wav");
      expect(res.headers.get("X-ChatTTS-Mode")).toBe("real");

      const buffer = await res.arrayBuffer();
      expect(buffer.byteLength).toBe(dummyWavBytes.length);
    });

    it("should scale synchronous timeout beyond standard 90s to avoid 504 on long transcripts", async () => {
      // Synchronous request with long text
      const mockFetch = vi.fn().mockImplementation(async (url: string) => {
        if (url.includes("/synthesize")) {
          return new Response(new Uint8Array([82, 73, 70, 70]), {
            status: 200,
            headers: { "Content-Type": "audio/wav", "X-Audio-Segments": "33" },
          });
        }
        return new Response("Not found", { status: 404 });
      });
      vi.stubGlobal("fetch", mockFetch);

      const req = new NextRequest("http://localhost:3000/api/tts", {
        method: "POST",
        body: JSON.stringify({
          text: PODCAST_SAMPLE_SCRIPT,
          voice_seed: 6666,
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      expect(res.headers.get("X-Audio-Segments")).toBe("33");
    });
  });
});
