import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("Fish-Speech Indonesian Dataset Pipeline (X-lord)", () => {
  const dataDir = path.resolve(__dirname, "../../services/fish-speech/data");
  const manifestPath = path.join(dataDir, "dataset_manifest.json");
  const speakerDir = path.join(dataDir, "Speaker_Indonesia");

  it("should have generated dataset_manifest.json with correct schema", () => {
    expect(fs.existsSync(manifestPath)).toBe(true);
    const raw = fs.readFileSync(manifestPath, "utf-8");
    const manifest = JSON.parse(raw);

    expect(manifest.dataset_name).toBe("X-lord/Dataset-Text-To-Speech-Indonesia");
    expect(manifest.language).toBe("id");
    expect(manifest.speaker).toBe("Speaker_Indonesia");
    expect(manifest.sample_rate).toBe(24000);
    expect(manifest.total_segments).toBeGreaterThan(0);
    expect(manifest.total_duration_seconds).toBeGreaterThan(0);
    expect(Array.isArray(manifest.segments)).toBe(true);
  });

  it("should have paired .wav and .lab files for extracted segments", () => {
    expect(fs.existsSync(speakerDir)).toBe(true);
    const files = fs.readdirSync(speakerDir);
    const wavFiles = files.filter((f) => f.endsWith(".wav"));
    const labFiles = files.filter((f) => f.endsWith(".lab"));

    expect(wavFiles.length).toBeGreaterThan(0);
    expect(wavFiles.length).toBe(labFiles.length);

    // Verify each WAV has a matching LAB file with non-empty content
    for (const wav of wavFiles) {
      const base = wav.replace(/\.wav$/, "");
      const labPath = path.join(speakerDir, `${base}.lab`);
      const wavPath = path.join(speakerDir, wav);

      expect(fs.existsSync(labPath)).toBe(true);
      const text = fs.readFileSync(labPath, "utf-8").trim();
      expect(text.length).toBeGreaterThan(0);

      const stats = fs.statSync(wavPath);
      expect(stats.size).toBeGreaterThan(1000); // Valid audio file size
    }
  });

  it("should contain clean Indonesian transcripts without markup tags", () => {
    const raw = fs.readFileSync(manifestPath, "utf-8");
    const manifest = JSON.parse(raw);

    for (const segment of manifest.segments) {
      expect(segment.text).not.toMatch(/<[^>]+>/); // No unparsed HTML or tags
      expect(segment.sample_rate).toBe(24000);
      expect(segment.duration).toBeGreaterThan(0);
    }
  });
});
