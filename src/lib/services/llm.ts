import { GenerateContentRequest, GenerateContentResponse } from "@/lib/types/models"

/**
 * Real LLM Service using OpenAI API
 */
export async function generateContent(req: GenerateContentRequest): Promise<GenerateContentResponse> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set in environment variables.");
  }

  let processedImageUrl = req.imageUrl;
  if (req.imageUrl) {
    try {
      const res = await fetch(req.imageUrl);
      if (res.ok) {
        const arrayBuffer = await res.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const contentType = res.headers.get("content-type") || "image/jpeg";
        processedImageUrl = `data:${contentType};base64,${buffer.toString("base64")}`;
      }
    } catch (e) {
      console.error("Failed to fetch and convert image to base64", e);
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
