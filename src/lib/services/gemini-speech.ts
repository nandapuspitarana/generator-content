/**
 * Google Gemini Native Speech Generation Service
 * Powered by Gemini 2.5 Flash / Pro Speech Models
 * Direct multimodal audio output with native vocal expression tags ([laughs], [whispers], [sighs], etc.)
 */

export interface GeminiTtsOptions {
  text: string;
  voiceName?: string;
  voiceSeed?: number;
  model?: string;
}

export interface GeminiVoiceInfo {
  id: string;
  name: string;
  gender: "female" | "male";
  style: string;
  description: string;
}

export const GEMINI_PREBUILT_VOICES: GeminiVoiceInfo[] = [
  {
    id: "Kore",
    name: "Kore (Wanita - Tenang & Menawan)",
    gender: "female",
    style: "✨ Kalem, Jelas & Edukatif",
    description: "Artikulasi jernih dan santun, sangat ideal untuk narasi buku, edukasi, dan materi mendalam.",
  },
  {
    id: "Aoede",
    name: "Aoede (Wanita - Hangat & Ekspresif)",
    gender: "female",
    style: "✨ Dramatis, Hangat & Penuh Emosi",
    description: "Penjiwaan emosional mendalam, sangat hidup untuk cerita fiksi, podcast interaktif, dan storytelling.",
  },
  {
    id: "Puck",
    name: "Puck (Pria - Ceria & Energik)",
    gender: "male",
    style: "✨ Dinamis, Ramah & Upbeat",
    description: "Host muda yang energik, bersahabat, dan asik didengar untuk podcast obrolan santai dan review buku.",
  },
  {
    id: "Charon",
    name: "Charon (Pria - Berwibawa & Berat)",
    gender: "male",
    style: "✨ Suara Berat, Karismatik & Berwibawa",
    description: "Resonansi nada rendah yang elegan dan formal untuk ringkasan eksekutif dan konten dokumenter.",
  },
  {
    id: "Fenrir",
    name: "Fenrir (Pria - Tegas & Mantap)",
    gender: "male",
    style: "✨ Percaya Diri, Kuat & Lugas",
    description: "Intonasi tegas dan berwibawa, cocok untuk materi bisnis, kepemimpinan, dan ulasan mendalam.",
  },
];

/**
 * Maps seed number or voice name to a supported Gemini voice.
 */
export function resolveGeminiVoice(voiceSeed?: number, requestedName?: string): string {
  if (requestedName) {
    const matched = GEMINI_PREBUILT_VOICES.find(
      (v) => v.id.toLowerCase() === requestedName.toLowerCase()
    );
    if (matched) return matched.id;
  }

  if (voiceSeed !== undefined && voiceSeed !== null) {
    switch (voiceSeed) {
      // Gemini Studio Dedicated Seed IDs
      case 9001:
        return "Kore";
      case 9002:
        return "Aoede";
      case 9003:
        return "Puck";
      case 9004:
        return "Charon";
      case 9005:
        return "Fenrir";

      // Fish-Speech Seed Compatibility Fallbacks
      case 2222:
      case 4444:
      case 2210:
        return "Puck";
      case 2230:
      case 2700:
      case 2500:
        return "Charon";
      case 1111:
      case 5555:
      case 2600:
        return "Fenrir";
      case 6666:
      case 6620:
      case 6500:
      case 6600:
      case 6700:
        return "Kore";
      case 8888:
      case 6610:
      case 7777:
      case 3333:
      case 1120:
        return "Aoede";
      default:
        // Even seed -> Puck, Odd seed -> Kore
        return voiceSeed % 2 === 0 ? "Puck" : "Kore";
    }
  }

  return "Kore";
}

/**
 * Maps all 34 Vocal Expression Tags and sound indicators into Gemini audio cues.
 * Gemini natively generates human laughing, whispering, sighing, gasping, and dynamic prosody.
 */
