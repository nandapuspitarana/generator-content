import { KnowledgeTag, KnowledgeChapter } from "@/lib/types/models";

export type PromptType = 'banner' | 'ig-caption' | 'ig-carousel' | 'podcast-script';
export type Platform = 'gpt' | 'gemini';

export interface VocalTagInfo {
  tag: string;
  label: string;
  category: "timing" | "laughter" | "prosody" | "emotion";
  description: string;
}

/**
 * 34 Tag Ekspresi Vokal & Efek Akustik untuk Pembuatan Konten & Sintesis Suara Fish-Speech
 */
export const VOCAL_EXPRESSION_TAGS: VocalTagInfo[] = [
  // 1. Timing & Breath (8 tags)
  { tag: "[pause]", label: "Pause", category: "timing", description: "Jeda hening standar (1.0s)" },
  { tag: "[short pause]", label: "Short Pause", category: "timing", description: "Jeda hening singkat (0.5s)" },
  { tag: "[inhale]", label: "Inhale", category: "timing", description: "Tarik napas natural (0.3s)" },
  { tag: "[exhale]", label: "Exhale", category: "timing", description: "Hembusan napas keluar (0.3s)" },
  { tag: "[sigh]", label: "Sigh", category: "timing", description: "Helaan napas lega atau lelah (0.4s)" },
  { tag: "[clearing throat]", label: "Clearing Throat", category: "timing", description: "Berdeham sebelum bicara (0.4s)" },
  { tag: "[panting]", label: "Panting", category: "timing", description: "Napas terengah-engah (0.4s)" },
  { tag: "[tsk]", label: "Tsk", category: "timing", description: "Decakan lidah heran atau kesal (0.3s)" },

  // 2. Laughter & Cheer (6 tags)
  { tag: "[laughing]", label: "Laughing", category: "laughter", description: "Tertawa lepas (0.5s)" },
  { tag: "[chuckle]", label: "Chuckle", category: "laughter", description: "Kekeh tawa kecil (0.4s)" },
  { tag: "[chuckling]", label: "Chuckling", category: "laughter", description: "Terkekeh-kekeh santai (0.4s)" },
  { tag: "[laughing tone]", label: "Laughing Tone", category: "laughter", description: "Bicara sambil tertawa" },
  { tag: "[delight]", label: "Delight", category: "laughter", description: "Nada suara ceria dan gembira" },
  { tag: "[audience laughter]", label: "Audience Laughter", category: "laughter", description: "Tawa penonton / audiens (0.8s)" },

  // 3. Prosody & Dynamics (9 tags)
  { tag: "[emphasis]", label: "Emphasis", category: "prosody", description: "Penekanan pada kata kunci penting" },
  { tag: "[whisper]", label: "Whisper", category: "prosody", description: "Berbisik pelan dan intim" },
  { tag: "[low voice]", label: "Low Voice", category: "prosody", description: "Suara bernada rendah dan berat" },
  { tag: "[low volume]", label: "Low Volume", category: "prosody", description: "Volume suara mengecil" },
  { tag: "[volume down]", label: "Volume Down", category: "prosody", description: "Volume menurun secara halus" },
  { tag: "[loud]", label: "Loud", category: "prosody", description: "Suara lantang dan tegas" },
  { tag: "[volume up]", label: "Volume Up", category: "prosody", description: "Volume membesar secara progresif" },
  { tag: "[screaming]", label: "Screaming", category: "prosody", description: "Menjerit kencang" },
  { tag: "[shouting]", label: "Shouting", category: "prosody", description: "Berseru atau berteriak" },

  // 4. Emotion & Character (11 tags)
  { tag: "[excited]", label: "Excited", category: "emotion", description: "Sangat antusias dan bersemangat" },
  { tag: "[excited tone]", label: "Excited Tone", category: "emotion", description: "Intonasi suara bersemangat" },
  { tag: "[surprised]", label: "Surprised", category: "emotion", description: "Kaget atau heran" },
  { tag: "[shocked]", label: "Shocked", category: "emotion", description: "Sangat terkejut dan syok" },
  { tag: "[angry]", label: "Angry", category: "emotion", description: "Nada marah dan geram" },
  { tag: "[sad]", label: "Sad", category: "emotion", description: "Nada sedih, murung atau haru" },
  { tag: "[singing]", label: "Singing", category: "emotion", description: "Bernyanyi atau melantunkan kata" },
  { tag: "[echo]", label: "Echo", category: "emotion", description: "Efek akustik suara bergema" },
  { tag: "[interrupting]", label: "Interrupting", category: "emotion", description: "Menyela atau memotong ucapan" },
  { tag: "[moaning]", label: "Moaning", category: "emotion", description: "Merintih atau mengeluh pelan" },
  { tag: "[with strong accent]", label: "With Strong Accent", category: "emotion", description: "Logat atau aksen bicara yang kuat" },
];

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

export function buildPodcastScriptPrompt(tag: KnowledgeTag, chapters: KnowledgeChapter[], platform: Platform): string {
  const points = extractMainPoints(tag.summary);
  const platformInstr = getPlatformInstruction(platform);

  return `Buat naskah podcast / audio monologue yang ekspresif dan hidup berdasarkan materi berikut:

- Topik/Buku: ${tag.title}
- Kategori: ${tag.category}
- Poin Inti Pembahasan:
${points}

Petunjuk Penting Penulisan Naskah Audio (Fish-Speech / TTS Compatible):
1. Gaya bahasa: Mengalir, bertutur lisan (conversational), personal, dan tidak kaku.
2. JANGAN sertakan markdown seperti heading (#) atau bold (**), serta JANGAN sertakan nama pembicara ("Host:").
3. Manfaatkan tag ekspresi vokal dan jeda alami secara proporsional di dalam naskah untuk menghasilkan pembacaan suara AI yang super ekspresif:
   - Jeda & Napas: [pause], [short pause], [inhale], [exhale], [sigh], [clearing throat], [panting], [tsk]
   - Tawa & Ceria: [laughing], [chuckle], [chuckling], [laughing tone], [delight], [audience laughter]
   - Dinamika Suara: [emphasis], [whisper], [low voice], [low volume], [volume down], [loud], [volume up], [screaming], [shouting]
   - Emosi & Mood: [excited], [excited tone], [surprised], [shocked], [angry], [sad], [singing], [echo], [interrupting], [moaning], [with strong accent]
   - Tag Jeda SSML: <break time="1s"/>, <break time="1.5s"/>, <break time="2s"/>

Struktur:
- Pembuka: Hook menarik, sapaan hangat, dan latar belakang masalah.
- Isi: Pembahasan konsep secara mendalam dengan contoh dan analogi nyata.
- Penutup: Ringkasan 3 poin utama dan ajakan refleksi (Call-to-action).

${platformInstr}`;
}

export function buildPrompt(type: PromptType, tag: KnowledgeTag, chapters: KnowledgeChapter[], platform: Platform): string {
  switch (type) {
    case 'banner': return buildBannerPrompt(tag, chapters, platform);
    case 'ig-caption': return buildInstagramCaptionPrompt(tag, chapters, platform);
    case 'ig-carousel': return buildInstagramCarouselPrompt(tag, chapters, platform);
    case 'podcast-script': return buildPodcastScriptPrompt(tag, chapters, platform);
    default: return '';
  }
}
