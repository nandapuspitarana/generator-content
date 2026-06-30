import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { publishToMedium } from '@/lib/services/medium'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const token = process.env.MEDIUM_TOKEN
    if (!token) {
      return NextResponse.json({ error: 'MEDIUM_TOKEN is not set in .env.local' }, { status: 500 })
    }

    // Cari semua artikel yang sudah READY dan jadwal tayangnya sudah lewat
    const articlesToPublish = await prisma.article.findMany({
      where: {
        status: 'READY',
        scheduledAt: { lte: new Date() }
      }
    })

    if (articlesToPublish.length === 0) {
      return NextResponse.json({ message: 'Tidak ada artikel yang perlu dipublikasikan saat ini' })
    }

    const results = []
    for (const article of articlesToPublish) {
      if (!article.markdownContent) continue

      try {
        const url = await publishToMedium(article.title, article.markdownContent, token)
        await prisma.article.update({
          where: { id: article.id },
          data: { status: 'PUBLISHED', mediumUrl: url }
        })
        results.push({ id: article.id, status: 'success', url })
      } catch (err: any) {
        console.error("Medium publish error for article", article.id, err)
        results.push({ id: article.id, status: 'error', error: err.message })
      }
    }

    return NextResponse.json({ processed: results.length, results })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
