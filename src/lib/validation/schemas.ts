import { z } from "zod";

/**
 * Zod validation schema for Article creation & updates
 */
export const ArticleInputSchema = z.object({
  title: z.string().min(1, "Judul buku wajib diisi").max(250, "Judul buku maksimal 250 karakter"),
  author: z.string().min(1, "Nama penulis wajib diisi").max(150, "Nama penulis maksimal 150 karakter"),
  notes: z.string().max(5000, "Catatan maksimal 5000 karakter").optional().nullable(),
  affiliateLink: z.string().url("Format link afiliasi tidak valid").optional().or(z.literal("")).nullable(),
  imageUrl: z.string().optional().nullable(),
  scheduledAt: z.string().datetime({ offset: true }).optional().or(z.string()).nullable(),
  knowledgeTagSlug: z.string().optional().nullable(),
  contentType: z.enum(["ARTICLE", "PODCAST"]).default("ARTICLE"),
  status: z.enum(["IDEATION", "DRAFTING", "DESIGNING", "READY", "PUBLISHED"]).optional(),
  markdownContent: z.string().optional().nullable(),
});

export type ArticleInput = z.infer<typeof ArticleInputSchema>;

/**
 * Zod validation schema for quick generation (/api/generate)
 */
export const QuickGenerateSchema = z.object({
  title: z.string().min(1, "Judul Buku wajib diisi"),
  author: z.string().min(1, "Penulis wajib diisi"),
  notes: z.string().optional().nullable(),
  affiliateLink: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
});

export type QuickGenerateInput = z.infer<typeof QuickGenerateSchema>;

/**
 * Zod validation schema for podcast generation (/api/podcast/generate)
 */
export const PodcastGenerateSchema = z.object({
  title: z.string().min(1, "Judul podcast wajib diisi"),
  author: z.string().min(1, "Host / Pengarang wajib diisi"),
  notes: z.string().optional().nullable(),
  articleId: z.string().optional().nullable(),
  knowledgeTagSlug: z.string().optional().nullable(),
  length: z.enum(["SHORT", "MEDIUM", "LONG"]).default("MEDIUM"),
});

export type PodcastGenerateInput = z.infer<typeof PodcastGenerateSchema>;

/**
 * Zod validation schema for Knowledge Base Tag creation
 */
export const KnowledgeTagSchema = z.object({
  title: z.string().min(1, "Judul materi wajib diisi"),
  slug: z.string().min(1, "Slug wajib diisi").regex(/^[a-z0-9-]+$/, "Slug hanya boleh huruf kecil, angka, dan strip"),
  category: z.string().min(1, "Kategori wajib diisi"),
  type: z.string().min(1, "Tipe wajib diisi"),
  writingStyle: z.enum(["santai-storytelling", "semi-formal-edukatif", "narasi-investigatif"]).default("santai-storytelling"),
  summary: z.string().optional(),
});

export type KnowledgeTagInput = z.infer<typeof KnowledgeTagSchema>;

/**
 * Zod validation schema for Knowledge Chapter creation
 */
export const KnowledgeChapterSchema = z.object({
  tagSlug: z.string().min(1, "Tag slug wajib diisi"),
  chapterNumber: z.number().int().positive("Nomor bab harus bilangan positif"),
  chapterTitle: z.string().min(1, "Judul bab wajib diisi"),
  originalContent: z.string().min(10, "Isi materi minimal 10 karakter"),
});

export type KnowledgeChapterInput = z.infer<typeof KnowledgeChapterSchema>;

/**
 * Zod validation schema for Banner creation & import
 */
export const BannerCreateSchema = z.object({
  name: z.string().min(1, "Nama banner wajib diisi"),
  format: z.enum(["MEDIUM", "INSTAGRAM"]),
  template: z.string().default("classic"),
  title: z.string().optional(),
  author: z.string().optional(),
  genre: z.string().optional(),
  badgeText: z.string().optional(),
  tags: z.string().optional(),
  imageUrl: z.string().optional(),
});

export const BannerImportAiSchema = z.object({
  type: z.enum(["image", "html"]),
  content: z.string().min(1, "Konten sumber wajib diisi"),
  format: z.enum(["MEDIUM", "INSTAGRAM"]),
});
