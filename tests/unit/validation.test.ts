import { describe, it, expect } from "vitest";
import {
  ArticleInputSchema,
  QuickGenerateSchema,
  PodcastGenerateSchema,
  KnowledgeTagSchema,
  BannerCreateSchema,
  MediumSyncSchema,
  MediumBatchSyncSchema,
} from "@/lib/validation/schemas";

describe("Zod Validation Schemas", () => {
  describe("ArticleInputSchema", () => {
    it("should accept valid article data", () => {
      const validData = {
        title: "The Intelligent Investor",
        author: "Benjamin Graham",
        notes: "Key notes about value investing",
        affiliateLink: "https://example.com/book",
        contentType: "ARTICLE",
      };
      const result = ArticleInputSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should reject empty title", () => {
      const invalidData = {
        title: "",
        author: "Benjamin Graham",
      };
      const result = ArticleInputSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Judul buku wajib diisi");
      }
    });

    it("should reject invalid affiliate URL", () => {
      const invalidData = {
        title: "Test Book",
        author: "Test Author",
        affiliateLink: "not-a-valid-url",
      };
      const result = ArticleInputSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe("QuickGenerateSchema", () => {
    it("should accept valid quick generate request", () => {
      const data = {
        title: "Atomic Habits",
        author: "James Clear",
        notes: "1% improvements",
      };
      const result = QuickGenerateSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should reject missing author", () => {
      const data = {
        title: "Atomic Habits",
        author: "",
      };
      const result = QuickGenerateSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe("PodcastGenerateSchema", () => {
    it("should accept valid podcast request with custom duration", () => {
      const data = {
        title: "Deep Work Masterclass",
        author: "Cal Newport",
        length: "LONG",
      };
      const result = PodcastGenerateSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.length).toBe("LONG");
      }
    });
  });

  describe("KnowledgeTagSchema", () => {
    it("should validate proper slug format", () => {
      const valid = {
        title: "Zero to One",
        slug: "bisnis-buku-zero-to-one",
        category: "bisnis",
        type: "buku",
        writingStyle: "santai-storytelling",
      };
      expect(KnowledgeTagSchema.safeParse(valid).success).toBe(true);

      const invalid = {
        ...valid,
        slug: "INVALID SLUG WITH SPACES",
      };
      expect(KnowledgeTagSchema.safeParse(invalid).success).toBe(false);
    });
  });

  describe("BannerCreateSchema", () => {
    it("should validate banner creation format", () => {
      const valid = {
        name: "Medium Review Banner",
        format: "MEDIUM",
        template: "classic",
      };
      expect(BannerCreateSchema.safeParse(valid).success).toBe(true);
    });
  });

  describe("MediumSyncSchema", () => {
    it("should validate valid single article sync options", () => {
      const valid = {
        articleId: "art-12345",
        publishStatus: "draft",
        tags: ["book-review", "reading"],
        canonicalUrl: "https://asikreview.com/stories/1",
      };
      const result = MediumSyncSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should reject sync with empty articleId", () => {
      const invalid = {
        articleId: "",
        publishStatus: "draft",
      };
      const result = MediumSyncSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("should reject more than 5 tags", () => {
      const invalid = {
        articleId: "art-12345",
        tags: ["one", "two", "three", "four", "five", "six"],
      };
      const result = MediumSyncSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("MediumBatchSyncSchema", () => {
    it("should validate batch sync with array of ids", () => {
      const valid = {
        articleIds: ["id-1", "id-2"],
        publishStatus: "public",
        tags: ["tech", "startup"],
      };
      const result = MediumBatchSyncSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should reject batch sync with empty array", () => {
      const invalid = {
        articleIds: [],
        publishStatus: "draft",
      };
      const result = MediumBatchSyncSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });
});
