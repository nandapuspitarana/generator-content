export async function runEvaluator(draft: string, apiKey: string): Promise<{ score: number, suggestions: string }> {
  const systemPrompt = `Kamu adalah AI Monetization Evaluator profesional.
Tugasmu adalah menganalisis draf artikel ulasan buku (Markdown) dan mengevaluasi potensinya dalam menghasilkan klik pada tautan pembelian (konversi afiliasi).
Berikan penilaian (skor 1-100) dan saran singkat (1-2 kalimat) perbaikan agar artikel lebih persuasif tanpa terkesan "hard selling".

Wajib kembalikan jawaban HANYA dalam format JSON yang valid dengan struktur:
{
  "score": 85,
  "suggestions": "Tambahkan kalimat Call to Action yang lebih kuat dan emosional setelah kesimpulan."
}`;

  const userPrompt = `Evaluasi draf artikel berikut ini:
${draft}`;

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
      temperature: 0.3,
      response_format: { type: "json_object" }
    }),
  });

  if (!response.ok) {
    throw new Error("Evaluator agent failed to respond.");
  }
  
  const data = await response.json();
  const resultStr = data.choices[0].message.content;
  return JSON.parse(resultStr);
}
