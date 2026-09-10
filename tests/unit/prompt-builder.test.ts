import { describe, it, expect } from "vitest";
import {
  buildBannerPrompt,
  buildInstagramCaptionPrompt,
  buildInstagramCarouselPrompt,
  buildPodcastScriptPrompt,
  buildPrompt,
  VOCAL_EXPRESSION_TAGS,
} from "@/lib/utils/promptBuilder";
import { KnowledgeTag, KnowledgeChapter } from "@/lib/types/models";

describe("Prompt Builder Utilities", () => {
  const mockTag: KnowledgeTag = {
    id: "1",
    slug: "bisnis-buku-atomic-habits",
    category: "bisnis",
    type: "buku",
    title: "Atomic Habits",
    summary: "- Perubahan 1% setiap hari\n- Sistem lebih penting daripada goals\n- Bentuk identitas baru",
    writingStyle: "santai-storytelling",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockChapters: KnowledgeChapter[] = [
    {
      id: "c1",
      tagSlug: "bisnis-buku-atomic-habits",
      chapterNumber: 1,
      chapterTitle: "The Fundamentals",
      originalContent: "Small habits make a big difference over time.",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  ];

  it("should build banner prompt with book title and category", () => {
    const prompt = buildBannerPrompt(mockTag, mockChapters, "gpt");
    expect(prompt).toContain("Atomic Habits");
    expect(prompt).toContain("bisnis");
    expect(prompt).toContain("16:9");
  });

  it("should use fallback points if tag has no summary in banner prompt", () => {
    const tagWithoutSummary: KnowledgeTag = { ...mockTag, summary: undefined };
    const prompt = buildBannerPrompt(tagWithoutSummary, mockChapters, "gpt");
    expect(prompt).toContain("- Poin 1\n- Poin 2\n- Poin 3");
  });

  it("should build Instagram caption prompt with storytelling hook", () => {
    const prompt = buildInstagramCaptionPrompt(mockTag, mockChapters, "gpt");
    expect(prompt).toContain("Atomic Habits");
    expect(prompt).toContain("ngobrol santai");
    expect(prompt).toContain("Call-to-Action");
  });

  it("should build Instagram caption with investigative hook for narasi-investigatif style", () => {
    const investigativeTag: KnowledgeTag = { ...mockTag, writingStyle: "narasi-investigatif" };
    const prompt = buildInstagramCaptionPrompt(investigativeTag, mockChapters, "gpt");
    expect(prompt).toContain("misterius, memancing rasa ingin tahu");
  });

  it("should build Instagram caption with informative hook for semi-formal-edukatif style", () => {
    const edukatifTag: KnowledgeTag = { ...mockTag, writingStyle: "semi-formal-edukatif" };
    const prompt = buildInstagramCaptionPrompt(edukatifTag, mockChapters, "gpt");
    expect(prompt).toContain("informatif, jelas, dan edukatif");
  });

  it("should truncate long summaries to 500 characters in carousel prompt", () => {
    const longSummaryTag: KnowledgeTag = {
      ...mockTag,
      summary: "Word ".repeat(150), // 750 chars
    };
    const prompt = buildInstagramCarouselPrompt(longSummaryTag, mockChapters, "gemini");
    expect(prompt).toContain("...");
    expect(prompt).not.toContain("Word ".repeat(150));
  });

  it("should handle tag without summary in carousel prompt gracefully", () => {
    const emptySummaryTag: KnowledgeTag = { ...mockTag, summary: undefined };
    const prompt = buildInstagramCarouselPrompt(emptySummaryTag, mockChapters, "gpt");
    expect(prompt).toContain("Belum ada ringkasan.");
  });

  it("should format platform instruction differently for gemini vs gpt", () => {
    const gptPrompt = buildBannerPrompt(mockTag, mockChapters, "gpt");
    const geminiPrompt = buildBannerPrompt(mockTag, mockChapters, "gemini");
    expect(gptPrompt).toContain("tanpa teks penjelasan tambahan");
    expect(geminiPrompt).toContain("tanpa pembukaan kata-kata basa-basi");
  });

  it("should build Instagram carousel prompt with slide breakdown", () => {
    const prompt = buildInstagramCarouselPrompt(mockTag, mockChapters, "gemini");
    expect(prompt).toContain("Slide 1");
    expect(prompt).toContain("Atomic Habits");
  });

  it("should verify VOCAL_EXPRESSION_TAGS contains all 34 required vocal expression tags", () => {
    expect(VOCAL_EXPRESSION_TAGS).toHaveLength(34);
    const tagList = VOCAL_EXPRESSION_TAGS.map((t) => t.tag);

    const requiredTags = [
      "[pause]", "[emphasis]", "[laughing]", "[inhale]", "[chuckle]", "[tsk]", "[singing]", "[excited]",
      "[laughing tone]", "[interrupting]", "[chuckling]", "[excited tone]", "[volume up]", "[echo]",
      "[angry]", "[low volume]", "[sigh]", "[low voice]", "[whisper]", "[screaming]", "[shouting]",
      "[loud]", "[surprised]", "[short pause]", "[exhale]", "[delight]", "[panting]", "[audience laughter]",
      "[with strong accent]", "[volume down]", "[clearing throat]", "[sad]", "[moaning]", "[shocked]",
    ];

    requiredTags.forEach((tag) => {
      expect(tagList).toContain(tag);
    });
  });

  it("should build podcast script prompt with vocal tags instructions", () => {
    const prompt = buildPodcastScriptPrompt(mockTag, mockChapters, "gpt");
    expect(prompt).toContain("Atomic Habits");
    expect(prompt).toContain("[pause]");
    expect(prompt).toContain("[laughing]");
    expect(prompt).toContain("[whisper]");
    expect(prompt).toContain("[excited]");
  });

  it("should correctly route through buildPrompt dispatcher", () => {
    const banner = buildPrompt("banner", mockTag, mockChapters, "gpt");
    expect(banner).toContain("16:9");

    const ig = buildPrompt("ig-caption", mockTag, mockChapters, "gpt");
    expect(ig).toContain("Instagram");

    const carousel = buildPrompt("ig-carousel", mockTag, mockChapters, "gpt");
    expect(carousel).toContain("Slide 1");

    const podcast = buildPrompt("podcast-script", mockTag, mockChapters, "gpt");
    expect(podcast).toContain("[pause]");

    // Unknown type returns empty string
    const unknown = buildPrompt("unknown" as any, mockTag, mockChapters, "gpt");
    expect(unknown).toBe("");
  });
});
