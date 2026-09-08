import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { isPrivateIpOrHost, validateSafeUrl, fetchSafeImage } from "@/lib/security/url-guard";

describe("URL Guard & SSRF Protection", () => {
  describe("isPrivateIpOrHost()", () => {
    it("should identify local loopback hostnames and IPs as private", () => {
      expect(isPrivateIpOrHost("localhost")).toBe(true);
      expect(isPrivateIpOrHost("127.0.0.1")).toBe(true);
      expect(isPrivateIpOrHost("127.0.0.53")).toBe(true);
      expect(isPrivateIpOrHost("0.0.0.0")).toBe(true);
      expect(isPrivateIpOrHost("::1")).toBe(true);
      expect(isPrivateIpOrHost("[::1]")).toBe(true);
      expect(isPrivateIpOrHost("app.local")).toBe(true);
      expect(isPrivateIpOrHost("dev.localhost")).toBe(true);
    });

    it("should block cloud provider metadata endpoints", () => {
      expect(isPrivateIpOrHost("169.254.169.254")).toBe(true);
      expect(isPrivateIpOrHost("169.254.1.1")).toBe(true);
      expect(isPrivateIpOrHost("metadata.google.internal")).toBe(true);
      expect(isPrivateIpOrHost("metadata.google")).toBe(true);
      expect(isPrivateIpOrHost("100.100.100.200")).toBe(true);
    });

    it("should block RFC 1918 private IPv4 networks", () => {
      // 10.0.0.0/8
      expect(isPrivateIpOrHost("10.0.0.1")).toBe(true);
      expect(isPrivateIpOrHost("10.254.0.1")).toBe(true);

      // 192.168.0.0/16
      expect(isPrivateIpOrHost("192.168.1.1")).toBe(true);
      expect(isPrivateIpOrHost("192.168.100.20")).toBe(true);

      // 172.16.0.0/12
      expect(isPrivateIpOrHost("172.16.0.1")).toBe(true);
      expect(isPrivateIpOrHost("172.25.1.1")).toBe(true);
      expect(isPrivateIpOrHost("172.31.255.255")).toBe(true);
    });

    it("should allow legitimate public hosts and public IPs", () => {
      expect(isPrivateIpOrHost("example.com")).toBe(false);
      expect(isPrivateIpOrHost("images.unsplash.com")).toBe(false);
      expect(isPrivateIpOrHost("api.medium.com")).toBe(false);
      expect(isPrivateIpOrHost("8.8.8.8")).toBe(false);
      expect(isPrivateIpOrHost("1.1.1.1")).toBe(false);
      expect(isPrivateIpOrHost("172.32.0.1")).toBe(false); // Outside 172.16-31
    });
  });

  describe("validateSafeUrl()", () => {
    it("should reject empty or non-string URLs", () => {
      expect(validateSafeUrl("").isValid).toBe(false);
      expect(validateSafeUrl(null as any).isValid).toBe(false);
    });

    it("should reject non-HTTP protocols (ftp, file, gopher, javascript)", () => {
      expect(validateSafeUrl("ftp://files.example.com/test.png").isValid).toBe(false);
      expect(validateSafeUrl("file:///etc/passwd").isValid).toBe(false);
      expect(validateSafeUrl("javascript:alert(1)").isValid).toBe(false);
    });

    it("should reject URLs targeting private or loopback destinations", () => {
      const loopback = validateSafeUrl("http://localhost:3000/secret");
      expect(loopback.isValid).toBe(false);
      expect(loopback.error).toContain("forbidden");

      const metadata = validateSafeUrl("http://169.254.169.254/latest/meta-data");
      expect(metadata.isValid).toBe(false);

      const privateIp = validateSafeUrl("http://10.0.1.5:8080/internal");
      expect(privateIp.isValid).toBe(false);
    });

    it("should accept valid public HTTPS and HTTP URLs", () => {
      const publicHttps = validateSafeUrl("https://images.unsplash.com/photo-12345");
      expect(publicHttps.isValid).toBe(true);
      expect(publicHttps.url?.hostname).toBe("images.unsplash.com");

      const publicHttp = validateSafeUrl("http://books.google.com/covers/front.jpg");
      expect(publicHttp.isValid).toBe(true);
    });
  });

  describe("fetchSafeImage()", () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it("should reject unsafe private URL before making any network call", async () => {
      await expect(
        fetchSafeImage("http://127.0.0.1:8080/admin")
      ).rejects.toThrow(/forbidden|Unsafe URL/i);
    });

    it("should reject responses with non-image Content-Type", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({
          "content-type": "application/json",
        }),
        arrayBuffer: async () => new ArrayBuffer(100),
      });
      vi.stubGlobal("fetch", mockFetch);

      await expect(
        fetchSafeImage("https://example.com/data.json")
      ).rejects.toThrow(/not an image/i);
    });

    it("should reject responses exceeding the maximum size limit", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({
          "content-type": "image/jpeg",
          "content-length": "10000000", // ~10MB
        }),
        arrayBuffer: async () => new ArrayBuffer(10000000),
      });
      vi.stubGlobal("fetch", mockFetch);

      // Limit to 1MB (1024 * 1024)
      await expect(
        fetchSafeImage("https://example.com/huge.jpg", 1024 * 1024)
      ).rejects.toThrow(/exceeds maximum limit/i);
    });

    it("should successfully return buffer and content-type for valid safe image", async () => {
      const dummyBuffer = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]).buffer; // JPEG magic header
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({
          "content-type": "image/jpeg",
          "content-length": "4",
        }),
        arrayBuffer: async () => dummyBuffer,
      });
      vi.stubGlobal("fetch", mockFetch);

      const result = await fetchSafeImage("https://example.com/cover.jpg", 1024 * 1024);
      expect(result.contentType).toBe("image/jpeg");
      expect(result.buffer.length).toBe(4);
    });
  });
});
