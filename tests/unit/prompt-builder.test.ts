import { describe, it, expect } from "vitest";
import { buildBannerPrompt, buildInstagramCaptionPrompt, buildInstagramCarouselPrompt, buildPrompt } from "@/lib/utils/promptBuilder";
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

  it("should build Instagram caption prompt with storytelling hook", () => {
    const prompt = buildInstagramCaptionPrompt(mockTag, mockChapters, "gpt");
    expect(prompt).toContain("Atomic Habits");
    expect(prompt).toContain("ngobrol santai");
    expect(prompt).toContain("Call-to-Action");
  });

  it("should build Instagram carousel prompt with slide breakdown", () => {
    const prompt = buildInstagramCarouselPrompt(mockTag, mockChapters, "gemini");
    expect(prompt).toContain("Slide 1");
    expect(prompt).toContain("Atomic Habits");
  });

  it("should correctly route through buildPrompt dispatcher", () => {
    const banner = buildPrompt("banner", mockTag, mockChapters, "gpt");
    expect(banner).toContain("16:9");

    const ig = buildPrompt("ig-caption", mockTag, mockChapters, "gpt");
    expect(ig).toContain("Instagram");
  });
});
