import { NextRequest, NextResponse } from 'next/server'
import esClient from '@/lib/elasticsearch'
import { generateKnowledgeSummary, generateChapterStory, generatePodcastScript } from '@/lib/services/llm'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action, tagSlug, chapterId } = body
    
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
    
    if (!tag) return NextResponse.json({ error: 'Tag not found' }, { status: 404 })
    
    let chapters: any[] = []
    try {
      const chapRes = await esClient.search({
        index: 'acg_knowledge_chapters',
        size: 1000,
        query: { match: { tagSlug: tagSlug } },
        sort: [{ chapterNumber: { order: 'asc', unmapped_type: 'long' } }]
      })
      chapters = chapRes.hits.hits.map((h: any) => h._source)
    } catch(e) {}
    
    if (action === 'summarize') {
      const summary = await generateKnowledgeSummary(tag, chapters)
      
      const hit = await esClient.search({
        index: 'acg_knowledge_tags',
        query: { match: { slug: tagSlug } }
      })
      const id = (hit.hits.hits[0] as any)._id
      await esClient.update({
        index: 'acg_knowledge_tags',
        id: id,
        doc: { summary, updatedAt: new Date().toISOString() },
        refresh: true
      })
      return NextResponse.json({ success: true, summary })
    }
    else if (action === 'story') {
      const chapter = chapters.find(c => c.id === chapterId)
      if (!chapter) return NextResponse.json({ error: 'Chapter not found' }, { status: 404 })
      
      const storyVersion = await generateChapterStory(tag, chapter, tag.writingStyle)
      await esClient.update({
        index: 'acg_knowledge_chapters',
        id: chapterId,
        doc: { storyVersion, updatedAt: new Date().toISOString() },
        refresh: true
      })
      return NextResponse.json({ success: true, storyVersion })
    }
    else if (action === 'podcast-chapter') {
      const chapter = chapters.find(c => c.id === chapterId)
      if (!chapter) return NextResponse.json({ error: 'Chapter not found' }, { status: 404 })
      
      const podcastScript = await generatePodcastScript(tag, [chapter], 'chapter', 5)
      await esClient.update({
        index: 'acg_knowledge_chapters',
        id: chapterId,
        doc: { podcastScript, updatedAt: new Date().toISOString() },
        refresh: true
      })
      return NextResponse.json({ success: true, podcastScript })
    }
    else if (action === 'podcast-full') {
      const podcastScript = await generatePodcastScript(tag, chapters, 'full', 10)
      return NextResponse.json({ success: true, podcastScript })
    }
    
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (error: any) {
    console.error('Generate error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
