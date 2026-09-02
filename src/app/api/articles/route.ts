import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { ArticleInputSchema } from '@/lib/validation/schemas'

export async function GET() {
  try {
    const articles = await prisma.article.findMany({
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(articles)
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch articles' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const validationResult = ArticleInputSchema.safeParse(body)
    
    if (!validationResult.success) {
      const errorMsg = validationResult.error.issues.map(i => i.message).join(", ")
      return NextResponse.json({ error: errorMsg, details: validationResult.error.issues }, { status: 400 })
    }

    const { title, author, notes, affiliateLink, imageUrl, scheduledAt, knowledgeTagSlug, contentType } = validationResult.data

    const article = await prisma.article.create({
      data: {
        title,
        author,
        notes: notes || null,
        affiliateLink: affiliateLink || null,
        imageUrl: imageUrl || null,
        knowledgeTagSlug: knowledgeTagSlug || null,
        contentType: contentType || 'ARTICLE',
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        status: 'IDEATION'
      }
    })

    return NextResponse.json(article, { status: 201 })
  } catch (error: any) {
    console.error("POST /api/articles error:", error)
    return NextResponse.json({ error: error.message || 'Failed to create article' }, { status: 500 })
  }
}
