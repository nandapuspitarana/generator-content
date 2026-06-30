import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { runDesigner } from '@/lib/services/agents/designer'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const article = await prisma.article.findUnique({ where: { id } })
    if (!article) return NextResponse.json({ error: 'Article not found' }, { status: 404 })

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'API Key missing' }, { status: 500 })

    const imageUrl = article.imageUrl || undefined

    const [bannerMedium, bannerInstagram] = await Promise.all([
      runDesigner(article.title, article.author, 'MEDIUM_16_9', imageUrl, apiKey),
      runDesigner(article.title, article.author, 'INSTAGRAM_1_1', imageUrl, apiKey),
    ])

    // Replace existing banner assets
    await prisma.articleAsset.deleteMany({ where: { articleId: id } })
    await prisma.articleAsset.createMany({
      data: [
        { articleId: id, platform: 'MEDIUM', assetType: 'HTML_BANNER', content: bannerMedium },
        { articleId: id, platform: 'INSTAGRAM', assetType: 'HTML_BANNER', content: bannerInstagram },
      ]
    })

    // Return fresh assets so client can update without a full page reload
    const updated = await prisma.article.findUnique({ where: { id }, include: { assets: true } })
    return NextResponse.json(updated)
  } catch (error: any) {
    console.error('Regenerate banner error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
