import { NextResponse } from 'next/server'
import { runSocialCrawler } from '@/lib/services/crawler'
import prisma from '@/lib/prisma'

export async function GET() {
  const trends = await prisma.socialTrend.findMany({
    orderBy: { createdAt: 'desc' }
  })
  return NextResponse.json(trends)
}

export async function POST(req: Request) {
  try {
    const { keyword } = await req.json()
    if (!keyword) return NextResponse.json({ error: 'Keyword required' }, { status: 400 })

    const trends = await runSocialCrawler(keyword)
    return NextResponse.json({ success: true, trends })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
