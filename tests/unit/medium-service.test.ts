import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getMediumProfile,
  getMediumPublications,
  publishToMedium,
} from "@/lib/services/medium";

describe("Medium Service Integration", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("getMediumProfile()", () => {
    it("should return user profile on successful response", async () => {
      const mockProfileData = {
        data: {
          id: "med-user-123",
          username: "asikreview",
          name: "AsikReview Editorial",
          url: "https://medium.com/@asikreview",
          imageUrl: "https://medium.com/avatar.jpg",
        },
      };

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockProfileData,
      });
      vi.stubGlobal("fetch", mockFetch);

      const profile = await getMediumProfile("test-token-xyz");
      expect(profile.id).toBe("med-user-123");
      expect(profile.username).toBe("asikreview");
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.medium.com/v1/me",
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer test-token-xyz",
          }),
        })
      );
    });

    it("should throw friendly error when authentication fails (401 Unauthorized)", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => "The token provided is invalid or expired.",
      });
      vi.stubGlobal("fetch", mockFetch);

      await expect(getMediumProfile("invalid-token")).rejects.toThrow(
        /Gagal otentikasi Medium/i
      );
    });
  });

  describe("getMediumPublications()", () => {
    it("should return publications array on success", async () => {
      const mockPubs = {
        data: [
          {
            id: "pub-01",
            name: "AsikReview Magazine",
            url: "https://medium.com/asikreview-mag",
          },
        ],
      };

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockPubs,
      });
      vi.stubGlobal("fetch", mockFetch);

      const pubs = await getMediumPublications("test-token", "med-user-123");
      expect(pubs.length).toBe(1);
      expect(pubs[0].name).toBe("AsikReview Magazine");
    });

    it("should gracefully return empty array if fetch fails", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => "Internal Server Error",
      });
      vi.stubGlobal("fetch", mockFetch);

      const pubs = await getMediumPublications("test-token", "med-user-123");
      expect(pubs).toEqual([]);
    });

    it("should gracefully return empty array on network exception", async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error("Network disconnect"));
      vi.stubGlobal("fetch", mockFetch);

      const pubs = await getMediumPublications("test-token", "med-user-123");
      expect(pubs).toEqual([]);
    });
  });

  describe("publishToMedium()", () => {
    it("should throw error if integration token is empty", async () => {
      await expect(
        publishToMedium({
          title: "Book Review",
          content: "Review content",
          token: "",
        })
      ).rejects.toThrow("Medium Integration Token wajib diisi.");
    });

    it("should support legacy signature (title, markdown, token)", async () => {
      const mockFetch = vi.fn()
        // 1st call for getMediumUserId
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            data: { id: "user-456", username: "user456" },
          }),
        })
        // 2nd call for publish
        .mockResolvedValueOnce({
          ok: true,
          status: 201,
          json: async () => ({
            data: { url: "https://medium.com/@user456/legacy-post" },
          }),
        });

      vi.stubGlobal("fetch", mockFetch);

      const postUrl = await publishToMedium(
        "Legacy Title",
        "# Legacy Review Content",
        "legacy-secret-token"
      );

      expect(postUrl).toBe("https://medium.com/@user456/legacy-post");
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("should publish directly to publication endpoint when publicationId is provided", async () => {
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({
          data: { url: "https://medium.com/pub-123/new-story" },
        }),
      });

      vi.stubGlobal("fetch", mockFetch);

      const postUrl = await publishToMedium({
        title: "Publication Article",
        content: "Story in publication",
        token: "pub-token",
        publicationId: "pub-target-999",
        canonicalUrl: "https://asikreview.com/stories/999",
        tags: ["Business", "Non-Fiction", "Self-Help"],
      });

      expect(postUrl).toBe("https://medium.com/pub-123/new-story");
      // Must NOT fetch user profile because publicationId is supplied directly
      expect(mockFetch).toHaveBeenCalledTimes(1);

      const [calledUrl, calledOptions] = mockFetch.mock.calls[0];
      expect(calledUrl).toBe("https://api.medium.com/v1/publications/pub-target-999/posts");
      
      const sentPayload = JSON.parse(calledOptions.body);
      expect(sentPayload.canonicalUrl).toBe("https://asikreview.com/stories/999");
      expect(sentPayload.tags).toEqual(["business", "non-fiction", "self-help"]);
    });

    it("should slice tags to maximum of 5 and sanitize special characters", async () => {
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({
          data: { url: "https://medium.com/pub/story" },
        }),
      });

      vi.stubGlobal("fetch", mockFetch);

      await publishToMedium({
        title: "Tags Test",
        content: "Content",
        token: "tok",
        publicationId: "pub-1",
        tags: [
          "TAG ONE!",
          "Tag TWO@Special",
          "tag-three",
          "TAG FOUR",
          "tag FIVE",
          "TAG SIX SHOULD BE SLICED OUT",
          "TAG SEVEN",
        ],
      });

      const calledOptions = mockFetch.mock.calls[0][1];
      const sentPayload = JSON.parse(calledOptions.body);

      expect(sentPayload.tags.length).toBe(5);
      expect(sentPayload.tags[0]).toBe("tag-one-");
      expect(sentPayload.tags[1]).toBe("tag-two-special");
      expect(sentPayload.tags[2]).toBe("tag-three");
      expect(sentPayload.tags[3]).toBe("tag-four");
      expect(sentPayload.tags[4]).toBe("tag-five");
    });
  });
});
