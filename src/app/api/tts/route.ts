import { NextRequest, NextResponse } from "next/server";
import { TtsSynthesizeSchema } from "@/lib/validation/schemas";

const DEFAULT_TTS_URL = "http://localhost:8765";

function getServiceUrl() {
  return process.env.FISH_SPEECH_SERVICE_URL || process.env.CHATTTS_SERVICE_URL || DEFAULT_TTS_URL;
}

function isServiceEnabled() {
  const fishFlag = process.env.FISH_SPEECH_ENABLED;
  if (fishFlag !== undefined) return fishFlag !== "false";
  const chatFlag = process.env.CHATTTS_ENABLED;
  if (chatFlag !== undefined) return chatFlag !== "false";
  return true;
}

/**
 * GET /api/tts
 * 1. Health check & status check for TTS microservice (no query params)
 * 2. Background Job Status polling (/api/tts?jobId=...)
 * 3. Background Job Audio download (/api/tts?jobId=...&audio=true)
 */
export async function GET(): Promise<NextResponse>;
export async function GET(request: NextRequest): Promise<NextResponse>;
export async function GET(request?: NextRequest): Promise<NextResponse> {
  const isEnabled = isServiceEnabled();
  const serviceUrl = getServiceUrl();

  if (!isEnabled) {
    return NextResponse.json({
      enabled: false,
      status: "disabled",
      message: "TTS service is disabled via settings.",
    });
  }

  let jobId: string | null = null;
  let wantsAudio = false;
  let wantsModels = false;

  if (request?.url) {
    try {
      const { searchParams } = new URL(request.url);
      jobId = searchParams.get("jobId");
      wantsAudio = searchParams.get("audio") === "true";
      wantsModels = searchParams.get("models") === "true";
    } catch {
      // Ignored if URL cannot be parsed
    }
  }

  // Handle Models & Voices Query
  if (wantsModels) {
    try {
      const res = await fetch(`${serviceUrl}/models`, {
        headers: { Accept: "application/json" },
      });
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }
    } catch (err: any) {
      console.warn("Could not fetch models from TTS service:", err);
    }
    // Return standard fallback models if microservice has not yet refreshed /models route
    return NextResponse.json({
      active_checkpoint: "standby-neural",
      checkpoints: [
        {
          id: "indonesia-lora",
          name: "Indonesia Fine-Tuned (X-Lord Dataset LoRA)",
          description: "Trained on 16.4 hours of Indonesian speech dataset for natural local intonation.",
          is_ready: false,
          recommended: true,
        },
        {
          id: "standby-neural",
          name: "High-Definition Indonesian Neural Engine",
          description: "Studio-grade neural voice synthesis engine tuned for Indonesian podcast & narration.",
          is_ready: true,
          recommended: true,
        },
        {
          id: "default",
          name: "Base Model (Fish-Speech openaudio-s1-mini)",
          description: "Multilingual foundation model supporting zero-shot cloning.",
          is_ready: false,
          recommended: false,
        },
      ],
      voices: [
        {
          seed: 2222,
          name: "Host Natural Indonesia (Pria)",
          gender: "male",
          style: "Casual, Hangat & Percakapan",
          default_speed: 1.0,
          voice_id: "id-ID-ArdiNeural",
        },
        {
          seed: 4444,
          name: "Host Energik Podcast (Pria)",
          gender: "male",
          style: "Dynamic, Upbeat & Review Produk",
          default_speed: 1.05,
          voice_id: "id-ID-ArdiNeural",
        },
        {
          seed: 6666,
          name: "Host Narasi Kalem (Wanita)",
          gender: "female",
          style: "Calm, Jelas & Edukasi",
          default_speed: 1.0,
          voice_id: "id-ID-GadisNeural",
        },
        {
          seed: 8888,
          name: "Host Storyteller Deep (Wanita)",
          gender: "female",
          style: "Dramatic & Storytelling Mendalam",
          default_speed: 0.95,
          voice_id: "id-ID-GadisNeural",
        },
      ],
      default_paragraph_delay: 1.0,
      supported_tags: [
        '<break time="0.5s"/>',
        '<break time="1s"/>',
        '<break time="1.5s"/>',
        '<break time="2s"/>',
      ],
      supported_vocal_tags: [
        "[pause]", "[emphasis]", "[laughing]", "[inhale]", "[chuckle]", "[tsk]", "[singing]", "[excited]",
        "[laughing tone]", "[interrupting]", "[chuckling]", "[excited tone]", "[volume up]", "[echo]",
        "[angry]", "[low volume]", "[sigh]", "[low voice]", "[whisper]", "[screaming]", "[shouting]",
        "[loud]", "[surprised]", "[short pause]", "[exhale]", "[delight]", "[panting]", "[audience laughter]",
        "[with strong accent]", "[volume down]", "[clearing throat]", "[sad]", "[moaning]", "[shocked]"
      ],
    });
  }

  // Handle Job Polling & Retrieval
  if (jobId) {
    try {
      if (wantsAudio) {
        const audioRes = await fetch(`${serviceUrl}/synthesize/jobs/${encodeURIComponent(jobId)}/audio`);
        if (!audioRes.ok) {
          return NextResponse.json(
            { error: `Gagal mengambil audio untuk job ${jobId}` },
            { status: audioRes.status }
          );
        }
        const audioBuffer = await audioRes.arrayBuffer();
        const mode = audioRes.headers?.get ? (audioRes.headers.get("X-Model-Mode") || audioRes.headers.get("X-ChatTTS-Mode") || "real") : "real";
        return new NextResponse(audioBuffer, {
          status: 200,
          headers: {
            "Content-Type": "audio/wav",
            "Content-Disposition": `inline; filename="podcast-${jobId.slice(0, 8)}.wav"`,
            "Content-Length": String(audioBuffer.byteLength),
            "X-TTS-Engine": "fish-speech",
            "X-ChatTTS-Mode": mode,
          },
        });
      }

      const statusRes = await fetch(`${serviceUrl}/synthesize/jobs/${encodeURIComponent(jobId)}`);
      if (!statusRes.ok) {
        return NextResponse.json(
          { error: `Job ${jobId} tidak ditemukan.` },
          { status: statusRes.status }
        );
      }
      const jobData = await statusRes.json();
      return NextResponse.json(jobData);
    } catch (err: any) {
      return NextResponse.json(
        { error: "Gagal memeriksa status job TTS", details: err.message || String(err) },
        { status: 503 }
      );
    }
  }

  // Handle standard health check
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const res = await fetch(`${serviceUrl}/health`, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      return NextResponse.json(
        {
          enabled: true,
          status: "unhealthy",
          statusCode: res.status,
          serviceUrl,
        },
        { status: 502 }
      );
    }

    const data = await res.json();
    return NextResponse.json({
      enabled: true,
      status: "connected",
      serviceUrl,
      engine: "fish-speech",
      details: data,
    });
  } catch (err: any) {
    const isTimeout = err.name === "AbortError";
    return NextResponse.json(
      {
        enabled: true,
        status: "unreachable",
        message: isTimeout
          ? "Connection to TTS microservice timed out."
          : `TTS microservice is not reachable at ${serviceUrl}.`,
      },
      { status: 503 }
    );
  }
}

