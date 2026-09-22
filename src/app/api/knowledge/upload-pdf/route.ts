import { NextRequest, NextResponse } from 'next/server'
import esClient from '@/lib/elasticsearch'
const pdfParse = require('pdf-parse')

const TAGS_INDEX = 'acg_knowledge_tags'
const CHAPTERS_INDEX = 'acg_knowledge_chapters'

function cleanText(text: string): string {
  let cleaned = text.replace(/www\.fx1618\.com/gi, '');
  cleaned = cleaned.replace(/\n\s*\d+\s*\n/g, '\n');
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  return cleaned.trim();
}

function chunkText(rawText: string, chunkSize: number = 15000): string[] {
  const text = cleanText(rawText);
  const chunks: string[] = [];
  
  const regex = /\n\s*(?:COMMENTARY ON CHAPTER \d+|CHAPTER \d+|[1-9][0-9]?\.\s*[A-Z])/gi;
  let lastIndex = 0;
  let match;
  
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      chunks.push(text.slice(lastIndex, match.index).trim());
    }
    lastIndex = match.index;
  }
  if (lastIndex < text.length) {
    chunks.push(text.slice(lastIndex).trim());
  }
  
  let validChunks = chunks.filter(c => c.length > 500);
  
  if (validChunks.length < 5) {
    validChunks = [];
    let currentIndex = 0;
    while (currentIndex < text.length) {
      let nextIndex = currentIndex + chunkSize;
      if (nextIndex < text.length) {
        let breakIndex = text.lastIndexOf('\n\n', nextIndex);
        if (breakIndex > currentIndex) {
          nextIndex = breakIndex + 2;
        } else {
          breakIndex = text.lastIndexOf('\n', nextIndex);
          if (breakIndex > currentIndex) {
            nextIndex = breakIndex + 1;
          }
        }
      }
      validChunks.push(text.slice(currentIndex, nextIndex).trim());
      currentIndex = nextIndex;
    }
  }
  
  return validChunks.filter(c => c.length > 100);
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const style = formData.get('style') as string || 'santai-storytelling'
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    
    // Parse PDF
    const pdfData = await pdfParse(buffer)
    const text = pdfData.text
    
    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: 'Failed to extract text dari PDF. Mungkin PDF hasil scan berupa gambar.' }, { status: 400 })
    }

    // Prepare Tag
    const rawTitle = file.name.replace('.pdf', '')
    const baseSlug = slugify(rawTitle)
    let slug = baseSlug
    
    // Ensure slug is unique
    let slugSuffix = 0
    let isUnique = false
    while (!isUnique) {
      try {
        const checkRes = await esClient.search({
          index: TAGS_INDEX,
          query: { term: { 'slug.keyword': slug } }
        })
        if (checkRes.hits.hits.length > 0) {
          slugSuffix++
          slug = `${baseSlug}-${slugSuffix}`
        } else {
          isUnique = true
        }
      } catch (e: any) {
        if (e.message?.includes('index_not_found')) {
          isUnique = true
        } else {
          throw e
        }
      }
    }

    const tagDoc = {
      id: crypto.randomUUID(),
      slug: slug,
      category: 'Buku PDF',
      type: 'book',
      title: rawTitle,
      summary: `Hasil ekstrak otomatis dari file PDF: ${file.name}. Terdiri dari ${pdfData.numpages} halaman asli.`,
      writingStyle: style,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    
    // Create tags index if not exists
    try {
      await esClient.indices.create({ index: TAGS_INDEX })
    } catch(e) {}
    
    await esClient.index({
      index: TAGS_INDEX,
      id: tagDoc.id,
      document: tagDoc,
      refresh: 'wait_for'
    })

    // Create chapters index if not exists
    try {
      await esClient.indices.create({ index: CHAPTERS_INDEX })
    } catch(e) {}
    
    // Chunk text
    const chunks = chunkText(text, 15000)
    
    // Insert chapters via bulk
    const operations = chunks.flatMap((chunk, index) => {
      const doc = {
        id: crypto.randomUUID(),
        tagSlug: tagDoc.slug,
        chapterNumber: index + 1,
        chapterTitle: `Bagian ${index + 1}`,
        originalContent: chunk,
        storyVersion: '',
        podcastScript: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      return [
        { index: { _index: CHAPTERS_INDEX, _id: doc.id } },
        doc
      ]
    })
    
    if (operations.length > 0) {
      // Background indexing without blocking HTTP response with Lucene refresh
      await esClient.bulk({ operations })
    }
    
    return NextResponse.json({ tag: tagDoc, chunksCount: chunks.length })
  } catch (error: any) {
    console.error('PDF Upload Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
