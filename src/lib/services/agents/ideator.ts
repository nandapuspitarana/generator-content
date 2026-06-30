export async function runIdeator(title: string, author: string, notes: string, apiKey: string): Promise<string> {
  const systemPrompt = `Kamu adalah AI Ideator (Pembuat Konsep) untuk ulasan buku profesional.
Tugasmu adalah membaca catatan pengguna dan mengubahnya menjadi *outline* (kerangka) tulisan yang komprehensif dan terstruktur. Kerangka ini nantinya akan digunakan oleh AI Writer untuk menyusun artikel lengkap.

Fokuskan kerangka pada:
1. Pembukaan (Pengenalan buku dan dampaknya)
2. Konsep Utama
3. Poin-poin penting (3 sub-judul yang kuat)
4. Kesimpulan`;

  const userPrompt = `Judul Buku: ${title}
Penulis: ${author}
Catatan Mentah Pengguna: ${notes || "Buatkan poin penting secara otomatis."}

Hasilkan kerangka tulisan (outline) yang jelas dan mendalam.`;

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
    throw new Error("Ideator agent failed to respond.");
  }
  
  const data = await response.json();
  return data.choices[0].message.content;
}
