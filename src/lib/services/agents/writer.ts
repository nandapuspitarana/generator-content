export async function runWriter(title: string, author: string, outline: string, affiliateLink: string | undefined, apiKey: string): Promise<string> {
  const affiliateMarkdown = affiliateLink
    ? `📚 **Tertarik baca bukunya? Kamu bisa dapatkan di sini:**\n   🔹 [Beli Buku Ini Sekarang](${affiliateLink})`
    : `📚 **Tertarik baca bukunya? Kamu bisa dapatkan di:**\n   🔹 Gramedia → Klik di sini\n   🔹 Tokopedia → Klik di sini\n   🔹 Shopee → Klik di sini`;

  const systemPrompt = `Kamu adalah AI Writer (Penulis) profesional yang bertugas menulis artikel ulasan buku berdasarkan kerangka (outline) yang diberikan.
Aturan Penulisan:
1. Gunakan bahasa Indonesia yang rapi, profesional, dan informatif.
2. Artikel harus menggunakan format Markdown penuh. Gunakan H3 (###) untuk setiap sub-judul.
3. Selalu sisipkan Daftar Isi (Table of Contents) di bagian awal artikel.
4. Akhiri tulisan dengan Kesimpulan yang solid, diikuti blok tautan pembelian yang sudah disediakan.

Format Output Wajib:
Buku "[Judul Buku]" karya [Penulis] mengeksplorasi konsep tentang [inti buku]. Diterbitkan pada tahun [Tahun], buku ini [jelaskan dampaknya secara singkat].

### Daftar Isi
- [Konsep Utama](#)
- [Sub-judul 1](#)
- [Sub-judul 2](#)
- [Sub-judul 3](#)
- [Kesimpulan](#)

### Konsep Utama
[Penjelasan Konsep...]

[Isi Artikel Sesuai Kerangka...]

### Kesimpulan
[Teks Kesimpulan...]

${affiliateMarkdown}`;

  const userPrompt = `Judul Buku: ${title}
Penulis: ${author}

Gunakan kerangka (outline) berikut sebagai panduan utama tulisanmu:
${outline}

Tuliskan artikel ulasan lengkap dalam format Markdown berdasarkan kerangka di atas. Jangan menyertakan kata pengantar apa pun dalam jawabanmu, berikan langsung hasil akhir artikelnya.`;

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

  if (!response.ok) {
    throw new Error("Writer agent failed to respond.");
  }
  
  const data = await response.json();
  return data.choices[0].message.content;
}
