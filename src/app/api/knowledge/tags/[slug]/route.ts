import { NextRequest, NextResponse } from 'next/server'
import esClient from '@/lib/elasticsearch'

const TAGS_INDEX = 'acg_knowledge_tags'
const CHAPTERS_INDEX = 'acg_knowledge_chapters'

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const resolvedParams = await params
    const { slug } = resolvedParams
    
    let tag = null
    try {
      const tagRes = await esClient.search({
        index: TAGS_INDEX,
        query: { match: { slug: slug } }
      })
      if (tagRes.hits.hits.length > 0) {
        tag = (tagRes.hits.hits[0] as any)._source
      }
    } catch(e) {}
    
    if (!tag) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 })
    }
    
    let chapters: any[] = []
    try {
      const chapRes = await esClient.search({
        index: CHAPTERS_INDEX,
        size: 1000,
        query: { match: { tagSlug: slug } },
        sort: [{ chapterNumber: { order: 'asc', unmapped_type: 'long' } }]
      })
      chapters = chapRes.hits.hits.map((h: any) => h._source)
    } catch(e: any) {
      // index might not exist yet
    }
    
    return NextResponse.json({ tag, chapters })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const resolvedParams = await params
    const { slug } = resolvedParams
    const body = await req.json()
    
    const tagRes = await esClient.search({
      index: TAGS_INDEX,
      query: { match: { slug: slug } }
    })
    
    if (tagRes.hits.hits.length === 0) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 })
    }
    
    const hit = tagRes.hits.hits[0] as any
    const id = hit._id
    
    await esClient.update({
      index: TAGS_INDEX,
      id: id,
      doc: {
        ...body,
        updatedAt: new Date().toISOString()
      },
      refresh: true
    })
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const resolvedParams = await params
    const { slug } = resolvedParams
    
    try {
      await esClient.deleteByQuery({
        index: TAGS_INDEX,
        query: { match: { slug: slug } },
        refresh: true
      })
    } catch(e) {}
    
    try {
      await esClient.deleteByQuery({
        index: CHAPTERS_INDEX,
        query: { match: { tagSlug: slug } },
        refresh: true
      })
    } catch(e) {}
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
