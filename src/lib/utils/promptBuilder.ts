import { KnowledgeTag, KnowledgeChapter } from "@/lib/types/models";

export type PromptType = 'banner' | 'ig-caption' | 'ig-carousel';
export type Platform = 'gpt' | 'gemini';

function extractMainPoints(summary: string | undefined): string {
  if (!summary) return "- Poin 1\n- Poin 2\n- Poin 3";
  
  // Extract bullet points if any exist
  const bullets = summary.match(/^[-*]\s+(.*)$/gm);
  if (bullets && bullets.length > 0) {
    return bullets.slice(0, 3).join("\n");
  }
  
  // Or just take the first few sentences
  const sentences = summary.split(/[.!?]+/).filter(s => s.trim().length > 10);
  return sentences.slice(0, 3).map((s, i) => `- ${s.trim()}`).join("\n");
}

function getPlatformInstruction(platform: Platform): string {
  if (platform === 'gemini') {
    return `Berikan response dengan format markdown murni tanpa pembukaan kata-kata basa-basi.`;
  }
  return `Tolong berikan output akhirnya saja dalam format markdown murni, tanpa teks penjelasan tambahan.`;
}

export function buildBannerPrompt(tag: KnowledgeTag, chapters: KnowledgeChapter[], platform: Platform): string {
  const points = extractMainPoints(tag.summary);
  const platformInstr = getPlatformInstruction(platform);
  
  return `Buat prompt desain untuk banner artikel / LinkedIn dengan spesifikasi berikut:
  
- Judul buku/topik: ${tag.title}
- Kategori: ${tag.category}
- Poin utama:
${points}

Instruksi visual:
- Style: clean editorial, typographic, rasio 16:9
- Skema warna: sesuaikan dengan tema buku (misal: dark editorial / light minimalis / bold accent)
- Tambahkan elemen tipografi tebal yang elegan
- Sertakan teks untuk judul, subtitle singkat (1 kalimat), dan 3 poin pelengkap yang enak dibaca sekilas.

${platformInstr}`;
}

export function buildInstagramCaptionPrompt(tag: KnowledgeTag, chapters: KnowledgeChapter[], platform: Platform): string {
  const points = extractMainPoints(tag.summary);
  const platformInstr = getPlatformInstruction(platform);
  let styleHook = "";
  
  if (tag.writingStyle === 'santai-storytelling') {
    styleHook = "Gunakan hook pembuka yang santai dan personal seperti ngobrol santai dengan teman.";
  } else if (tag.writingStyle === 'narasi-investigatif') {
    styleHook = "Gunakan hook pembuka yang misterius, memancing rasa ingin tahu, dan agak dramatis.";
  } else {
    styleHook = "Gunakan hook pembuka yang informatif, jelas, dan edukatif.";
  }

  return `Buat caption Instagram yang engaging untuk book review / ringkasan topik ini:

- Topik/Buku: ${tag.title}
- Konteks / Ringkasan Utama:
${points}

Struktur Caption yang diinginkan:
1. Hook: ${styleHook}
2. Body: Jelaskan ringkas 2-3 poin penting secara poin per poin atau narasi singkat yang mudah dipahami (maksimal 3 paragraf).
3. Call-to-Action (CTA): Ajak followers untuk like, save, dan berikan komentar pendapat mereka. Arahkan untuk klik link di bio jika ingin baca full review.
4. Hashtags: Minimal 5 hashtag relevan (contoh: #bookreview #${tag.category} #bukukita)

Berikan juga SARAN VISUAL untuk postingan ini (warna dominan, gaya gambar) di bagian akhir caption.

${platformInstr}`;
}

export function buildInstagramCarouselPrompt(tag: KnowledgeTag, chapters: KnowledgeChapter[], platform: Platform): string {
  const platformInstr = getPlatformInstruction(platform);
  
  return `Rancang konsep carousel Instagram (5–7 slide) berdasarkan buku/topik berikut:

- Judul Topik: ${tag.title}
- Ringkasan:
${tag.summary ? tag.summary.substring(0, 500) + '...' : 'Belum ada ringkasan.'}

Gaya penyampaian: ${tag.writingStyle} (Buat teks seringkas mungkin per slide agar nyaman dibaca di layar HP).

Format output yang diinginkan untuk setiap slide:
- Slide [Nomor]:
  - Judul Besar (Teks yang paling menonjol)
  - Copy / Teks Pendukung (Maksimal 2 kalimat)
  - Ide Visual (Ilustrasi, ikon, atau foto yang direkomendasikan)

Pastikan alurnya seperti ini:
- Slide 1: Cover dengan Hook kuat
- Slide 2 hingga (N-1): Isi materi, satu poin penting per slide
- Slide terakhir: Kesimpulan & Call-to-Action (Save, Share, Komen)

${platformInstr}`;
}

export function buildPrompt(type: PromptType, tag: KnowledgeTag, chapters: KnowledgeChapter[], platform: Platform): string {
  switch (type) {
    case 'banner': return buildBannerPrompt(tag, chapters, platform);
    case 'ig-caption': return buildInstagramCaptionPrompt(tag, chapters, platform);
    case 'ig-carousel': return buildInstagramCarouselPrompt(tag, chapters, platform);
    default: return '';
  }
}
