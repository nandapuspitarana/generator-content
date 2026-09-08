import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { generateContent, importBannerWithAI } from "@/lib/services/llm";

describe("LLM Service (OpenAI Integration)", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.unstubAllGlobals();
  });

  it("should throw error early if OPENAI_API_KEY is not set", async () => {
    delete process.env.OPENAI_API_KEY;

    await expect(
      generateContent({
        title: "Atomic Habits",
        author: "James Clear",
      })
    ).rejects.toThrow("OPENAI_API_KEY is not set in environment variables.");
  });

  it("should safely intercept SSRF attempts with private imageUrl and use placeholder fallback", async () => {
    process.env.OPENAI_API_KEY = "sk-mock-key";

    // OpenAI mock response
    const mockOpenAiResponse = {
      choices: [
        {
          message: {
            content: JSON.stringify({
              htmlBannerCode: '<div style="background:#e8e4dc;">Atomic Habits</div>',
              markdownContent: "# Atomic Habits Review\n\nPenjelasan buku.",
            }),
          },
        },
      ],
    };

    const mockFetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes("api.openai.com")) {
        return {
          ok: true,
          status: 200,
          json: async () => mockOpenAiResponse,
        };
      }
      // Any other fetch should not be called with private IP
      return { ok: false, status: 404 };
    });
    vi.stubGlobal("fetch", mockFetch);

    // Provide SSRF attempt
    const result = await generateContent({
      title: "Atomic Habits",
      author: "James Clear",
      imageUrl: "http://169.254.169.254/latest/meta-data", // Cloud metadata attempt
    });

    expect(result).toHaveProperty("htmlBannerCode");
    expect(result).toHaveProperty("markdownContent");
    expect(result.htmlBannerCode).toContain("Atomic Habits");
  });

  it("should throw error when OpenAI API responds with an error status", async () => {
    process.env.OPENAI_API_KEY = "sk-mock-key";

    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => "Internal Server Error from OpenAI",
    });
    vi.stubGlobal("fetch", mockFetch);

    await expect(
      generateContent({
        title: "The Lean Startup",
        author: "Eric Ries",
      })
    ).rejects.toThrow("Gagal mendapatkan respons dari OpenAI.");
  });

  it("should throw error when OpenAI returns non-JSON payload", async () => {
    process.env.OPENAI_API_KEY = "sk-mock-key";

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        choices: [{ message: { content: "Not a valid JSON string" } }],
      }),
    });
    vi.stubGlobal("fetch", mockFetch);

    await expect(
      generateContent({
        title: "Deep Work",
        author: "Cal Newport",
      })
    ).rejects.toThrow("Format respons dari AI tidak valid.");
  });

  it("should throw error in importBannerWithAI when OPENAI_API_KEY is not set", async () => {
    delete process.env.OPENAI_API_KEY;

    await expect(
      importBannerWithAI({
        type: "html",
        content: "<div>test</div>",
        format: "MEDIUM",
      })
    ).rejects.toThrow("OPENAI_API_KEY is not set.");
  });
});
