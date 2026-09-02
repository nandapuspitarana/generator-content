import { describe, it, expect } from "vitest";
import { sanitizeHtml } from "@/lib/security/sanitize";

describe("HTML Sanitizer", () => {
  it("should preserve safe banner HTML with inline styles", () => {
    const rawHtml = '<div style="width:100%;aspect-ratio:16/9;background:#e8e4dc;"><span style="font-weight:700;">Atomic Habits</span></div>';
    const cleaned = sanitizeHtml(rawHtml);
    expect(cleaned).toContain("Atomic Habits");
    expect(cleaned).toContain("aspect-ratio:16/9");
  });

  it("should strip dangerous script tags and event handlers", () => {
    const maliciousHtml = '<div onclick="alert(1)">Title</div><script>alert("xss")</script>';
    const cleaned = sanitizeHtml(maliciousHtml);
    expect(cleaned).not.toContain("<script>");
    expect(cleaned).not.toContain("alert");
    expect(cleaned).not.toContain("onclick");
    expect(cleaned).toContain("Title");
  });

  it("should handle empty or null inputs gracefully", () => {
    expect(sanitizeHtml("")).toBe("");
  });
});
