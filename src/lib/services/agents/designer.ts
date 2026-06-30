export async function runDesigner(title: string, author: string, format: 'MEDIUM_16_9' | 'INSTAGRAM_1_1', processedImageUrl: string | undefined, apiKey: string): Promise<string> {
  // For Medium 16:9: image fills entire right panel as absolute cover
  const imageFillPanel = processedImageUrl
    ? `<img src="${processedImageUrl}" alt="Book Cover" style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;display:block;" />`
    : `<div style="position:absolute;top:0;left:0;width:100%;height:100%;background:#2a2a2a;display:flex;align-items:center;justify-content:center;color:#666;font-size:11px;">Upload Cover</div>`;

  // For Instagram 1:1: centered book with natural 2:3 ratio
  const imageCentered = processedImageUrl
    ? `<img src="${processedImageUrl}" alt="Book Cover" style="width:200px;height:300px;object-fit:cover;border-radius:4px;box-shadow:0 12px 40px rgba(0,0,0,0.6);display:block;" />`
    : `<div style="width:200px;height:300px;background:#2a2a2a;border-radius:4px;display:flex;align-items:center;justify-content:center;color:#666;font-size:11px;">Upload Cover</div>`;

  let templateInstructions = '';
  
  if (format === 'MEDIUM_16_9') {
    templateInstructions = `Gunakan template 16:9 (Landscape) berikut:
<div style="width:100%;aspect-ratio:16/9;background:#e8e4dc;border-radius:0;position:relative;overflow:hidden;display:flex;align-items:stretch;">
  <div style="position:absolute;right:0;top:0;width:42%;height:100%;background:#1c1c1c;"></div>
  <div style="flex:1;display:flex;flex-direction:column;justify-content:space-between;padding:7% 5% 7% 7%;position:relative;z-index:1;">
    <div style="display:flex;align-items:center;gap:10px;">
      <div style="width:28px;height:2px;background:#1c1c1c;opacity:0.4;"></div>
      <div style="font-size:11px;font-weight:700;letter-spacing:0.2em;color:#1c1c1c;opacity:0.5;font-family:Arial,sans-serif;text-transform:uppercase;">Book Review</div>
    </div>
    <div>
      <div style="font-size:10px;font-weight:700;letter-spacing:0.25em;color:#c8102e;font-family:Arial,sans-serif;text-transform:uppercase;margin-bottom:10px;">[GENRE]</div>
      <div style="font-size:clamp(18px,3.5vw,36px);font-weight:900;line-height:1.05;color:#1c1c1c;font-family:Arial,sans-serif;letter-spacing:-1px;">[JUDUL BUKU]</div>
      <div style="width:36px;height:2px;background:#c8102e;margin-top:14px;margin-bottom:14px;"></div>
      <div style="font-size:11px;color:#1c1c1c;opacity:0.5;font-family:Arial,sans-serif;font-style:italic;">[PENULIS]</div>
    </div>
    <div style="display:flex;flex-direction:column;gap:5px;">
      <div style="font-size:10px;font-weight:700;letter-spacing:0.15em;color:#1c1c1c;opacity:0.35;font-family:Arial,sans-serif;text-transform:uppercase;">Tags</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;">
        <span style="font-size:10px;font-weight:600;letter-spacing:0.1em;color:#1c1c1c;border:1px solid rgba(28,28,28,0.25);padding:3px 10px;border-radius:20px;font-family:Arial,sans-serif;text-transform:uppercase;">[TAG1]</span>
        <span style="font-size:10px;font-weight:600;letter-spacing:0.1em;color:#1c1c1c;border:1px solid rgba(28,28,28,0.25);padding:3px 10px;border-radius:20px;font-family:Arial,sans-serif;text-transform:uppercase;">[TAG2]</span>
        <span style="font-size:10px;font-weight:600;letter-spacing:0.1em;color:#1c1c1c;border:1px solid rgba(28,28,28,0.25);padding:3px 10px;border-radius:20px;font-family:Arial,sans-serif;text-transform:uppercase;">[TAG3]</span>
      </div>
    </div>
  </div>
  <div style="flex:0 0 42%;position:relative;overflow:hidden;">
    ${imageFillPanel}
  </div>
</div>`;
  } else if (format === 'INSTAGRAM_1_1') {
    templateInstructions = `Gunakan template 1:1 (Square) minimalis estetik berikut:
<div style="width:100%;aspect-ratio:1/1;background:#1c1c1c;border-radius:0;position:relative;overflow:hidden;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:10%;font-family:Arial,sans-serif;">
  <div style="position:absolute;top:0;left:0;width:100%;height:100%;background:linear-gradient(135deg, #2a2a2a 0%, #1c1c1c 100%);z-index:0;"></div>
  <div style="position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;text-align:center;gap:20px;width:100%;">
    ${imageCentered}
    <div style="margin-top:15px;">
      <div style="font-size:12px;font-weight:700;letter-spacing:0.2em;color:#c8102e;text-transform:uppercase;margin-bottom:12px;">[GENRE]</div>
      <div style="font-size:clamp(22px,4vw,38px);font-weight:900;line-height:1.1;color:#ffffff;letter-spacing:-1px;">[JUDUL BUKU]</div>
      <div style="font-size:12px;color:#aaaaaa;font-style:italic;margin-top:12px;">By [PENULIS]</div>
    </div>
  </div>
</div>`;
  }

  const systemPrompt = `Kamu adalah AI Web Designer yang ahli dalam inline HTML/CSS modern.
Tugasmu adalah menghasilkan string HTML murni berdasarkan template yang diberikan. 
Ganti placeholder berikut dengan nilai yang sesuai dari buku yang diminta:
- [JUDUL BUKU] → judul buku
- [PENULIS] → nama penulis
- [GENRE] → genre singkat buku (contoh: "Self-Help", "Business", "Fiction", "Biography")
- [TAG1], [TAG2], [TAG3] → tiga kata kunci atau tema utama buku (dalam bahasa Inggris, singkat, 1-2 kata per tag)

PENTING:
- Pastikan font-size judul TIDAK lebih besar dari yang ada di template. Gunakan nilai clamp() yang sudah disediakan.
- Jangan ubah struktur HTML, hanya ganti placeholder.
- Pastikan tidak menyertakan blok kode markdown (seperti \`\`\`html) dalam jawabanmu. Cukup kembalikan string HTML-nya saja.

${templateInstructions}`;

  const userPrompt = `Judul: ${title}
Penulis: ${author}

Berikan saya HTML banner-nya sekarang tanpa teks basa-basi.`;

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
      temperature: 0.2,
    }),
  });

  if (!response.ok) throw new Error("Designer agent failed to respond.");
  
  const data = await response.json();
  let content = data.choices[0].message.content;
  if (content.startsWith("\`\`\`html")) {
    content = content.replace(/\`\`\`html\n?/g, "").replace(/\`\`\`/g, "");
  }
  return content.trim();
}
