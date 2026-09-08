import { describe, it, expect } from "vitest";
import { sanitizeHtml } from "@/lib/security/sanitize";

describe("HTML Sanitizer & XSS Defense", () => {
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

  it("should strip onerror and onload event handlers on images", () => {
    const imgXss = '<img src="invalid.jpg" onerror="alert(document.cookie)" onload="fetch(\'//evil.com\')" />';
    const cleaned = sanitizeHtml(imgXss);
    expect(cleaned).not.toContain("onerror");
    expect(cleaned).not.toContain("onload");
    expect(cleaned).not.toContain("alert");
    expect(cleaned).not.toContain("evil.com");
  });

  it("should strip javascript: URIs in anchor links", () => {
    const jsUri = '<a href="javascript:alert(\'pwned\')">Click Here</a>';
    const cleaned = sanitizeHtml(jsUri);
    expect(cleaned).not.toContain("javascript:");
    expect(cleaned).not.toContain("alert");
    expect(cleaned).toContain("Click Here");
  });

  it("should strip data:text/html URIs and only permit safe image data URIs", () => {
    const dataHtml = '<a href="data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==">Malicious Link</a>';
    const cleaned = sanitizeHtml(dataHtml);
    expect(cleaned).not.toContain("data:text/html");

    const safeDataImg = '<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" alt="dot" />';
    const cleanedImg = sanitizeHtml(safeDataImg);
    expect(cleanedImg).toContain("data:image/png;base64");
  });

  it("should strip nested scripts inside svg tags", () => {
    const svgScript = '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" /><script>alert(1)</script></svg>';
    const cleaned = sanitizeHtml(svgScript);
    expect(cleaned).not.toContain("<script>");
    expect(cleaned).not.toContain("alert");
    expect(cleaned).toContain("<circle");
  });

  it("should strip disallowed iframe and object tags", () => {
    const iframeHtml = '<iframe src="https://evil.com/phish"></iframe><object data="evil.swf"></object>';
    const cleaned = sanitizeHtml(iframeHtml);
    expect(cleaned).not.toContain("<iframe");
    expect(cleaned).not.toContain("<object");
  });

  it("should preserve harmless data attributes on elements", () => {
    const withDataAttr = '<div data-element-id="heading-1" data-canvas-type="text">Clean Heading</div>';
    const cleaned = sanitizeHtml(withDataAttr);
    expect(cleaned).toContain('data-element-id="heading-1"');
    expect(cleaned).toContain('Clean Heading');
  });

  it("should handle empty or null inputs gracefully", () => {
    expect(sanitizeHtml("")).toBe("");
  });
});
