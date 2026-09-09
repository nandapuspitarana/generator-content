import { NextRequest, NextResponse } from "next/server";
import { TtsSynthesizeSchema } from "@/lib/validation/schemas";

const DEFAULT_CHATTTS_URL = "http://localhost:8765";

/**
 * GET /api/tts
 * Health check & status check for the ChatTTS microservice
 */
export async function GET() {
  const isEnabled = process.env.CHATTTS_ENABLED !== "false";
  const serviceUrl = process.env.CHATTTS_SERVICE_URL || DEFAULT_CHATTTS_URL;

  if (!isEnabled) {
    return NextResponse.json({
      enabled: false,
      status: "disabled",
      message: "ChatTTS service is disabled via CHATTTS_ENABLED=false.",
    });
  }

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
      details: data,
    });
  } catch (err: any) {
    const isTimeout = err.name === "AbortError";
    return NextResponse.json(
      {
        enabled: true,
        status: "unreachable",
        message: isTimeout
          ? "Connection to ChatTTS microservice timed out."
          : `ChatTTS microservice is not reachable at ${serviceUrl}.`,
      },
      { status: 503 }
    );
  }
}

/**
 * POST /api/tts
 * Bridge to synthesize speech using ChatTTS microservice
 */
export async function POST(request: NextRequest) {
  const isEnabled = process.env.CHATTTS_ENABLED !== "false";
  if (!isEnabled) {
    return NextResponse.json(
      { error: "ChatTTS service is currently disabled in system settings." },
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

  const { text, temperature, top_P, top_K, voice_seed, speed } = parseResult.data;
  const serviceUrl = process.env.CHATTTS_SERVICE_URL || DEFAULT_CHATTTS_URL;

  try {
    const controller = new AbortController();
    // Allow up to 90 seconds for CPU audio inference of longer paragraphs
    const timeoutId = setTimeout(() => controller.abort(), 90000);

    const res = await fetch(`${serviceUrl}/synthesize`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        temperature,
        top_P,
        top_K,
        voice_seed,
        speed,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      let errorMessage = `ChatTTS service returned error code ${res.status}`;
      try {
        const errJson = await res.json();
        if (errJson.detail) errorMessage = errJson.detail;
      } catch {
        // Fallback to status text
      }
      return NextResponse.json({ error: errorMessage }, { status: res.status });
    }

    const audioBuffer = await res.arrayBuffer();

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/wav",
        "Content-Disposition": 'inline; filename="chattts-speech.wav"',
        "Content-Length": String(audioBuffer.byteLength),
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (err: any) {
    if (err.name === "AbortError") {
      return NextResponse.json(
        { error: "Sintesis suara ChatTTS melebihi batas waktu (timeout)." },
        { status: 504 }
      );
    }

    console.error("ChatTTS API Bridge Error:", err);
    return NextResponse.json(
      {
        error:
          "ChatTTS microservice tidak dapat dihubungi. Pastikan service berjalan di docker compose.",
        details: err.message || String(err),
      },
      { status: 503 }
    );
  }
}
