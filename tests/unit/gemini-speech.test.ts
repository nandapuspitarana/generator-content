import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  pcmToWav,
  resolveGeminiVoice,
  prepareGeminiSpeechText,
  synthesizeWithGemini,
  GEMINI_PREBUILT_VOICES,
} from "@/lib/services/gemini-speech";

describe("Google Gemini Speech Generation Service", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("pcmToWav()", () => {
    it("should prepend a valid 44-byte RIFF WAV header to raw PCM buffer", () => {
      const dummyPcm = Buffer.alloc(4800); // 4800 bytes = 0.1s of 24kHz 16-bit mono
      const wav = pcmToWav(dummyPcm, 24000, 1, 16);

      expect(wav.length).toBe(dummyPcm.length + 44);

      // RIFF Chunk Descriptor
      expect(wav.toString("ascii", 0, 4)).toBe("RIFF");
      expect(wav.readUInt32LE(4)).toBe(36 + dummyPcm.length);
      expect(wav.toString("ascii", 8, 12)).toBe("WAVE");

      // fmt subchunk
      expect(wav.toString("ascii", 12, 16)).toBe("fmt ");
      expect(wav.readUInt32LE(16)).toBe(16); // Subchunk1Size (16 for PCM)
      expect(wav.readUInt16LE(20)).toBe(1);  // AudioFormat (1 = PCM)
      expect(wav.readUInt16LE(22)).toBe(1);  // NumChannels
      expect(wav.readUInt32LE(24)).toBe(24000); // SampleRate
      expect(wav.readUInt32LE(28)).toBe(48000); // ByteRate (24000 * 1 * 16 / 8)
      expect(wav.readUInt16LE(32)).toBe(2);  // BlockAlign
      expect(wav.readUInt16LE(34)).toBe(16); // BitsPerSample

      // data subchunk
      expect(wav.toString("ascii", 36, 40)).toBe("data");
      expect(wav.readUInt32LE(40)).toBe(dummyPcm.length);
    });
  });

  describe("resolveGeminiVoice()", () => {
    it("should resolve explicit dedicated Gemini seeds (9001-9005)", () => {
      expect(resolveGeminiVoice(9001)).toBe("Kore");
      expect(resolveGeminiVoice(9002)).toBe("Aoede");
      expect(resolveGeminiVoice(9003)).toBe("Puck");
      expect(resolveGeminiVoice(9004)).toBe("Charon");
      expect(resolveGeminiVoice(9005)).toBe("Fenrir");
    });

    it("should resolve requested voice name case-insensitively", () => {
      expect(resolveGeminiVoice(undefined, "aoede")).toBe("Aoede");
      expect(resolveGeminiVoice(undefined, "PUCK")).toBe("Puck");
      expect(resolveGeminiVoice(undefined, "charon")).toBe("Charon");
      expect(resolveGeminiVoice(undefined, "kore")).toBe("Kore");
      expect(resolveGeminiVoice(undefined, "fenrir")).toBe("Fenrir");
    });

    it("should resolve legacy Fish-Speech seeds gracefully", () => {
      expect(resolveGeminiVoice(2222)).toBe("Puck");
      expect(resolveGeminiVoice(6666)).toBe("Kore");
      expect(resolveGeminiVoice(8888)).toBe("Aoede");
      expect(resolveGeminiVoice(2230)).toBe("Charon");
      expect(resolveGeminiVoice(1111)).toBe("Fenrir");
    });

    it("should fallback to Kore when no voice seed or name is provided", () => {
      expect(resolveGeminiVoice()).toBe("Kore");
    });
  });

  describe("prepareGeminiSpeechText()", () => {
    it("should map laughing and joy vocal tags to [laughs] / [chuckles]", () => {
      const raw = "Cerita ini sangat lucu [laughing] dan membuat tertawa [chuckle].";
      const processed = prepareGeminiSpeechText(raw);
      expect(processed).toContain("[laughs]");
      expect(processed).toContain("[chuckles]");
      expect(processed).not.toContain("[laughing]");
    });

    it("should map whisper and breathing tags to [whispers], [sighs], and [gasps]", () => {
      const raw = "Jangan keras-keras [whisper], dia sedang tidur. [sigh] Fiuh, lega sekali [inhale].";
      const processed = prepareGeminiSpeechText(raw);
      expect(processed).toContain("[whispers]");
      expect(processed).toContain("[sighs]");
      expect(processed).toContain("[gasps]");
      expect(processed).not.toContain("[whisper]");
    });

    it("should map pause tags to natural ellipsis pauses", () => {
      const raw = "Tunggu sebentar [pause] mari kita pikirkan [short pause] baik-baik.";
      const processed = prepareGeminiSpeechText(raw);
      expect(processed).toContain("...");
      expect(processed).toContain("..");
      expect(processed).not.toContain("[pause]");
    });

    it("should strip host prefixes and background music cues", () => {
      const raw = "**HOST:** [Intro Music] Halo pendengar! [excited] Selamat datang!";
      const processed = prepareGeminiSpeechText(raw);
      expect(processed).not.toContain("HOST:");
      expect(processed).not.toContain("[Intro Music]");
      expect(processed).toContain("[excitedly]");
      expect(processed).toContain("Selamat datang!");
    });

    it("should strip malicious script tags", () => {
      const raw = "<script>alert('hack')</script>Halo dunia!";
      const processed = prepareGeminiSpeechText(raw);
      expect(processed).toBe("Halo dunia!");
    });
  });

  describe("synthesizeWithGemini()", () => {
    it("should throw an error if GEMINI_API_KEY is not configured", async () => {
      const oldKey = process.env.GEMINI_API_KEY;
      delete process.env.GEMINI_API_KEY;
      delete process.env.GOOGLE_API_KEY;
      delete process.env.GEMINI_KEY;

      await expect(
        synthesizeWithGemini({ text: "Halo dunia" })
      ).rejects.toThrow("GEMINI_API_KEY is not set");

      if (oldKey) process.env.GEMINI_API_KEY = oldKey;
    });

    it("should call Gemini endpoint with correct headers, payload, and return decoded audio/wav", async () => {
      const mockPcm = Buffer.alloc(48000, 0x12); // 1 sec of 24kHz 16-bit mono
      const mockBase64 = mockPcm.toString("base64");

      const mockResponse = {
        candidates: [
          {
            content: {
              parts: [
                {
                  inlineData: {
                    mimeType: "audio/L16;codec=pcm;rate=24000",
                    data: mockBase64,
                  },
                },
              ],
            },
          },
        ],
      };

      const fetchSpy = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });
      vi.stubGlobal("fetch", fetchSpy);

      process.env.GEMINI_API_KEY = "test-gemini-key";

      const result = await synthesizeWithGemini({
        text: "Halo teman! [laughing] Senang sekali bertemu.",
        voiceSeed: 9003, // Puck
      });

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      const [url, requestInit] = fetchSpy.mock.calls[0];
      expect(url).toContain("gemini-2.5-flash-preview-tts:generateContent");
      expect(requestInit.headers["x-goog-api-key"]).toBe("test-gemini-key");

      const body = JSON.parse(requestInit.body);
      expect(body.generationConfig.responseModalities).toEqual(["AUDIO"]);
      expect(body.generationConfig.speechConfig.voiceConfig.prebuiltVoiceConfig.voiceName).toBe("Puck");
      expect(body.contents[0].parts[0].text).toContain("[laughs]");

      expect(result.voiceName).toBe("Puck");
      expect(result.durationSec).toBe(1);
      expect(result.audioBuffer.length).toBe(mockPcm.length + 44);
      expect(result.audioBuffer.toString("ascii", 0, 4)).toBe("RIFF");
    });
  });
});
