import * as React from "react"
import prisma from "@/lib/prisma"
import { PodcastFormWrapper } from "./podcast-form-wrapper"

export default async function PodcastGeneratorPage({ searchParams }: { searchParams: Promise<{ articleId?: string }> }) {
  const { articleId } = await searchParams;

  if (!articleId) {
    return (
      <div className="flex-1 flex items-center justify-center p-10 h-full">
        <div className="bg-surface-container p-8 rounded-xl border border-outline-variant text-center max-w-md">
          <span className="material-symbols-outlined text-5xl text-secondary mb-4 opacity-50">article</span>
          <h2 className="text-lg font-semibold text-on-surface mb-2">Pilih Artikel Terlebih Dahulu</h2>
          <p className="text-sm text-secondary">
            Podcast script hanya dapat dibuat dari artikel atau draft yang sudah ada naskahnya.
            Silakan buka salah satu artikel dari Dashboard Anda dan klik tombol "Write Podcast Script".
          </p>
        </div>
      </div>
    )
  }

  const article = await prisma.article.findUnique({ where: { id: articleId } })

  if (!article || !article.markdownContent) {
    return (
      <div className="flex-1 flex items-center justify-center p-10 h-full">
        <div className="text-center text-error p-4 bg-error-container rounded-lg">
          Artikel tidak ditemukan atau naskah belum ditulis.
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 p-5 md:p-10 max-w-[1000px] mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-on-surface m-0 tracking-tight flex items-center gap-3">
          <span className="material-symbols-outlined text-4xl text-primary">mic</span>
          AI Podcast Generator
        </h1>
        <p className="mt-2 text-sm text-secondary">
          Buat versi naskah podcast dari artikel: <strong>{article.title}</strong>
        </p>
      </div>

      <div className="bg-surface-container-lowest p-6 md:p-8 rounded-xl border border-outline-variant shadow-sm">
        <PodcastFormWrapper articleId={article.id} defaultTitle={`[Podcast] ${article.title || 'Untitled'}`} defaultAuthor={article.author || ''} defaultKnowledgeTagSlug={article.knowledgeTagSlug || ''} />
      </div>
    </div>
  )
}
