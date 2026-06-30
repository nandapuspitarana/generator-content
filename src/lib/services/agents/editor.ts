export async function runEditor(draft: string, notes: string, apiKey: string): Promise<string> {
  const systemPrompt = `Kamu adalah AI Editor profesional.
Tugasmu adalah memeriksa, menyunting, dan meningkatkan kualitas artikel ulasan buku (format Markdown).
Pastikan:
1. Tidak ada kesalahan ejaan atau tata bahasa.
2. Alur kalimat mengalir dengan baik dan logis.
3. Gaya bahasa tetap profesional, berwibawa, dan informatif.
4. Jangan merusak struktur Markdown (seperti #, ##, ###, dan tautan).
5. Jangan pernah mengubah tautan afiliasi (Affiliate Link) di akhir tulisan.

Kembalikan artikel utuh hasil suntinganmu (hanya artikel Markdown-nya, tanpa ada teks awalan/akhiran/komentar darimu).`;

  const userPrompt = `Tinjau dan sempurnakan draf artikel berikut ini.
Pastikan juga semua poin penting dari "Catatan Mentah" telah tercakup dengan baik.

Catatan Mentah:
${notes || "Tidak ada catatan khusus."}

Draf Artikel Asli:
${draft}

Berikan saya hasil revisinya secara utuh.`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o", // Editor menggunakan model yang lebih pintar untuk reasoning
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.3, // Lebih rendah agar tidak terlalu mengubah fakta
    }),
  });

  if (!response.ok) {
    throw new Error("Editor agent failed to respond.");
  }
  
  const data = await response.json();
  return data.choices[0].message.content;
}
