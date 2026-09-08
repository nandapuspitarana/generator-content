import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { runSocialCrawler } from "@/lib/services/crawler";
import prisma from "@/lib/prisma";

// Mock Prisma client
vi.mock("@/lib/prisma", () => {
  return {
    default: {
      socialTrend: {
        createMany: vi.fn(),
        findMany: vi.fn(),
      },
    },
  };
});

describe("Social Media Crawler Service", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    delete process.env.APIFY_TOKEN;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should return mock data when APIFY_TOKEN is not provided", async () => {
    const mockReturnedFromDb = [
      {
        id: "trend-1",
        platform: "FACEBOOK",
        keyword: "investasi",
        content: "Ada saran buku tentang investasi?",
        author: "Grup Facebook: Komunitas Buku Bisnis",
        sourceUrl: "https://facebook.com/groups/dummy/1",
        engagement: 45,
        createdAt: new Date(),
      },
      {
        id: "trend-2",
        platform: "LINKEDIN",
        keyword: "investasi",
        content: "Mencari buku yang membahas investasi secara mendalam.",
        author: "Budi Santoso",
        sourceUrl: "https://linkedin.com/posts/dummy/2",
        engagement: 120,
        createdAt: new Date(),
      },
    ];

    vi.mocked(prisma.socialTrend.createMany).mockResolvedValue({ count: 3 });
    vi.mocked(prisma.socialTrend.findMany).mockResolvedValue(mockReturnedFromDb as any);

    const trends = await runSocialCrawler("investasi");

    expect(trends.length).toBe(2);
    expect(prisma.socialTrend.createMany).toHaveBeenCalledTimes(1);
    
    // Check batch insertion call
    const createManyCall = vi.mocked(prisma.socialTrend.createMany).mock.calls[0][0];
    expect(createManyCall?.data).toHaveLength(3);

    // Verify keyword injection across items
    (createManyCall?.data as any[]).forEach((item: any) => {
      expect(item.keyword).toBe("investasi");
      expect(item.content).toContain("investasi");
      expect(typeof item.engagement).toBe("number");
      expect(item.engagement).toBeGreaterThanOrEqual(0);
    });
  });

  it("should throw error when APIFY_TOKEN is set because Actor ID requires manual configuration", async () => {
    process.env.APIFY_TOKEN = "apify_sec_test_token";

    await expect(runSocialCrawler("startup")).rejects.toThrow(
      "Implementasi Actor Apify spesifik belum diisi."
    );
    expect(prisma.socialTrend.createMany).not.toHaveBeenCalled();
  });

  it("should verify engagement numbers in crawled records are strictly positive numbers", async () => {
    vi.mocked(prisma.socialTrend.createMany).mockResolvedValue({ count: 3 });
    vi.mocked(prisma.socialTrend.findMany).mockResolvedValue([]);

    await runSocialCrawler("leadership");

    const createManyArgs = vi.mocked(prisma.socialTrend.createMany).mock.calls[0][0];
    const items = createManyArgs?.data as any[];

    expect(items.length).toBeGreaterThan(0);
    items.forEach((item) => {
      expect(Number.isFinite(item.engagement)).toBe(true);
      expect(item.engagement).toBeGreaterThan(0);
      expect(Number.isInteger(item.engagement)).toBe(true);
    });
  });

  it("should perform batch insertion (createMany) rather than serial loop", async () => {
    vi.mocked(prisma.socialTrend.createMany).mockResolvedValue({ count: 3 });
    vi.mocked(prisma.socialTrend.findMany).mockResolvedValue([]);

    await runSocialCrawler("self-improvement");

    expect(prisma.socialTrend.createMany).toHaveBeenCalledTimes(1);
  });
});
