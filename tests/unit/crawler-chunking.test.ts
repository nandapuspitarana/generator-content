import { describe, it, expect } from "vitest";
import { chunkText } from "@/lib/services/agents/podcaster";

describe("Text Chunking Algorithms", () => {
  it("should return single chunk if text is smaller than limit", () => {
    const text = "Short paragraph of book content.";
    const chunks = chunkText(text, 100);
    expect(chunks.length).toBe(1);
    expect(chunks[0]).toBe(text);
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

  it("should handle large multi-thousand character payloads without losing data", () => {
    const paragraphs = Array.from({ length: 20 }, (_, i) => `Paragraph ${i + 1}: ${"Word ".repeat(50)}`);
    const fullText = paragraphs.join("\n\n");

    const chunks = chunkText(fullText, 500);
    expect(chunks.length).toBeGreaterThan(1);
    
    // Total reconstructed length should match original text
    const reconstructed = chunks.join("");
    expect(reconstructed.length).toBe(fullText.length);
  });
});
