import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const articles = await prisma.article.findMany({
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(articles)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch articles' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { title, author, notes, affiliateLink, imageUrl, scheduledAt } = body

    const article = await prisma.article.create({
      data: {
        title,
        author,
        notes,
        affiliateLink,
        imageUrl,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        status: 'IDEATION'
      }
    })

    return NextResponse.json(article)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create article' }, { status: 500 })
  }
}
