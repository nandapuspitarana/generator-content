export function chunkText(text: string, maxLength: number = 40000): string[] {
  if (text.length <= maxLength) return [text];
  
  const chunks: string[] = [];
  let currentPos = 0;
  
  while (currentPos < text.length) {
    if (currentPos + maxLength >= text.length) {
      chunks.push(text.slice(currentPos));
      break;
    }
    
    // Cari batas newline ganda (paragraf)
    let breakPoint = text.lastIndexOf('\n\n', currentPos + maxLength);
    if (breakPoint <= currentPos) {
      // Jika tidak ada, cari newline tunggal
      breakPoint = text.lastIndexOf('\n', currentPos + maxLength);
      if (breakPoint <= currentPos) {
        breakPoint = currentPos + maxLength; // paksa potong
      }
    }
    
    chunks.push(text.slice(currentPos, breakPoint));
    currentPos = breakPoint;
  }
  
  return chunks;
}

async function runContentCreator(topic: string, chunk: string, index: number, total: number, apiKey: string): Promise<string> {
  const systemPrompt = `Kamu adalah Agen Content Creator untuk sebuah podcast.
Tugasmu adalah membaca sebagian (chunk ${index + 1} dari ${total}) dari teks referensi tentang topik "${topic}", lalu mengekstrak inti-inti materinya menjadi sebuah naskah kasar/monolog (draft segmen).
Fokus pada substansi: jelaskan konsep, ide, dan informasi penting dari teks ini dengan cara yang mendidik namun santai.
Jangan membuat intro/outro podcast (seperti "Halo semua"), langsung bahas isi materinya saja karena ini hanya akan jadi satu segmen dari podcast utuh.
Tulis dalam format teks biasa (plain text), jangan gunakan markdown (**).`;

  const userPrompt = `Teks Referensi (Bagian ${index + 1} dari ${total}):\n\n${chunk}\n\nBuatlah draft segmen podcast dari materi di atas.`;

  return await callOpenAI("gpt-4o-mini", systemPrompt, userPrompt, apiKey);
}

async function runEditor(topic: string, draft: string, apiKey: string): Promise<string> {
  const systemPrompt = `Kamu adalah Agen Editor Naskah Podcast Profesional.
Tugasmu adalah memoles draft kasar segmen podcast tentang "${topic}" menjadi naskah yang sangat asik didengar, mengalir (conversational), dan enak dibaca oleh pengisi suara AI Fish-Speech.
Aturan:
1. Ubah bahasa yang terlalu kaku menjadi gaya bahasa lisan (storytelling) yang natural dan engaging.
2. JANGAN tambahkan sapaan pembuka (intro) atau penutup (outro). Tetap jadikan ini segmen isi (body).
3. HANYA Teks Murni (Plain Text). JANGAN gunakan Markdown (jangan ada **bold** atau # heading).
4. Sisipkan tag jeda dan ekspresi vokal alami (34 Vocal Tags) pada tempat-tempat yang tepat:
   - Jeda & Napas: [pause], [short pause], [inhale], [exhale], [sigh], [clearing throat], [panting], [tsk], atau <break time="1s"/>
   - Tawa & Ceria: [laughing], [chuckle], [chuckling], [laughing tone], [delight], [audience laughter]
   - Dinamika Suara: [emphasis], [whisper], [low voice], [low volume], [volume down], [loud], [volume up], [screaming], [shouting]
   - Emosi & Karakter: [excited], [excited tone], [surprised], [shocked], [angry], [sad], [singing], [echo], [interrupting], [moaning], [with strong accent]`;

  const userPrompt = `Draft Segmen Kasar:\n\n${draft}\n\nTolong edit dan perbaiki naskah ini agar lebih asik didengar (lisan) dan tambahkan tag jeda serta ekspresi vokal yang tepat.`;

  return await callOpenAI("gpt-4o-mini", systemPrompt, userPrompt, apiKey);
}

