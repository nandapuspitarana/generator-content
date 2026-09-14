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
        // 🎙️ Varian Andi / Ardi (Pria - Host Favorit & Multi-Bahasa)
        {
          seed: 2222,
          name: "Andi Natural (Pria)",
          gender: "male",
          language: "id",
          group: "ardi",
          style: "🇮🇩 Casual, Hangat & Percakapan Nyaman",
          description: "Sangat nyaman di telinga orang Indonesia, artikulasi fasih untuk istilah lokal & internasional.",
          default_speed: 1.0,
          voice_id: "id-ID-ArdiNeural",
        },
        {
          seed: 4444,
          name: "Andi Energik (Pria)",
          gender: "male",
          language: "id",
          group: "ardi",
          style: "🇮🇩 Dinamis, Upbeat & Review Buku",
          description: "Penuh semangat untuk topik produktivitas, inovasi, dan review buku self-improvement.",
          default_speed: 1.05,
          voice_id: "id-ID-ArdiNeural",
        },
        {
          seed: 2210,
          name: "Andi Podcaster Santai (Pria)",
          gender: "male",
          language: "id",
          group: "ardi",
          style: "🇮🇩 Hangat, Intim & Diskusi Santai",
          description: "Gaya ngobrol santai seperti berbicara langsung dengan pendengar di ruang santai.",
          default_speed: 0.98,
          voice_id: "id-ID-ArdiNeural",
        },
        {
          seed: 2220,
          name: "Andi Narator Formal (Pria)",
          gender: "male",
          language: "id",
          group: "ardi",
          style: "🇮🇩 Berwibawa, Rapi & Dokumenter",
          description: "Intonasi mantap dan profesional untuk ringkasan eksekutif dan materi edukatif.",
          default_speed: 0.96,
          voice_id: "id-ID-ArdiNeural",
        },
        {
          seed: 2230,
          name: "Andi Deep Bass (Pria)",
          gender: "male",
          language: "id",
          group: "ardi",
          style: "🇮🇩 Suara Berat, Maskulin & Karismatik",
          description: "Resonansi nada rendah yang berkarakter kuat, tenang, dan memikat.",
          default_speed: 0.95,
          voice_id: "id-ID-ArdiNeural",
        },

        // 🌸 Varian Gadis (Wanita - Edukasi & Storyteller)
        {
          seed: 6666,
          name: "Gadis Narasi (Wanita)",
          gender: "female",
          language: "id",
          group: "gadis",
          style: "🇮🇩 Kalem, Jelas & Edukasi",
          description: "Artikulasi jernih dan tenang, standar emas untuk edukasi dan narasi artikel.",
          default_speed: 1.0,
          voice_id: "id-ID-GadisNeural",
        },
        {
          seed: 8888,
          name: "Gadis Storyteller (Wanita)",
          gender: "female",
          language: "id",
          group: "gadis",
          style: "🇮🇩 Dramatis & Storytelling Mendalam",
          description: "Penjiwaan emosional mendalam untuk cerita fiksi, memoar, dan narasi puitis.",
          default_speed: 0.95,
          voice_id: "id-ID-GadisNeural",
        },
        {
          seed: 6610,
          name: "Gadis Ceria & Fresh (Wanita)",
          gender: "female",
          language: "id",
          group: "gadis",
          style: "🇮🇩 Fresh, Ramah & Upbeat",
          description: "Ceria dan bersahabat, cocok untuk podcast gaya muda dan konten kreatif.",
          default_speed: 1.04,
          voice_id: "id-ID-GadisNeural",
        },
        {
          seed: 6620,
          name: "Gadis Lembut (Wanita)",
          gender: "female",
          language: "id",
          group: "gadis",
          style: "🇮🇩 Menenangkan, Halus & Bedtime Story",
          description: "Suara lembut menenangkan, cocok untuk renungan, self-care, dan konten malam.",
          default_speed: 0.92,
          voice_id: "id-ID-GadisNeural",
        },

        // 🇮🇩 Suara Nusantara (Teduh, Santun & Ramah)
        {
          seed: 2500,
          name: "Dimas Nusantara (Pria)",
          gender: "male",
          language: "id",
          group: "nusantara",
          style: "🇮🇩 Teduh, Bersahabat & Santun",
          description: "Karakter pria Jawa yang santun, adem, dan sangat bersahaja di telinga pendengar.",
          default_speed: 0.98,
          voice_id: "jv-ID-DimasNeural",
        },
        {
          seed: 6500,
          name: "Siti Ayu (Wanita)",
          gender: "female",
          language: "id",
          group: "nusantara",
          style: "🇮🇩 Anggun, Lembut & Tenang",
          description: "Karakter wanita Jawa yang santun, halus budi, dan sangat menenangkan.",
          default_speed: 0.96,
          voice_id: "jv-ID-SitiNeural",
        },
        {
          seed: 2600,
          name: "Jajang Akrab (Pria)",
          gender: "male",
          language: "id",
          group: "nusantara",
          style: "🇮🇩 Ramah, Renyah & Humoris",
          description: "Karakter Sunda yang ramah, hangat, dan asik didengar untuk obrolan santai.",
          default_speed: 1.02,
          voice_id: "su-ID-JajangNeural",
        },
        {
          seed: 6600,
          name: "Ibu Tuti (Wanita)",
          gender: "female",
          language: "id",
          group: "nusantara",
          style: "🇮🇩 Hangat, Keibuan & Welas Asih",
          description: "Sentuhan keibuan yang hangat dan penuh perhatian untuk narasi keluarga & moral.",
          default_speed: 0.96,
          voice_id: "su-ID-TutiNeural",
        },
        {
          seed: 2700,
          name: "Osman Elegan (Pria)",
          gender: "male",
          language: "id",
          group: "nusantara",
          style: "🇮🇩 Jernih, Rapi & Elegan Serumpun",
          description: "Diksi sangat rapi dan formal dengan nuansa Melayu serumpun yang akrab.",
          default_speed: 1.0,
          voice_id: "ms-MY-OsmanNeural",
        },
        {
          seed: 6700,
          name: "Yasmin Melati (Wanita)",
          gender: "female",
          language: "id",
          group: "nusantara",
          style: "🇮🇩 Manis, Sopan & Jernih",
          description: "Artikulasi jernih dan manis, enak didengar untuk audio artikel berdurasi panjang.",
          default_speed: 0.98,
          voice_id: "ms-MY-YasminNeural",
        },

        // 🌐 Multilingual Masters (Bilingual ID-EN & Global)
        {
          seed: 1111,
          name: "Andi Multilingual Pro (Pria)",
          gender: "male",
          language: "en-multi",
          group: "multilingual",
          style: "🌐 Bilingual Luwes (ID & EN), Sangat Nyaman",
          description: "Mampu melafalkan istilah Inggris dan buku asing secara fasih tanpa kehilangan kenyamanan telinga Indonesia.",
          default_speed: 1.0,
          voice_id: "en-US-BrianMultilingualNeural",
        },
        {
          seed: 5555,
          name: "Brian Tech Reviewer (Pria)",
          gender: "male",
          language: "en-multi",
          group: "multilingual",
          style: "🌐 Cerdas, Karismatik & Diskusi Tech",
          description: "Sangat cocok untuk buku teknologi, sains, bisnis modern, dan istilah asing intensif.",
          default_speed: 1.0,
          voice_id: "en-US-BrianMultilingualNeural",
        },
        {
          seed: 1120,
          name: "William Audiobook (Pria)",
          gender: "male",
          language: "en-multi",
          group: "multilingual",
          style: "🌐 Internasional, Elegan & Audio Drama",
          description: "Standar audiobook internasional dengan vokal bersih dan nada karismatik.",
          default_speed: 0.98,
          voice_id: "en-AU-WilliamMultilingualNeural",
        },
        {
          seed: 7777,
          name: "Ava Storyteller (Wanita)",
          gender: "female",
          language: "en-multi",
          group: "multilingual",
          style: "🌐 Ekspresif, Cerita Fiksi & Bilingual",
          description: "Ekspresif dan fleksibel untuk buku fiksi, literatur dunia, dan podcast dwibahasa.",
          default_speed: 0.96,
          voice_id: "en-US-AvaMultilingualNeural",
        },
        {
          seed: 3333,
          name: "Emma Narator Dunia (Wanita)",
          gender: "female",
          language: "en-multi",
          group: "multilingual",
          style: "🌐 Mewah, Berwibawa & Elegan",
          description: "Vokal premium untuk buku biografi tokoh dunia dan narasi kelas atas.",
          default_speed: 0.95,
          voice_id: "en-US-EmmaMultilingualNeural",
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
