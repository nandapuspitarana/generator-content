import { NextRequest, NextResponse } from 'next/server'
import esClient from '@/lib/elasticsearch'

const INDEX = 'acg_chat_sessions'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const tagSlug = searchParams.get('tagSlug')

    if (!tagSlug) {
      return NextResponse.json({ error: 'tagSlug is required' }, { status: 400 })
    }

    let sessions = []
    try {
      const result = await esClient.search({
        index: INDEX,
        size: 50,
        query: { match: { tagSlug } },
        sort: [{ createdAt: { order: 'desc', unmapped_type: 'date' } }]
      })
      sessions = result.hits.hits.map((h: any) => h._source)
    } catch (e: any) {
      if (e.message?.includes('index_not_found')) {
        return NextResponse.json([])
      }
    }

    return NextResponse.json(sessions)
  } catch (error: any) {
    console.error('ES Get Chat Sessions Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { tagSlug, title } = body

    if (!tagSlug || !title) {
      return NextResponse.json({ error: 'tagSlug and title are required' }, { status: 400 })
    }

    try {
      await esClient.indices.create({ index: INDEX })
    } catch (e: any) {
      if (!e.message?.includes('resource_already_exists')) {
        // ignore
      }
    }

    const doc = {
      id: crypto.randomUUID(),
      tagSlug,
      title,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    await esClient.index({
      index: INDEX,
      id: doc.id,
      document: doc,
      refresh: true
    })

    return NextResponse.json(doc)
  } catch (error: any) {
    console.error('ES Post Chat Session Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    // Delete the session
    try {
      await esClient.delete({
        index: INDEX,
        id: id,
        refresh: true
      })
    } catch(e) {}

    // Delete all messages in the session
    try {
      await esClient.deleteByQuery({
        index: 'acg_chat_messages',
        query: { match: { sessionId: id } },
        refresh: true
      })
    } catch(e) {}

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('ES Delete Chat Session Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
