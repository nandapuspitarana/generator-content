import { GenerateContentRequest, ParsedResult, KnowledgeTag, KnowledgeChapter, WritingStyle } from "@/lib/types/models"
import { fetchSafeImage } from "@/lib/security/url-guard"

/**
 * Real LLM Service using OpenAI API
 */
export async function generateContent(req: GenerateContentRequest): Promise<ParsedResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set in environment variables.");
  }

  let processedImageUrl: string | undefined = undefined;
  if (req.imageUrl) {
    try {
      // Safely fetch remote image with SSRF protection and 2MB limit
      const { buffer, contentType } = await fetchSafeImage(req.imageUrl, 2 * 1024 * 1024);
      processedImageUrl = `data:${contentType};base64,${buffer.toString("base64")}`;
    } catch (e) {
      console.error("Failed to safely fetch image for LLM preview:", e);
      processedImageUrl = undefined;
    }
  }

  const imagePlaceholder = processedImageUrl
    ? `<img src="${processedImageUrl}" alt="Book Cover" style="width:52%;aspect-ratio:2/3;object-fit:cover;border-radius:4px;box-shadow:0 12px 40px rgba(0,0,0,0.45);display:block;" />`
    : `<div style="width:52%;aspect-ratio:2/3;background:#2a2a2a;border-radius:4px;box-shadow:0 12px 40px rgba(0,0,0,0.45);display:flex;align-items:center;justify-content:center;flex-direction:column;gap:6px;">
      <div style="font-size:11px;color:#666;font-family:Arial,sans-serif;text-align:center;padding:10px;">Upload<br>book cover PNG<br>here</div>
    </div>`;

  const affiliateMarkdown = req.affiliateLink
    ? `📚 **Tertarik baca bukunya? Kamu bisa dapatkan di sini:**\n   🔹 [Beli Buku Ini Sekarang](${req.affiliateLink})`
    : `📚 **Tertarik baca bukunya? Kamu bisa dapatkan di:**\n   🔹 Gramedia → Klik di sini\n   🔹 Tokopedia → Klik di sini\n   🔹 Shopee → Klik di sini`;

  const systemPrompt = `Kamu adalah AI pembuat ulasan buku profesional dan informatif.
Kamu WAJIB mengembalikan JSON valid dengan 2 properti utama:
1. "htmlBannerCode": Gunakan PERSIS template HTML berikut, hanya ganti teks [JUDUL BUKU] (jika panjang, ganti spasi dengan tag <br> agar teks turun ke bawah), [PENULIS], dan 3 tag di bagian bawah ([TAG1], [TAG2], [TAG3]):

<div style="width:100%;aspect-ratio:16/9;background:#e8e4dc;border-radius:14px;position:relative;overflow:hidden;display:flex;align-items:stretch;">
  <div style="position:absolute;right:0;top:0;width:42%;height:100%;background:#1c1c1c;"></div>
  <div style="flex:1;display:flex;flex-direction:column;justify-content:space-between;padding:7% 5% 7% 7%;position:relative;z-index:1;">
    <div style="display:flex;align-items:center;gap:10px;">
      <div style="width:28px;height:2px;background:#1c1c1c;opacity:0.4;"></div>
      <div style="font-size:clamp(9px,1.3vw,11px);font-weight:700;letter-spacing:0.2em;color:#1c1c1c;opacity:0.5;font-family:Arial,sans-serif;text-transform:uppercase;">Book Review</div>
    </div>
    <div>
      <div style="font-size:clamp(9px,1.2vw,10px);font-weight:700;letter-spacing:0.25em;color:#c8102e;font-family:Arial,sans-serif;text-transform:uppercase;margin-bottom:10px;">No. 01</div>
      <div style="font-size:clamp(28px,6vw,56px);font-weight:900;line-height:0.92;color:#1c1c1c;font-family:Arial,sans-serif;letter-spacing:-2px;">[JUDUL BUKU]</div>
      <div style="width:36px;height:2px;background:#c8102e;margin-top:14px;margin-bottom:14px;"></div>
      <div style="font-size:clamp(9px,1.2vw,11px);color:#1c1c1c;opacity:0.5;font-family:Arial,sans-serif;font-style:italic;">[PENULIS]</div>
    </div>
    <div style="display:flex;flex-direction:column;gap:5px;">
      <div style="font-size:clamp(9px,1.1vw,10px);font-weight:700;letter-spacing:0.15em;color:#1c1c1c;opacity:0.35;font-family:Arial,sans-serif;text-transform:uppercase;">Tags</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;">
        <span style="font-size:clamp(8px,1.1vw,10px);font-weight:600;letter-spacing:0.1em;color:#1c1c1c;border:1px solid rgba(28,28,28,0.25);padding:3px 10px;border-radius:20px;font-family:Arial,sans-serif;text-transform:uppercase;">[TAG1]</span>
        <span style="font-size:clamp(8px,1.1vw,10px);font-weight:600;letter-spacing:0.1em;color:#1c1c1c;border:1px solid rgba(28,28,28,0.25);padding:3px 10px;border-radius:20px;font-family:Arial,sans-serif;text-transform:uppercase;">[TAG2]</span>
        <span style="font-size:clamp(8px,1.1vw,10px);font-weight:600;letter-spacing:0.1em;color:#1c1c1c;border:1px solid rgba(28,28,28,0.25);padding:3px 10px;border-radius:20px;font-family:Arial,sans-serif;text-transform:uppercase;">[TAG3]</span>
      </div>
    </div>
  </div>
  <div style="flex:0 0 42%;position:relative;z-index:1;display:flex;align-items:center;justify-content:center;">
    ${imagePlaceholder}
  </div>
</div>

2. "markdownContent": Artikel ulasan buku yang terstruktur, rapi, dan profesional.
   Gunakan struktur Markdown HAMPIR PERSIS seperti contoh berikut, sesuaikan isinya dengan buku yang diminta:
   
   Buku "[Judul Buku]" karya [Penulis] mengeksplorasi konsep tentang [inti buku]. Diterbitkan pada tahun [Tahun], buku ini [jelaskan dampaknya secara singkat].
   
   ### Daftar Isi
   - [Konsep Utama: Nama Konsep](#)
   - [Sub-judul Poin Penting 1](#)
   - [Sub-judul Poin Penting 2](#)
   - [Sub-judul Poin Penting 3](#)
   - [Kesimpulan](#)
   
   ### Konsep Utama: [Nama Konsep]
   [Penjelasan konsep utama, gunakan list jika perlu]
   
   ### [Sub-judul Poin Penting 1]
   [Penjelasan detail]
   
   ### [Sub-judul Poin Penting 2]
   [Penjelasan detail]
   
   ### [Sub-judul Poin Penting 3]
   [Penjelasan detail]
   
   ### Kesimpulan
   "[Judul Buku]" bukan hanya untuk [target pembaca], tetapi untuk siapa pun yang ingin [manfaat]. Melalui [pendekatan buku], [Penulis] mengajak pembaca untuk [tujuan utama buku].
   
   ${affiliateMarkdown}

Aturan:
- Tulis dengan bahasa Indonesia yang rapi, profesional, dan informatif (tidak terlalu kaku, tapi BUKAN bahasa gaul).
- Jangan gunakan kata "bosque" atau sapaan kasual lainnya.
- Output harus bersih tanpa sisa teks copy-paste seperti "Write on Medium".`;

  const userPrompt = `Tolong buatkan review untuk buku berikut sesuai template profesional.
Judul Buku: ${req.title}
Penulis: ${req.author}
Catatan/Poin Penting: ${req.notes || "Buatkan poin penting dan struktur otomatis dari buku ini."}

Pastikan output berupa JSON object dengan properti "htmlBannerCode" (WAJIB pakai inline styles, bukan class) dan "markdownContent" (sesuai template).`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error("OpenAI API Error:", err);
    throw new Error("Gagal mendapatkan respons dari OpenAI.");
  }

  const data = await response.json();
  const content = data.choices[0].message.content;

  try {
    const parsed = JSON.parse(content);
    return {
      htmlBannerCode: parsed.htmlBannerCode || "<div>Gagal generate HTML</div>",
      markdownContent: parsed.markdownContent || "Gagal generate Markdown",
    };
  } catch (e) {
    console.error("Failed to parse JSON from OpenAI:", e);
    throw new Error("Format respons dari AI tidak valid.");
  }
}

