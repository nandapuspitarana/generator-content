import { NextRequest, NextResponse } from 'next/server'
import esClient from '@/lib/elasticsearch'

const INDEX = 'acg_knowledge_chapters'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    try {
      await esClient.indices.create({ index: INDEX })
    } catch (e: any) {
      if (!e.message?.includes('resource_already_exists_exception')) {
        // ignore if exists
      }
    }
    
    const doc = {
      id: crypto.randomUUID(),
      tagSlug: body.tagSlug,
      chapterNumber: Number(body.chapterNumber),
      chapterTitle: body.chapterTitle,
      originalContent: body.originalContent,
      storyVersion: '',
      podcastScript: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    
    await esClient.index({
      index: INDEX,
      id: doc.id,
      document: doc,
      refresh: true
    })
    
    return NextResponse.json(doc)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
