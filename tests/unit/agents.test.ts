import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { runIdeator } from "@/lib/services/agents/ideator";
import { runWriter } from "@/lib/services/agents/writer";
import { runPodcaster } from "@/lib/services/agents/podcaster";

describe("AI Agent Pipeline", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("runIdeator()", () => {
    it("should return outline content from OpenAI response", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          choices: [
            {
              message: {
                content: "### Outline\n1. Pembukaan\n2. Konsep Utama\n3. Kesimpulan",
              },
            },
          ],
        }),
      });
      vi.stubGlobal("fetch", mockFetch);

      const outline = await runIdeator(
        "Sapiens",
        "Yuval Noah Harari",
        "Revolusi kognitif",
        "sk-test-key"
      );

      expect(outline).toContain("Outline");
      expect(mockFetch).toHaveBeenCalledTimes(1);
      
      const requestPayload = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(requestPayload.model).toBe("gpt-4o-mini");
      expect(requestPayload.messages[1].content).toContain("Sapiens");
    });

    it("should throw error if OpenAI responds with failure", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      });
      vi.stubGlobal("fetch", mockFetch);

      await expect(
        runIdeator("Book", "Author", "", "sk-test-key")
      ).rejects.toThrow("Ideator agent failed to respond.");
    });
  });

  describe("runWriter()", () => {
    it("should include affiliate link in prompt when provided", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          choices: [
            {
              message: {
                content: "# Sapiens Review\n\nDaftar Isi...",
              },
            },
          ],
        }),
      });
      vi.stubGlobal("fetch", mockFetch);

      const article = await runWriter(
        "Sapiens",
        "Yuval Noah Harari",
        "Outline data",
        "https://tokopedia.link/book123",
        "sk-test-key"
      );

      expect(article).toContain("Sapiens Review");
      const requestPayload = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(requestPayload.messages[0].content).toContain("https://tokopedia.link/book123");
    });

    it("should throw error if writer agent fails", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
      });
      vi.stubGlobal("fetch", mockFetch);

      await expect(
        runWriter("Book", "Author", "Outline", undefined, "sk-test-key")
      ).rejects.toThrow("Writer agent failed to respond.");
    });
  });

  describe("runPodcaster()", () => {
    it("should throw error early without network call if apiKey is missing", async () => {
      const mockFetch = vi.fn();
      vi.stubGlobal("fetch", mockFetch);

      await expect(
        runPodcaster("AI Future", "Host", "Content...", "Notes", "MEDIUM", "")
      ).rejects.toThrow("OPENAI_API_KEY is required for podcast generator.");

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("should run through pipeline and return final synthesized script", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          choices: [
            {
              message: {
                content: "Halo semua! Selamat datang di AsikReview Podcast. <break time='1s'/> Hari ini kita akan membahas topik menarik.",
              },
            },
          ],
        }),
      });
      vi.stubGlobal("fetch", mockFetch);

      const script = await runPodcaster(
        "Atomic Habits",
        "Nanda",
        "Kebiasaan kecil setiap hari akan menghasilkan dampak besar.",
        "Fokus pada identitas",
        "SHORT",
        "sk-valid-key"
      );

      expect(script).toContain("AsikReview Podcast");
      expect(mockFetch).toHaveBeenCalled();
    });
  });
});
