import { NextRequest, NextResponse } from 'next/server'
import esClient from '@/lib/elasticsearch'
import { chatWithBook } from '@/lib/services/llm'

const INDEX = 'acg_chat_messages'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const sessionId = searchParams.get('sessionId')

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 })
    }

    let messages = []
    try {
      const result = await esClient.search({
        index: INDEX,
        size: 200,
        query: { match: { sessionId } },
        sort: [{ createdAt: { order: 'asc', unmapped_type: 'date' } }]
      })
      messages = result.hits.hits.map((h: any) => h._source)
    } catch (e: any) {
      if (e.message?.includes('index_not_found')) {
        return NextResponse.json([])
      }
    }

    return NextResponse.json(messages)
  } catch (error: any) {
    console.error('ES Get Chat Messages Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { sessionId, tagSlug, content, history = [] } = body

    if (!sessionId || !tagSlug || !content) {
      return NextResponse.json({ error: 'sessionId, tagSlug, and content are required' }, { status: 400 })
    }

    // Ensure index exists
    try {
      await esClient.indices.create({ index: INDEX })
    } catch(e) {}

    // 1. Save user message
    const userMsg = {
      id: crypto.randomUUID(),
      sessionId,
      role: 'user',
      content,
      createdAt: new Date().toISOString()
    }
    await esClient.index({ index: INDEX, id: userMsg.id, document: userMsg })

    // 2. Retrieve context from Knowledge Base
    let tag = null
    try {
      const tagRes = await esClient.search({
        index: 'acg_knowledge_tags',
        query: { match: { slug: tagSlug } }
      })
      if (tagRes.hits.hits.length > 0) {
        tag = (tagRes.hits.hits[0] as any)._source
      }
    } catch(e) {}

    if (!tag) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 })
    }

    // Perform naive RAG using Elasticsearch full-text search on chapter content
    let relevantChapters = []
    try {
      const searchRes = await esClient.search({
        index: 'acg_knowledge_chapters',
        size: 3, // take top 3 most relevant chunks
        query: {
          bool: {
            must: [
              { match: { tagSlug } }
            ],
            should: [
              { match: { originalContent: content } },
              { match: { chapterTitle: content } }
            ]
          }
        }
      })
      relevantChapters = searchRes.hits.hits.map((h: any) => h._source)
    } catch(e) {}

    // 3. Get AI Response
    const aiResponseText = await chatWithBook(tag, content, history, relevantChapters)

    // 4. Save assistant message
    const assistantMsg = {
      id: crypto.randomUUID(),
      sessionId,
      role: 'assistant',
      content: aiResponseText,
      createdAt: new Date().toISOString()
    }
    await esClient.index({ index: INDEX, id: assistantMsg.id, document: assistantMsg, refresh: true })

    return NextResponse.json(assistantMsg)
  } catch (error: any) {
    console.error('ES Post Chat Message Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
