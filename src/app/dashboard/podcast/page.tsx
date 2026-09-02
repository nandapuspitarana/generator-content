import * as React from "react"
import prisma from "@/lib/prisma"
import { PodcastFormWrapper } from "./podcast-form-wrapper"
import Link from "next/link"

export default async function PodcastGeneratorPage({ searchParams }: { searchParams: Promise<{ articleId?: string }> }) {
  const { articleId } = await searchParams;

  let selectedArticle = null;
  if (articleId) {
    selectedArticle = await prisma.article.findUnique({ where: { id: articleId } });
  }

  const existingArticles = await prisma.article.findMany({
    where: { contentType: "ARTICLE", markdownContent: { not: null } },
    select: { id: true, title: true, author: true, knowledgeTagSlug: true },
    orderBy: { createdAt: "desc" },
    take: 20
  });

  return (
    <div className="flex-1 p-6 md:p-10 max-w-[1000px] mx-auto w-full">
      {/* Editorial Header */}
      <div className="mb-8 border-b border-[#e8e7e0] pb-6">
        <div className="flex items-center gap-2 text-[11px] font-mono font-bold tracking-wider text-[#777777] uppercase mb-1">
          <span>AUDIO & BROADCAST</span>
          <span>/</span>
          <span className="text-[#c8102e]">AI PODCAST</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-[#191919] tracking-tight font-sans">
          AI Podcast Studio
        </h1>
        <p className="text-xs text-[#666666] mt-1 font-editorial-serif">
          Konversi naskah ulasan buku atau materi Knowledge Base menjadi script podcast edukatif dengan jeda suara SSML untuk Text-to-Speech (ElevenLabs).
        </p>
      </div>

      {/* Article Selector Banner if not preselected */}
      {!selectedArticle && existingArticles.length > 0 && (
        <div className="mb-8 p-5 bg-white rounded-xl border border-[#e8e7e0] shadow-xs">
          <label className="text-xs font-mono font-bold uppercase tracking-wider text-[#191919] block mb-2">
            Pilih dari Artikel yang Sudah Ada (Opsional)
          </label>
          <div className="flex flex-wrap gap-2">
            {existingArticles.slice(0, 5).map(art => (
              <Link
                key={art.id}
                href={`/dashboard/podcast?articleId=${art.id}`}
                className="text-xs px-3 py-1.5 rounded-lg border border-[#e8e7e0] hover:border-[#191919] bg-[#faf9f6] text-[#191919] font-medium transition-all"
              >
                {art.title}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Form Container */}
      <div className="bg-white p-6 md:p-8 rounded-xl border border-[#e8e7e0] shadow-xs">
        {selectedArticle && (
          <div className="mb-6 p-4 bg-[#f0eee6] rounded-lg border border-[#e8e7e0] flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono font-bold text-[#777777] uppercase block">Artikel Sumber Terpilih:</span>
              <span className="text-xs font-bold text-[#191919]">{selectedArticle.title}</span>
            </div>
            <Link
              href="/dashboard/podcast"
              className="text-xs font-semibold text-[#c8102e] hover:underline"
            >
              Reset Pilihan
            </Link>
          </div>
        )}

        <PodcastFormWrapper 
          articleId={selectedArticle?.id || ""} 
          defaultTitle={selectedArticle ? `[Podcast] ${selectedArticle.title}` : ""} 
          defaultAuthor={selectedArticle?.author || ""} 
          defaultKnowledgeTagSlug={selectedArticle?.knowledgeTagSlug || ""} 
        />
      </div>
    </div>
  )
}
