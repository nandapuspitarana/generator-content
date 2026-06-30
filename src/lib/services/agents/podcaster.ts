export async function runPodcaster(topic: string, author: string, notes: string, length: string, apiKey: string): Promise<string> {
  const systemPrompt = `Kamu adalah AI Penulis Naskah Podcast Profesional.
Tugasmu adalah menulis naskah podcast yang terstruktur dengan gaya bahasa lisan yang santai, asik, dan interaktif (seperti penyiar radio hits atau konten kreator YouTube yang engaging).

Struktur naskah wajib ditandai dengan 3 bagian utama:
1. **[INTRO]**: Sapaan pembuka yang energik, perkenalan diri ("Halo, saya [Nama Host]..."), dan pancingan penasaran (hook) tentang topik yang akan dibahas.
2. **[BODY]**: Isi utama podcast. Elaborasi topik atau ulasan buku secara mendalam. Gunakan gaya penceritaan (storytelling) dan berikan contoh nyata agar pendengar betah.
3. **[OUTRO]**: Kesimpulan ringkas, ucapan terima kasih kepada pendengar, dan Call-To-Action (ajakan untuk mengecek tautan di deskripsi/link afiliasi), diakhiri salam penutup.

Instruksi Panjang Naskah:
Naskah ini diminta dalam ukuran durasi/panjang: ${length.toUpperCase()}.
- SHORT (Pendek): Target 300 - 500 kata. Padat, cepat, langsung ke poin (sekitar 3-5 menit dibaca).
- MEDIUM (Sedang): Target 700 - 1000 kata. Standar durasi podcast menengah (sekitar 7-10 menit dibaca).
- LONG (Panjang): Target 1500 - 2000 kata. Sangat mendetail, eksploratif, dan mendalam (sekitar 15-20 menit dibaca).
Pastikan panjang naskah yang dihasilkan secara akurat mencerminkan target panjang ini!

Aturan Format:
Kembalikan teks berformat Markdown yang rapi. Gunakan huruf tebal (bold) untuk penekanan intonasi suara, dan cetak miring (italic) untuk efek suara atau instruksi (*tarik napas*, *tertawa kecil*, *jeda 2 detik*).
`

  const userPrompt = `Tolong buatkan naskah podcast berdasarkan detail berikut:
- Topik / Judul Buku: ${topic}
- Nama Host: ${author}
- Catatan Tambahan: ${notes || "Tidak ada catatan tambahan. Fokus bahas buku/topik tersebut secara umum."}
- Target Panjang Naskah: ${length}
`

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

  if (!response.ok) {
    const err = await response.text();
    throw new Error("Podcaster agent failed: " + err);
  }
  
  const data = await response.json();
  return data.choices[0].message.content;
}
