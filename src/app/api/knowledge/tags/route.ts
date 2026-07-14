import { NextRequest, NextResponse } from 'next/server'
import esClient from '@/lib/elasticsearch'

const INDEX = 'acg_knowledge_tags'

export async function GET() {
  try {
    let result;
    try {
      result = await esClient.search({
        index: INDEX,
        size: 100,
        sort: [{ createdAt: { order: 'desc', unmapped_type: 'date' } }]
      })
    } catch (e: any) {
      if (e.message?.includes('index_not_found_exception') || e.message?.includes('index_not_found')) {
        return NextResponse.json([])
      }
      throw e;
    }
    
    const tags = result.hits.hits.map((h: any) => h._source)
    return NextResponse.json(tags)
  } catch (error: any) {
    console.error('ES Get Tags Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    try {
      await esClient.indices.create({ index: INDEX })
    } catch (e: any) {
      if (!e.message?.includes('resource_already_exists_exception')) {
        // ignore if index exists
      }
    }
    
    const doc = {
      id: crypto.randomUUID(),
      slug: body.slug,
      category: body.category,
      type: body.type,
      title: body.title,
      summary: body.summary || '',
      writingStyle: body.writingStyle || 'santai-storytelling',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    
    try {
      const searchRes = await esClient.search({
        index: INDEX,
        query: { match: { slug: doc.slug } }
      })
      if (searchRes.hits.hits.length > 0) {
        return NextResponse.json({ error: 'Slug already exists' }, { status: 400 })
      }
    } catch(e) {}
    
    await esClient.index({
      index: INDEX,
      id: doc.id,
      document: doc,
      refresh: true
    })
    
    return NextResponse.json(doc)
  } catch (error: any) {
    console.error('ES Post Tag Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
