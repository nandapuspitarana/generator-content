import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { runIdeator } from '@/lib/services/agents/ideator'
import { runWriter } from '@/lib/services/agents/writer'
import { runEditor } from '@/lib/services/agents/editor'
import { runDesigner } from '@/lib/services/agents/designer'
import { runEvaluator } from '@/lib/services/agents/evaluator'
import { runPodcaster } from '@/lib/services/agents/podcaster'
import esClient from '@/lib/elasticsearch'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const article = await prisma.article.findUnique({ where: { id } })
    if (!article) return NextResponse.json({ error: 'Article not found' }, { status: 404 })

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'API Key missing' }, { status: 500 })

    let extendedNotes = article.notes || '';
    if (article.knowledgeTagSlug) {
      try {
        const tagRes = await esClient.search({
          index: 'acg_knowledge_tags',
          query: { match: { slug: article.knowledgeTagSlug } }
        });
        const tagDoc: any = tagRes.hits.hits[0]?._source;

        const chapterRes = await esClient.search({
          index: 'acg_knowledge_chapters',
          query: {
            bool: {
              must: [
                { match: { tagSlug: article.knowledgeTagSlug } },
                {
                  multi_match: {
                    query: article.title + " " + (article.notes || ''),
                    fields: ['chapterTitle^2', 'originalContent']
                  }
                }
              ]
            }
          },
          size: 3
        });
        const chapters = chapterRes.hits.hits.map((h: any) => h._source);
        
        let kbContext = `\n\n[INFO BUKU (KNOWLEDGE BASE)]\n`;
        if (tagDoc && tagDoc.summary) kbContext += `Ringkasan Buku: ${tagDoc.summary}\n\n`;
        if (chapters.length > 0) {
          kbContext += `Referensi Bab Terkait:\n`;
          chapters.forEach((c: any) => {
            kbContext += `- Bab ${c.chapterNumber} (${c.chapterTitle}):\n${c.originalContent.substring(0, 1500)}...\n\n`;
          });
        }
        extendedNotes += kbContext;
      } catch (e) {
        console.error("Failed to fetch knowledge base for generation", e);
      }
    }

    if (article.contentType === 'PODCAST') {
      await prisma.article.update({ where: { id: article.id }, data: { status: 'DRAFTING' } })
      const podcastScript = await runPodcaster(
        article.title, 
        article.author || 'AI Host', 
        extendedNotes, 
        article.notes || '', 
        'MEDIUM', 
        apiKey
      )
      
      const finalArticle = await prisma.article.update({
        where: { id: article.id },
        data: { 
          status: 'READY', 
          markdownContent: podcastScript 
        },
        include: { assets: true }
      })
      return NextResponse.json(finalArticle)
    }

    // Step 1: Ideator
    await prisma.article.update({ where: { id: article.id }, data: { status: 'IDEATION' } })
    const outline = await runIdeator(article.title, article.author, extendedNotes, apiKey)

    // Step 2: Writer
    await prisma.article.update({ where: { id: article.id }, data: { status: 'DRAFTING' } })
    const draft = await runWriter(article.title, article.author, outline, article.affiliateLink || undefined, apiKey)

    // Step 3: Editor
    await prisma.article.update({ where: { id: article.id }, data: { status: 'EDITING' } })
    const finalMarkdown = await runEditor(draft, article.notes || '', apiKey)

    // Step 3.5: Evaluator (Monetization Check)
    const evaluation = await runEvaluator(finalMarkdown, apiKey)

    // Step 4: Designer
    await prisma.article.update({ where: { id: article.id }, data: { status: 'DESIGNING' } })
    
    let processedImageUrl = article.imageUrl || undefined;

    const bannerMedium = await runDesigner(article.title, article.author, 'MEDIUM_16_9', processedImageUrl, apiKey)
    const bannerInstagram = await runDesigner(article.title, article.author, 'INSTAGRAM_1_1', processedImageUrl, apiKey)

    // Save Assets
    await prisma.articleAsset.deleteMany({ where: { articleId: article.id } }) // clean old
    await prisma.articleAsset.create({
      data: { articleId: article.id, platform: 'MEDIUM', assetType: 'HTML_BANNER', content: bannerMedium }
    })
    await prisma.articleAsset.create({
      data: { articleId: article.id, platform: 'INSTAGRAM', assetType: 'HTML_BANNER', content: bannerInstagram }
    })

    // Step 5: Ready
    const finalArticle = await prisma.article.update({
      where: { id: article.id },
      data: { 
        status: 'READY', 
        markdownContent: finalMarkdown,
        monetizationValue: evaluation.score,
        notes: (article.notes || '') + `\n\n[AI Evaluator Suggestion]: ${evaluation.suggestions}`
      },
      include: { assets: true }
    })

    return NextResponse.json(finalArticle)
  } catch (error: any) {
    console.error("Generation error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
