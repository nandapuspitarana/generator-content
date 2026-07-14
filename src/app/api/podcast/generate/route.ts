import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import esClient from '@/lib/elasticsearch'
import { runPodcaster } from '@/lib/services/agents/podcaster'

export async function POST(req: Request) {
  try {
    const data = await req.json()
    const apiKey = process.env.OPENAI_API_KEY

    if (!apiKey) {
      return NextResponse.json({ error: 'OPENAI_API_KEY is not set in .env.local' }, { status: 500 })
    }

    // 1. Buat entri awal di database dengan tipe PODCAST
    const podcastArticle = await prisma.article.create({
      data: {
        title: data.title,
        author: data.author,
        notes: data.notes,
        contentType: 'PODCAST',
        status: 'DRAFTING', 
      }
    })

    let sourceContent = ""
    if (data.articleId) {
      const sourceArticle = await prisma.article.findUnique({ where: { id: data.articleId } })
      if (sourceArticle?.markdownContent) {
        sourceContent += `\n\n=== MATERI REFERENSI UTAMA (ARTIKEL SUMBER) ===\n${sourceArticle.markdownContent}`
      }
    }

    if (data.knowledgeTagSlug) {
      try {
        const chapRes = await esClient.search({
          index: 'acg_knowledge_chapters',
          size: 100,
          query: { match: { tagSlug: data.knowledgeTagSlug } },
          sort: [{ chapterNumber: { order: 'asc', unmapped_type: 'long' } }]
        })
        const chapters = chapRes.hits.hits.map((h: any) => h._source)
        if (chapters.length > 0) {
          const ragText = chapters.map((c: any) => {
            // Prioritaskan konten yang sudah diringkas agar tidak over-token
            const contentToUse = c.summary || c.storyVersion || c.originalContent || "";
            // Batasi per chapter max 10.000 karakter jika sangat panjang
            return `[Bagian ${c.chapterNumber} - ${c.chapterTitle}]:\n${contentToUse.substring(0, 10000)}`;
          }).join("\n\n---\n\n")
          sourceContent += `\n\n=== MATERI REFERENSI RAG (KNOWLEDGE BASE) ===\n${ragText}`
        }
      } catch (err) {
        console.error("Error fetching RAG for podcast:", err)
      }
    }


    // 2. Jalankan AI Podcaster Agent (Multi-Agent Pipeline)
    const notesStr = data.notes ? data.notes : "";
    const podcastScript = await runPodcaster(data.title, data.author, sourceContent, notesStr, data.length, apiKey)

    // 3. Simpan naskah dan set status menjadi READY
    const finalArticle = await prisma.article.update({
      where: { id: podcastArticle.id },
      data: { 
        status: 'READY',
        markdownContent: podcastScript 
      }
    })

    return NextResponse.json(finalArticle)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