export interface ImportBannerRequest {
  type: "image" | "html";
  content: string; 
  format: "MEDIUM" | "INSTAGRAM";
}

export async function importBannerWithAI(req: ImportBannerRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set.");

  const W = req.format === "MEDIUM" ? 1200 : 1080;
  const H = req.format === "MEDIUM" ? 675 : 1080;

  const systemPrompt = `You are an expert UI/UX developer. Your task is to analyze the provided ${req.type === 'image' ? 'design mockup image' : 'HTML code'} and convert its layout into a specific JSON array for a custom Canvas Engine.
The canvas has dimensions: Width ${W}px, Height ${H}px.

Return ONLY a valid JSON array of objects. Each object MUST have these exact properties:
- "id": a unique string (e.g. "text-1", "img-1", "shape-1")
- "type": must be "text", "image", or "shape" (do not generate "group")
- "x": number (X coordinate in pixels)
- "y": number (Y coordinate in pixels)
- "w": number (Width in pixels)
- "h": number (Height in pixels)
- "zIndex": number (1 for background shapes, 2 for images, 3 for text)

If type is "text":
- "text": string (the text content)
- "fontSize": number
- "color": hex string (e.g. "#FFFFFF")
- "fontWeight": "normal" | "500" | "bold" | "800" | "900"
- "textAlign": "left" | "center" | "right"

If type is "image":
- "src": string (use a placeholder if original not available, like "https://placehold.co/800x800")
- "objectFit": "cover" | "contain"
- "borderRadius": number (optional, e.g. 0 or 12)

If type is "shape":
- "bgColor": hex string (e.g. "#1C1C1C")
- "borderRadius": number (optional)

Do NOT return anything else, no markdown formatting outside the JSON array. Output must be perfectly valid JSON array starting with [ and ending with ]. Make sure the layout approximately matches the input.`;

  let messages: any[] = [
    { role: "system", content: systemPrompt }
  ];

  if (req.type === "image") {
    messages.push({
      role: "user",
      content: [
        { type: "text", text: "Convert this design to the requested JSON layout." },
        { type: "image_url", image_url: { url: req.content } }
      ]
    });
  } else {
    messages.push({
      role: "user",
      content: `Convert this HTML to the requested JSON layout:\n\n${req.content}`
    });
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o", 
      messages: messages,
      temperature: 0.2, 
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error("OpenAI API Error:", err);
    throw new Error("Gagal memproses import.");
  }

  const data = await response.json();
  let contentText = data.choices[0].message.content.trim();
  
  if (contentText.startsWith("\`\`\`json")) {
    contentText = contentText.replace(/\`\`\`json/g, "").replace(/\`\`\`/g, "").trim();
  }

  try {
    const parsed = JSON.parse(contentText);
    return parsed;
  } catch (e) {
    console.error("Failed to parse JSON array from OpenAI:", e);
    throw new Error("Format respons dari AI tidak valid.");
  }
}

function getStyleInstruction(style: WritingStyle): string {
  switch (style) {
    case 'santai-storytelling':
      return '"Lo tahu nggak sih..." — personal, santai, seperti ngobrol dengan teman, menggunakan bahasa gaul yang ringan tapi tetap sopan.';
    case 'semi-formal-edukatif':
      return '"Dalam buku ini, kita akan menemukan..." — informatif, terstruktur, rapi, dan mudah dipahami, cocok untuk artikel edukasi.';
    case 'narasi-investigatif':
      return '"Ada satu fakta yang bikin saya bergidik..." — dramatis, misterius, bikin penasaran, dan menggugah rasa ingin tahu yang kuat.';
    default:
      return 'Gunakan gaya penulisan yang menarik dan natural.';
  }
}

export async function generateKnowledgeSummary(tag: KnowledgeTag, chapters: KnowledgeChapter[]): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set.");

  const chaptersContext = chapters.map(c => `=== ${c.chapterNumber}. ${c.chapterTitle} ===\n${c.originalContent}`).join("\n\n");

  // Determine framing based on type
  const isBuku = tag.type === 'buku';
  const topicLabel = isBuku ? `buku "${tag.title}"` : `topik "${tag.title}"`;
  const sourceLabel = isBuku ? 'ringkasan buku' : 'ringkasan materi pembelajaran';

  const systemPrompt = `Kamu adalah seorang asisten edukasi dan penulis konten profesional.
Tugasmu adalah membuat ${sourceLabel} yang komprehensif dan edukatif berdasarkan catatan materi di bawah ini.

PEDOMAN PENTING:
- GUNAKAN SELURUH ISI dari teks materi yang diberikan sebagai sumber utama — jangan mengabaikan detail penting.
- Fokus pada SUBSTANSI materi: jelaskan konsep-konsep kunci, algoritma, ide, atau argumen utama.
- Sertakan "Why It Matters": mengapa materi ini relevan dan penting.
- JANGAN parafrase dangkal — bedah isi materinya.
Gunakan gaya penulisan: ${getStyleInstruction(tag.writingStyle)}
Output hanya berupa teks Markdown yang rapi (gunakan heading dan bullet points secara proporsional), tanpa blok kode json atau markdown.`;

  const userPrompt = `Judul: ${tag.title}
Kategori: ${tag.category} | Tipe: ${tag.type}

Catatan materi per bab/bagian:
${chaptersContext}

Buatkan ringkasan yang merangkum dan menjelaskan isi ${topicLabel} secara menyeluruh.`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
    }),
  });

  if (!response.ok) throw new Error("Failed to generate knowledge summary.");
  const data = await response.json();
  return data.choices[0].message.content.trim();
}

export async function generateChapterStory(tag: KnowledgeTag, chapter: KnowledgeChapter, style: WritingStyle): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set.");

  const isBuku = tag.type === 'buku';
  const contentLabel = isBuku ? 'catatan bab dari buku' : 'materi pembelajaran';

  const systemPrompt = `Kamu adalah penulis dan komunikator edukasi yang andal.
Tugasmu adalah mengolah ulang ${contentLabel} menjadi narasi yang lebih mudah dipahami dan engaging, TANPA menghilangkan substansi materinya.

PEDOMAN:
- WAJIB mempertahankan semua konsep, definisi, dan detail penting dari teks asli.
- Jelaskan konsep yang kompleks menggunakan analogi, perumpamaan, atau contoh kehidupan nyata jika membantu.
- JANGAN meringkas berlebihan — tujuannya mengolah gaya bahasa, bukan memotong isi.
Gunakan gaya penulisan: ${getStyleInstruction(style)}
Output berupa narasi/penjelasan dalam format teks biasa yang rapi (boleh menggunakan Markdown dasar untuk penekanan), tanpa blok kode json.`;

  const userPrompt = `Topik: ${tag.title}
Bagian: ${chapter.chapterNumber} - ${chapter.chapterTitle}

Materi asli yang harus dijadikan dasar:
---
${chapter.originalContent}
---

Olahlah materi di atas menjadi narasi yang lebih hidup dan mudah dipahami, dengan tetap mempertahankan semua konsep pentingnya.`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
    }),
  });

  if (!response.ok) throw new Error("Failed to generate chapter story.");
  const data = await response.json();
  return data.choices[0].message.content.trim();
}

export async function generatePodcastScript(tag: KnowledgeTag, chapters: KnowledgeChapter[], scope: 'chapter'|'full', targetMinutes: number): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set.");

  const targetWords = Math.round((targetMinutes / 5) * 650); // ~130 wpm

  // Include both story version AND original to maximize RAG grounding
  const contentContext = chapters.map(c => {
    const mainContent = c.storyVersion
      ? `[Versi Narasi]\n${c.storyVersion}\n\n[Catatan Asli]\n${c.originalContent}`
      : c.originalContent;
    return `=== BAGIAN ${c.chapterNumber}: ${c.chapterTitle} ===\n${mainContent}`;
  }).join("\n\n");

  const isBuku = tag.type === 'buku';
  const topicLabel = isBuku ? `buku "${tag.title}"` : `topik "${tag.title}"`;
  const ctaText = isBuku
    ? `dorong pendengar untuk membaca ${topicLabel} sendiri atau mengeksplorasi lebih dalam`
    : 'dorong pendengar untuk terus belajar, mencoba sendiri konsep yang dibahas, dan mengeksplorasi sumber lebih lanjut';

  const systemPrompt = `Kamu adalah host podcast edukasi yang berpengalaman dan komunikatif.
Tugasmu adalah membuat skrip podcast berdurasi kurang lebih ${targetMinutes} menit (sekitar ${targetWords} kata) yang BENAR-BENAR MENJELASKAN DAN MENGAJARKAN materi dari teks yang disediakan.

Gaya bahasa: ${getStyleInstruction(tag.writingStyle)}

ATURAN PALING PENTING — WAJIB DIIKUTI:
1. GUNAKAN MATERI YANG DIBERIKAN sebagai sumber utama dan satu-satunya. Semua pembahasan harus berdasar pada teks yang tersedia — jangan mengarang atau menambahkan informasi di luar teks.
2. JELASKAN KONSEP SECARA MENDALAM: jika ada algoritma, teori, metode, atau istilah teknis, jelaskan cara kerjanya, bukan sekadar menyebut namanya. Gunakan analogi, contoh konkret, atau perumpamaan agar mudah dipahami.
3. JANGAN PARAFRASE DANGKAL — bedah isinya. Pendengar harus benar-benar paham konsep setelah mendengar episode ini.
4. Ini BUKAN review buku. Ini adalah episode edukasi yang mengajarkan isi materi.

Struktur Skrip yang WAJIB diikuti:

[INTRO] ~60 detik
- Sapa pendengar dengan antusias dan natural.
- Sebutkan judul episode dan topik yang akan dibahas.
- Hook: berikan pertanyaan atau skenario yang membuat pendengar ingin tahu lebih.

[SEGMEN UTAMA] (satu atau beberapa bagian sesuai cakupan)
- Bahas setiap bagian/bab satu per satu dengan urutan yang logis.
- Untuk setiap konsep/poin penting: (1) jelaskan apa itu, (2) jelaskan cara kerjanya atau mengapa demikian, (3) berikan contoh atau analogi nyata.
- Gunakan transisi yang mengalir antar bagian.
- Sertakan momen-momen interaktif seperti pertanyaan retoris atau "bayangkan jika...".

[OUTRO] ~45 detik
- Rekap 3-5 poin utama yang telah dibahas secara konkret.
- ${ctaText}.
- Closing yang hangat dan mudah diingat.

Format penulisan skrip:
- Gunakan penanda HOST: untuk setiap bagian ucapan.
- Selipkan tag ekspresi vokal dan akustik alami (34 Vocal Tags) pada tempat-tempat yang tepat:
  - Jeda & Napas: [pause], [short pause], [inhale], [exhale], [sigh], [clearing throat], [panting], [tsk]
  - Tawa & Ceria: [laughing], [chuckle], [chuckling], [laughing tone], [delight], [audience laughter]
  - Dinamika Suara: [emphasis], [whisper], [low voice], [low volume], [volume down], [loud], [volume up], [screaming], [shouting]
  - Emosi & Mood: [excited], [excited tone], [surprised], [shocked], [angry], [sad], [singing], [echo], [interrupting], [moaning], [with strong accent]
- Tulis dalam format Markdown.`;

  const userPrompt = `Judul Topik: ${tag.title}
Kategori: ${tag.category} | Tipe: ${tag.type}
Cakupan episode ini: ${scope === 'chapter' ? 'Satu Bagian/Bab' : 'Full Episode (semua bagian)'}
Target durasi: ${targetMinutes} menit (~${targetWords} kata)

Berikut adalah MATERI SUMBER yang WAJIB menjadi dasar skrip podcast ini:
---
${contentContext}
---

Buat skrip podcast edukasi lengkap dari Intro sampai Outro. Pastikan semua konsep dalam materi di atas dibahas dan dijelaskan dengan tuntas dalam skrip.`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
    }),
  });

  if (!response.ok) throw new Error("Failed to generate podcast script.");
  const data = await response.json();
  return data.choices[0].message.content.trim();
}

export async function chatWithBook(tag: KnowledgeTag, userMessage: string, history: any[], relevantChapters: KnowledgeChapter[]): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set.");

  const contextText = relevantChapters.map(c => `[Bagian ${c.chapterNumber} - ${c.chapterTitle}]:\n${c.originalContent}`).join("\n\n---\n\n");

  const contentLabel = tag.type === 'buku' ? `buku "${tag.title}"` : `materi "${tag.title}"`;
  
  const systemPrompt = `Kamu adalah Asisten AI untuk ${contentLabel}.
Tugasmu adalah menjawab pertanyaan pengguna SECARA SPESIFIK berdasarkan Teks Referensi yang diberikan dari knowledge base.

ATURAN PENTING:
1. Jika Teks Referensi mengandung jawaban, jawablah secara detail dan informatif berdasarkan teks tersebut. Jelaskan konsep dengan baik.
2. Jika Teks Referensi TIDAK mengandung jawaban, katakan dengan jujur bahwa informasi tersebut tidak ditemukan di materi yang tersimpan, tapi kamu bisa mencoba menjawab berdasarkan pengetahuan umummu jika relevan (berikan peringatan bahwa itu bukan dari teks materi).
3. Gunakan gaya bahasa: ${getStyleInstruction(tag.writingStyle)}
4. Jangan membuat-buat informasi (halusinasi) mengenai isi materi.

=== TEKS REFERENSI ===
${contextText || '(Tidak ada teks referensi spesifik yang ditemukan untuk pertanyaan ini)'}
======================`;

  const messages = [
    { role: "system", content: systemPrompt },
    ...history.map(msg => ({ role: msg.role, content: msg.content })),
    { role: "user", content: userMessage }
  ];

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: messages,
      temperature: 0.5,
    }),
  });

  if (!response.ok) {
    console.error("OpenAI Chat Error", await response.text());
    throw new Error("Failed to get chat response.");
  }
  
  const data = await response.json();
  return data.choices[0].message.content.trim();
}