async function runBundler(topic: string, author: string, segments: string[], notes: string, length: string, apiKey: string): Promise<string> {
  const systemPrompt = `Kamu adalah Agen Bundler Podcast Utama (Head Writer).
Tugasmu adalah menyatukan beberapa segmen naskah yang terpisah menjadi satu naskah podcast utuh yang super mulus (seamless), asik, dan menarik.

Struktur yang harus kamu buat:
1. Intro: Sapa pendengar dengan hangat, sebutkan namamu (${author}) sebagai host, dan berikan pancingan (hook) kuat tentang topik "${topic}".
2. Body: Rangkai segmen-segmen yang diberikan. Kamu BEBAS menambahkan kalimat transisi antar segmen agar ceritanya mengalir dengan sangat mulus.
3. Outro: Kesimpulan yang kuat, pesan penutup (call to action untuk terus belajar/mencari tahu), dan salam penutup.

Catatan Tambahan Khusus (JIKA ADA, WAJIB IKUTI):
${notes || "Tidak ada catatan tambahan."}

Instruksi Panjang Naskah: Target panjang naskah akhir adalah ${length.toUpperCase()}.
- SHORT: ~400 kata
- MEDIUM: ~850 kata
- LONG: ~1800 kata
Sesuaikan elaborasi dan kecepatan alur cerita untuk mencapai target durasi ini sebaik mungkin.

Aturan Format (SANGAT PENTING - Fish-Speech & Studio Audio Ready):
1. Hasil akhir HARUS berupa Teks Murni (Plain Text) yang langsung siap dibacakan oleh mesin Text-to-Speech (Fish-Speech Studio).
2. JANGAN gunakan format Markdown (jangan gunakan **bold**, *italic*, atau # heading).
3. JANGAN tuliskan label pembicara seperti "Host:". Langsung tuliskan naskah lisan.
4. Manfaatkan tag ekspresi vokal dan jeda alami secara proporsional untuk menghidupkan percakapan:
   - Jeda & Napas: [pause] (1s), [short pause] (0.5s), [inhale], [exhale], [sigh], [clearing throat], [panting], [tsk], atau <break time="1s"/>, <break time="1.5s"/>, <break time="2s"/>
   - Tawa & Respon: [laughing], [chuckle], [chuckling], [laughing tone], [delight], [audience laughter]
   - Dinamika Suara: [emphasis], [whisper], [low voice], [low volume], [volume down], [loud], [volume up], [screaming], [shouting]
   - Emosi & Mood: [excited], [excited tone], [surprised], [shocked], [angry], [sad], [singing], [echo], [interrupting], [moaning], [with strong accent]
5. Istilah Bahasa Inggris & Buku Asing: Jika materi referensi mengandung istilah bahasa Inggris, judul buku internasional, atau konsep teknis (contoh: 'Thinking, Fast and Slow', 'Atomic Habits', 'deep work'), pertahankan ejaan asli bahasa Inggris dengan benar agar pelafalan oleh suara AI terdengar natural dan fasih. Jika naskah referensi sepenuhnya berbahasa Inggris, hasilkan naskah utuh berbahasa Inggris.`;

  const combinedSegments = segments.map((seg, i) => `--- SEGMEN ${i + 1} ---\n${seg}`).join("\n\n");

  const userPrompt = `Tolong satukan dan buat naskah final podcast berdasarkan segmen-segmen berikut:\n\n${combinedSegments}`;

  return await callOpenAI("gpt-4o", systemPrompt, userPrompt, apiKey);
}

async function callOpenAI(model: string, systemPrompt: string, userPrompt: string, apiKey: string): Promise<string> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI Agent (${model}) failed: ` + err);
  }
  
  const data = await response.json();
  let content = data.choices[0].message.content.trim();
  if (content.startsWith("```markdown")) {
    content = content.replace(/^```markdown\n?/i, "").replace(/\n?```$/i, "").trim();
  } else if (content.startsWith("```")) {
    content = content.replace(/^```\n?/i, "").replace(/\n?```$/i, "").trim();
  }
  
  return content;
}

export async function runPodcaster(topic: string, author: string, sourceText: string, notes: string, length: string, apiKey: string): Promise<string> {
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is required for podcast generator.");
  }

  // 1. Chunking text (max 40k chars per chunk to safely fit gpt-4o-mini window and response limits)
  const chunks = chunkText(sourceText, 40000);
  
  // 2. Content Creator (Map)
  const creatorPromises = chunks.map((chunk, i) => runContentCreator(topic, chunk, i, chunks.length, apiKey));
  const rawSegments = await Promise.all(creatorPromises);
  
  // 3. Editor (Map)
  const editorPromises = rawSegments.map(segment => runEditor(topic, segment, apiKey));
  const editedSegments = await Promise.all(editorPromises);
  
  // 4. Bundler (Reduce)
  const finalScript = await runBundler(topic, author, editedSegments, notes, length, apiKey);
  
  return finalScript;
}
