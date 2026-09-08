import { describe, it, expect } from "vitest";
import { chunkText } from "@/lib/services/agents/podcaster";

describe("Text Chunking Algorithms", () => {
  it("should return single chunk if text is smaller than limit", () => {
    const text = "Short paragraph of book content.";
    const chunks = chunkText(text, 100);
    expect(chunks.length).toBe(1);
    expect(chunks[0]).toBe(text);
  });

  it("should return single chunk containing empty string for empty input", () => {
    const chunks = chunkText("", 100);
    expect(chunks.length).toBe(1);
    expect(chunks[0]).toBe("");
  });

  it("should return exactly 1 chunk when text length equals maxLength (exact boundary)", () => {
    const exactText = "A".repeat(50);
    const chunks = chunkText(exactText, 50);
    expect(chunks.length).toBe(1);
    expect(chunks[0]).toBe(exactText);
  });

  it("should break text into paragraphs at double newlines", () => {
    const p1 = "This is paragraph 1 with some content.";
    const p2 = "This is paragraph 2 with other details.";
    const text = `${p1}\n\n${p2}`;
    
    const chunks = chunkText(text, 45);
    expect(chunks.length).toBe(2);
    expect(chunks[0].trim()).toBe(p1);
    expect(chunks[1].trim()).toBe(p2);
  });

  it("should fall back to single newline if double newline is not within chunk limit", () => {
    const line1 = "First sentence of the section.";
    const line2 = "Second sentence on new line.";
    const text = `${line1}\n${line2}`;

    const chunks = chunkText(text, 35);
    expect(chunks.length).toBe(2);
    expect(chunks.join("")).toBe(text);
  });

  it("should force break at maxLength if no newlines exist", () => {
    const continuousText = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    const chunks = chunkText(continuousText, 10);
    expect(chunks.length).toBe(6);
    expect(chunks.join("")).toBe(continuousText);
  });

  it("should handle large multi-thousand character payloads without losing data or overlapping", () => {
    const paragraphs = Array.from({ length: 20 }, (_, i) => `Paragraph ${i + 1}: ${"Word ".repeat(50)}`);
    const fullText = paragraphs.join("\n\n");

    const chunks = chunkText(fullText, 500);
    expect(chunks.length).toBeGreaterThan(1);
    
    // Total reconstructed length should match original text exactly without loss or duplication
    const reconstructed = chunks.join("");
    expect(reconstructed.length).toBe(fullText.length);
    expect(reconstructed).toBe(fullText);
  });

  it("should handle custom small maxLength like 15 correctly", () => {
    const text = "Alpha Beta Gamma Delta Epsilon Zeta";
    const chunks = chunkText(text, 15);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.join("")).toBe(text);
  });
});
