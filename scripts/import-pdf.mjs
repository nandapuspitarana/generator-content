import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');
import { Client } from '@elastic/elasticsearch';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const esClient = new Client({
  node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
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
  
  return validChunks;
}

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

async function run() {
  const pdfPath = process.argv[2] 
    ? path.resolve(process.cwd(), process.argv[2])
    : path.resolve(ROOT_DIR, 'The Intelligent Investor - BENJAMIN GRAHAM.pdf');

  if (!fs.existsSync(pdfPath)) {
    console.error(`File PDF tidak ditemukan: ${pdfPath}`);
    process.exit(1);
  }

  console.log(`Reading PDF from: ${pdfPath}...`);
  const dataBuffer = fs.readFileSync(pdfPath);
  
  console.log('Parsing PDF (this might take a while for large PDFs)...');
  const pdfData = await pdfParse(dataBuffer);
  const text = pdfData.text;
  
  console.log(`Extracted ${text.length} characters.`);
  
  const baseName = path.basename(pdfPath, path.extname(pdfPath));
  const rawTitle = baseName;
  const slug = slugify(rawTitle);

  const tagDoc = {
    id: crypto.randomUUID(),
    slug: slug,
    category: 'Buku PDF',
    type: 'book',
    title: rawTitle,
    summary: `Hasil ekstrak otomatis dari file PDF. Terdiri dari ${pdfData.numpages} halaman asli.`,
    writingStyle: 'santai-storytelling',
    sourceUrl: pdfPath,
    status: 'completed',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  console.log(`Index tag: ${tagDoc.title} (${tagDoc.slug})`);
  await esClient.index({
    index: TAGS_INDEX,
    id: tagDoc.id,
    document: tagDoc,
    refresh: true,
  });

  const chunks = chunkText(text);
  console.log(`Split into ${chunks.length} chapters/segments.`);

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    // Ambil baris pertama sebagai judul bab jika memungkinkan
    const firstLine = chunk.split('\n')[0].trim().slice(0, 100);
    const chapterTitle = firstLine.length > 5 ? firstLine : `Bagian ${i + 1}`;
    
    const chapterDoc = {
      id: crypto.randomUUID(),
      tagId: tagDoc.id,
      tagSlug: slug,
      chapterNumber: i + 1,
      title: chapterTitle,
      content: chunk,
      keyTakeaways: [],
      createdAt: new Date().toISOString(),
    };

    await esClient.index({
      index: CHAPTERS_INDEX,
      id: chapterDoc.id,
      document: chapterDoc,
    });
    
    process.stdout.write(`\rIndexed chapter ${i + 1}/${chunks.length}`);
  }

  await esClient.indices.refresh({ index: CHAPTERS_INDEX });
  console.log('\nDone! PDF imported successfully into Elasticsearch.');
}

run().catch(console.error);
