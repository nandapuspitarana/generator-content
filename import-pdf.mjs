import fs from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');
import { Client } from '@elastic/elasticsearch';
import crypto from 'crypto';

const esClient = new Client({
  node: 'http://localhost:9201',
});

const TAGS_INDEX = 'acg_knowledge_tags';
const CHAPTERS_INDEX = 'acg_knowledge_chapters';

function cleanText(text) {
  // Remove watermark if any
  text = text.replace(/www\.fx1618\.com/gi, '');
  // Remove lone page numbers (like a number alone on a line)
  text = text.replace(/\n\s*\d+\s*\n/g, '\n');
  // Remove excessive newlines
  text = text.replace(/\n{3,}/g, '\n\n');
  return text.trim();
}

function chunkText(rawText, chunkSize = 15000) {
  const text = cleanText(rawText);
  const chunks = [];
  
  // Try to find natural chapter breaks
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
    // Fallback to size-based chunking if regex didn't find chapters
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

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

async function run() {
  console.log('Reading PDF...');
  const dataBuffer = fs.readFileSync('The Intelligent Investor - BENJAMIN GRAHAM.pdf');
  
  console.log('Parsing PDF (this might take a while for large PDFs)...');
  const pdfData = await pdfParse(dataBuffer);
  const text = pdfData.text;
  
  console.log(`Extracted ${text.length} characters.`);
  
  const rawTitle = 'The Intelligent Investor - BENJAMIN GRAHAM';
  const slug = slugify(rawTitle);

  const tagDoc = {
    id: crypto.randomUUID(),
    slug: slug,
    category: 'Buku PDF',
    type: 'book',
    title: rawTitle,
    summary: `Hasil ekstrak otomatis dari file PDF. Terdiri dari ${pdfData.numpages} halaman asli.`,
    writingStyle: 'santai-storytelling',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  console.log('Inserting Tag into Elasticsearch...');
  try {
    await esClient.indices.create({ index: TAGS_INDEX });
  } catch(e) {}
  
  await esClient.index({
    index: TAGS_INDEX,
    id: tagDoc.id,
    document: tagDoc,
    refresh: true
  });

  try {
    await esClient.indices.create({ index: CHAPTERS_INDEX });
  } catch(e) {}
  
  console.log('Chunking text...');
  const chunks = chunkText(text, 15000);
  console.log(`Created ${chunks.length} chunks.`);
  
  console.log('Inserting chapters one by one...');
  for (let i = 0; i < chunks.length; i++) {
    const doc = {
      id: crypto.randomUUID(),
      tagSlug: tagDoc.slug,
      chapterNumber: i + 1,
      chapterTitle: `Bagian ${i + 1}`,
      originalContent: chunks[i],
      storyVersion: '',
      podcastScript: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    try {
      await esClient.index({
        index: CHAPTERS_INDEX,
        id: doc.id,
        document: doc
      });
      console.log(`Inserted chunk ${i + 1} of ${chunks.length}`);
    } catch (e) {
      console.error(`Failed to insert chunk ${i + 1}:`, e.message);
    }
  }
  
  // Refresh indices after all inserts
  await esClient.indices.refresh({ index: CHAPTERS_INDEX });
  
  console.log('Done!');
}

run().catch(console.error);
