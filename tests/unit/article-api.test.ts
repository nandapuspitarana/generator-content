import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "@/app/api/articles/route";
import { PUT, DELETE } from "@/app/api/articles/[id]/route";
import prisma from "@/lib/prisma";

// Mock Prisma
vi.mock("@/lib/prisma", () => {
  return {
    default: {
      article: {
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
    },
  };
});

describe("Article API Route Handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/articles", () => {
    it("should return a list of articles sorted by createdAt desc", async () => {
      const mockArticles = [
        { id: "1", title: "Book One", author: "Author One", createdAt: new Date() },
        { id: "2", title: "Book Two", author: "Author Two", createdAt: new Date() },
      ];
      vi.mocked(prisma.article.findMany).mockResolvedValue(mockArticles as any);

      const response = await GET();
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveLength(2);
      expect(data[0].title).toBe("Book One");
      expect(prisma.article.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: "desc" },
      });
    });

    it("should return 500 if database query fails", async () => {
      vi.mocked(prisma.article.findMany).mockRejectedValue(new Error("DB Timeout"));

      const response = await GET();
      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe("Failed to fetch articles");
    });
  });

  describe("POST /api/articles", () => {
    it("should create an article and return 201 on valid input", async () => {
      const createdRecord = {
        id: "art-new",
        title: "Clean Code",
        author: "Robert C. Martin",
        notes: "Solid design principles",
        status: "IDEATION",
        contentType: "ARTICLE",
      };
      vi.mocked(prisma.article.create).mockResolvedValue(createdRecord as any);

      const request = new Request("http://localhost:3000/api/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Clean Code",
          author: "Robert C. Martin",
          notes: "Solid design principles",
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(201);

      const data = await response.json();
      expect(data.id).toBe("art-new");
      expect(data.title).toBe("Clean Code");
      expect(prisma.article.create).toHaveBeenCalledTimes(1);
    });

    it("should return 400 with validation error when title is empty", async () => {
      const request = new Request("http://localhost:3000/api/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "",
          author: "Robert C. Martin",
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toContain("Judul buku wajib diisi");
      expect(prisma.article.create).not.toHaveBeenCalled();
    });

    it("should return 400 when author is empty", async () => {
      const request = new Request("http://localhost:3000/api/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "The Pragmatic Programmer",
          author: "",
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toContain("Nama penulis wajib diisi");
      expect(prisma.article.create).not.toHaveBeenCalled();
    });

    it("should safely handle SQL injection strings in title through Prisma ORM", async () => {
      const sqlInjectionPayload = "'; DROP TABLE Article; --";
      const createdRecord = {
        id: "art-sql",
        title: sqlInjectionPayload,
        author: "Hacker",
        status: "IDEATION",
      };
      vi.mocked(prisma.article.create).mockResolvedValue(createdRecord as any);

      const request = new Request("http://localhost:3000/api/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: sqlInjectionPayload,
          author: "Hacker",
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(201);
      expect(prisma.article.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: sqlInjectionPayload,
          }),
        })
      );
    });

    it("should accept notes containing raw HTML / XSS without executing or corrupting", async () => {
      const xssPayload = '<script>alert("hack")</script>';
      vi.mocked(prisma.article.create).mockResolvedValue({ id: "art-xss" } as any);

      const request = new Request("http://localhost:3000/api/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Security Guide",
          author: "SecOps",
          notes: xssPayload,
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(201);
      expect(prisma.article.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            notes: xssPayload,
          }),
        })
      );
    });
  });

  describe("PUT & DELETE /api/articles/[id]", () => {
    it("should update article status and markdown content", async () => {
      const updatedRecord = {
        id: "art-1",
        title: "Updated Title",
        status: "PUBLISHED",
      };
      vi.mocked(prisma.article.update).mockResolvedValue(updatedRecord as any);

      const request = new Request("http://localhost:3000/api/articles/art-1", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Updated Title",
          status: "PUBLISHED",
        }),
      });

      const response = await PUT(request, { params: Promise.resolve({ id: "art-1" }) });
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.status).toBe("PUBLISHED");
      expect(prisma.article.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "art-1" },
        })
      );
    });

    it("should return 500 when updating non-existent article", async () => {
      vi.mocked(prisma.article.update).mockRejectedValue(new Error("Record to update not found"));

      const request = new Request("http://localhost:3000/api/articles/non-existent", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "New Title" }),
      });

      const response = await PUT(request, { params: Promise.resolve({ id: "non-existent" }) });
      expect(response.status).toBe(500);

      const data = await response.json();
      expect(data.error).toContain("Gagal menyimpan artikel");
    });

    it("should delete article and return success", async () => {
      vi.mocked(prisma.article.delete).mockResolvedValue({ id: "art-1" } as any);

      const request = new Request("http://localhost:3000/api/articles/art-1", {
        method: "DELETE",
      });

      const response = await DELETE(request, { params: Promise.resolve({ id: "art-1" }) });
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(prisma.article.delete).toHaveBeenCalledWith({ where: { id: "art-1" } });
    });
  });
});
