import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
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
        sourceContent = `\n\n=== MATERI REFERENSI UTAMA (ARTIKEL SUMBER) ===\n${sourceArticle.markdownContent}`
      }
    }

    // 2. Jalankan AI Podcaster Agent
    const podcastScript = await runPodcaster(data.title, data.author, data.notes + sourceContent, data.length, apiKey)

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