/**
 * POST /api/tts
 * Bridge to synthesize speech using Fish-Speech microservice.
 * Supports:
 * - Synchronous synthesis (default): with dynamic timeout
 * - Asynchronous background job (when ?mode=async or payload.mode === "async"): prevents timeout entirely
 * - Zero-shot voice cloning via reference_audio + reference_text
 * - Checkpoint selection via model
 */
export async function POST(request: NextRequest) {
  const isEnabled = isServiceEnabled();
  if (!isEnabled) {
    return NextResponse.json(
      { error: "TTS service is currently disabled in system settings." },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Format payload JSON tidak valid." },
      { status: 400 }
    );
  }

  // Validate payload with Zod
  const parseResult = TtsSynthesizeSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      {
        error: "Validasi gagal",
        details: parseResult.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  const { text, reference_audio, reference_text, model, temperature, top_P, top_K, voice_seed, speed, paragraph_delay } = parseResult.data;
  const serviceUrl = getServiceUrl();

  // Security sanitization: strip dangerous HTML/script tags before sending to Python
  const sanitizedText = text
    .replace(/<(script|iframe|object|embed|style)[^>]*>.*?<\/\1>/gi, "")
    .replace(/javascript:/gi, "");

  const { searchParams } = new URL(request.url);
  const rawBody = body as Record<string, unknown>;
  const isAsyncMode = searchParams.get("mode") === "async" || rawBody.mode === "async";

  // 1. Asynchronous Job Mode (Guaranteed zero-timeout for massive podcast scripts)
  if (isAsyncMode) {
    try {
      const jobRes = await fetch(`${serviceUrl}/synthesize/jobs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: sanitizedText,
          reference_audio,
          reference_text,
          model,
          temperature,
          top_P,
          top_K,
          voice_seed,
          speed,
          paragraph_delay,
        }),
      });

      if (!jobRes.ok) {
        const errJson = await jobRes.json().catch(() => ({}));
        return NextResponse.json(
          { error: errJson.detail || `TTS service returned error ${jobRes.status}` },
          { status: jobRes.status }
        );
      }

      const jobData = await jobRes.json();
      return NextResponse.json({
        success: true,
        mode: "async",
        ...jobData,
        statusUrl: `/api/tts?jobId=${jobData.job_id}`,
        audioUrl: `/api/tts?jobId=${jobData.job_id}&audio=true`,
      });
    } catch (err: any) {
      return NextResponse.json(
        {
          error: "TTS microservice tidak dapat dihubungi untuk memproses job.",
          details: err.message || String(err),
        },
        { status: 503 }
      );
    }
  }

  // 2. Synchronous Mode with Dynamic Timeout
  try {
    const controller = new AbortController();
    const timeoutDuration = Math.max(90000, Math.min(300000, text.length * 100));
    const timeoutId = setTimeout(() => controller.abort(), timeoutDuration);

    const res = await fetch(`${serviceUrl}/synthesize`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: sanitizedText,
        reference_audio,
        reference_text,
        model,
        temperature,
        top_P,
        top_K,
        voice_seed,
        speed,
        paragraph_delay,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      let errorMessage = `TTS service returned error code ${res.status}`;
      try {
        const errJson = await res.json();
        if (errJson.detail) errorMessage = errJson.detail;
      } catch {
        // Fallback to status text
      }
      return NextResponse.json({ error: errorMessage }, { status: res.status });
    }

    const audioBuffer = await res.arrayBuffer();
    const mode = res.headers?.get ? (res.headers.get("X-Model-Mode") || res.headers.get("X-ChatTTS-Mode") || "real") : "real";
    const segmentCount = res.headers?.get ? (res.headers.get("X-Audio-Segments") || "1") : "1";

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/wav",
        "Content-Disposition": 'inline; filename="speech.wav"',
        "Content-Length": String(audioBuffer.byteLength),
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "X-TTS-Engine": "fish-speech",
        "X-ChatTTS-Mode": mode,
        "X-Audio-Segments": segmentCount,
      },
    });

  } catch (err: any) {
    if (err.name === "AbortError") {
      return NextResponse.json(
        { error: "Sintesis suara TTS melebihi batas waktu (timeout)." },
        { status: 504 }
      );
    }

    console.error("TTS API Bridge Error:", err);
    return NextResponse.json(
      {
        error:
          "TTS microservice tidak dapat dihubungi. Pastikan service berjalan di terminal atau docker compose.",
        details: err.message || String(err),
      },
      { status: 503 }
    );
  }
}