export function prepareGeminiSpeechText(rawText: string): string {
  let text = rawText
    // Strip HTML tags & scripts
    .replace(/<(script|iframe|object|embed|style)[^>]*>.*?<\/\1>/gi, "")
    .replace(/javascript:/gi, "")
    // Remove host prefixes often found in scripts (e.g. "HOST:", "**Host:**")
    .replace(/^(?:(?:\*\*|\*|#+\s*)?(?:HOST|Host|NARRATOR|Narrator|SPEAKER|Speaker)(?:\*\*|\*)?\s*:\s*)/gim, "")
    // Remove background music/SFX markers that shouldn't be read out loud
    .replace(/\[(?:Intro Music|Music Fade In|Music Fade Out|Outro Music|BGM|SFX|Sound Effect)[^\]]*\]/gi, "");

  // 34 Vocal Expression Tags mapped to Gemini natural speech cues
  const tagMappings: Record<string, string> = {
    // Jeda & Napas
    "\\[pause\\]": " ... ",
    "\\[short pause\\]": " .. ",
    "<break[^>]*>": " ... ",
    "\\[inhale\\]": " [gasps] ",
    "\\[exhale\\]": " [sighs] ",
    "\\[sigh\\]": " [sighs] ",
    "\\[clearing throat\\]": " [clears throat] ",
    "\\[panting\\]": " [panting] ",
    "\\[tsk\\]": " [tsks] ",

    // Tawa & Ceria
    "\\[laughing\\]": " [laughs] ",
    "\\[chuckle\\]": " [chuckles] ",
    "\\[chuckling\\]": " [chuckles] ",
    "\\[laughing tone\\]": " [laughs] ",
    "\\[audience laughter\\]": " [laughs] ",
    "\\[delight\\]": " [delight] ",

    // Dinamika Suara
    "\\[whisper\\]": " [whispers] ",
    "\\[low voice\\]": " [whispers] ",
    "\\[low volume\\]": " [softly] ",
    "\\[volume down\\]": " [softly] ",
    "\\[loud\\]": " [loudly] ",
    "\\[volume up\\]": " [loudly] ",
    "\\[screaming\\]": " [screaming] ",
    "\\[shouting\\]": " [shouting] ",
    "\\[emphasis\\]": " ",

    // Emosi & Mood
    "\\[excited\\]": " [excitedly] ",
    "\\[excited tone\\]": " [excitedly] ",
    "\\[surprised\\]": " [gasps] ",
    "\\[shocked\\]": " [gasps] ",
    "\\[angry\\]": " [angrily] ",
    "\\[sad\\]": " [sadly] ",
    "\\[singing\\]": " [sings] ",
    "\\[echo\\]": " ",
    "\\[interrupting\\]": " ... ",
    "\\[moaning\\]": " [groans] ",
    "\\[with strong accent\\]": " ",
  };

  for (const [pattern, replacement] of Object.entries(tagMappings)) {
    text = text.replace(new RegExp(pattern, "gi"), replacement);
  }

  // Normalize excessive whitespaces and dots
  text = text.replace(/[ \t]+/g, " ").trim();
  return text;
}

/**
 * Packs raw 16-bit linear PCM into a standard 44-byte RIFF WAV container.
 */
export function pcmToWav(
  pcmBuffer: Buffer,
  sampleRate: number = 24000,
  numChannels: number = 1,
  bitsPerSample: number = 16
): Buffer {
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = pcmBuffer.length;
  const chunkSize = 36 + dataSize;

  const header = Buffer.alloc(44);

  // RIFF identifier
  header.write("RIFF", 0);
  header.writeUInt32LE(chunkSize, 4);
  header.write("WAVE", 8);

  // fmt subchunk
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16); // Subchunk1Size for PCM
  header.writeUInt16LE(1, 20);  // AudioFormat (1 = PCM)
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);

  // data subchunk
  header.write("data", 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcmBuffer]);
}

/**
 * Synthesizes text to studio-quality spoken audio using Google Gemini Speech Generation API.
 */
export async function synthesizeWithGemini(
  options: GeminiTtsOptions
): Promise<{ audioBuffer: Buffer; durationSec: number; voiceName: string }> {
  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GEMINI_KEY;

  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not set. Silakan tambahkan GEMINI_API_KEY di file .env."
    );
  }

  const rawModel = options.model || process.env.GEMINI_TTS_MODEL;
  const model =
    rawModel && rawModel !== "gemini-tts" && !rawModel.startsWith("gemini-tts")
      ? rawModel
      : "gemini-2.5-flash-preview-tts";

  const voiceName = resolveGeminiVoice(options.voiceSeed, options.voiceName);
  const speechText = prepareGeminiSpeechText(options.text);

  if (!speechText) {
    throw new Error("Text content is empty after sanitization.");
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  const payload = {
    contents: [
      {
        parts: [{ text: speechText }],
      },
    ],
    generationConfig: {
      responseModalities: ["AUDIO"],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: {
            voiceName: voiceName,
          },
        },
      },
    },
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errText = await response.text();
    let errorDetail = errText;
    try {
      const errJson = JSON.parse(errText);
      errorDetail = errJson.error?.message || errText;
    } catch {
      // Ignored
    }
    throw new Error(`Gemini Speech API error (${response.status}): ${errorDetail}`);
  }

  const data = await response.json();
  const candidates = data.candidates || [];
  if (!candidates.length) {
    throw new Error("Gemini Speech API did not return any candidates.");
  }

  const parts = candidates[0]?.content?.parts || [];
  let rawPcmBuffer: Buffer | null = null;

  for (const part of parts) {
    if (part.inlineData && part.inlineData.data) {
      rawPcmBuffer = Buffer.from(part.inlineData.data, "base64");
      break;
    }
  }

  if (!rawPcmBuffer || rawPcmBuffer.length === 0) {
    throw new Error("No audio payload returned from Gemini Speech API.");
  }

  // Gemini returns 24kHz 16-bit Mono Linear PCM (audio/L16;codec=pcm;rate=24000)
  const sampleRate = 24000;
  const wavBuffer = pcmToWav(rawPcmBuffer, sampleRate, 1, 16);
  const durationSec = Math.round((rawPcmBuffer.length / (sampleRate * 2)) * 100) / 100;

  return {
    audioBuffer: wavBuffer,
    durationSec,
    voiceName,
  };
}
