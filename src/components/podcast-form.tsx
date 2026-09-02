"use client"

import * as React from "react"
import { useState } from "react"

export interface PodcastFormData {
  title: string
  author: string
  notes?: string
  length: "SHORT" | "MEDIUM" | "LONG"
  knowledgeTagSlug?: string
}

export interface PodcastFormProps {
  onSubmit: (data: PodcastFormData) => void
  isLoading?: boolean
  defaultValues?: Partial<PodcastFormData>
  availableTags?: any[]
}

export function PodcastForm({ onSubmit, isLoading, defaultValues, availableTags }: PodcastFormProps) {
  const [formData, setFormData] = useState<PodcastFormData>({
    title: defaultValues?.title || "",
    author: defaultValues?.author || "",
    notes: defaultValues?.notes || "",
    length: defaultValues?.length || "MEDIUM",
    knowledgeTagSlug: defaultValues?.knowledgeTagSlug || ""
  })

  // Keep updated if defaultValues change
  React.useEffect(() => {
    if (defaultValues?.title) setFormData(prev => ({ ...prev, title: defaultValues.title || "" }))
    if (defaultValues?.author) setFormData(prev => ({ ...prev, author: defaultValues.author || "" }))
    if (defaultValues?.knowledgeTagSlug) setFormData(prev => ({ ...prev, knowledgeTagSlug: defaultValues.knowledgeTagSlug || "" }))
  }, [defaultValues?.title, defaultValues?.author, defaultValues?.knowledgeTagSlug])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-5">
        <div className="space-y-1.5">
          <label htmlFor="title" className="block text-xs font-mono font-bold uppercase tracking-wider text-[#191919]">
            Topik / Judul Episode <span className="text-[#c8102e]">*</span>
          </label>
          <input
            id="title"
            name="title"
            placeholder="Contoh: Menguasai Kebiasaan Atomik bersama James Clear"
            value={formData.title}
            onChange={handleChange}
            disabled={isLoading}
            required
            className="w-full h-11 px-3.5 rounded-lg bg-[#faf9f6] border border-[#e8e7e0] focus:border-[#191919] outline-none transition-all text-xs font-medium text-[#191919] disabled:opacity-50"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="author" className="block text-xs font-mono font-bold uppercase tracking-wider text-[#191919]">
              Nama Host / Podcaster <span className="text-[#c8102e]">*</span>
            </label>
            <input
              id="author"
              name="author"
              placeholder="Nama Anda atau Host AI"
              value={formData.author}
              onChange={handleChange}
              disabled={isLoading}
              required
              className="w-full h-11 px-3.5 rounded-lg bg-[#faf9f6] border border-[#e8e7e0] focus:border-[#191919] outline-none transition-all text-xs font-medium text-[#191919] disabled:opacity-50"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="length" className="block text-xs font-mono font-bold uppercase tracking-wider text-[#191919]">
              Target Durasi Naskah <span className="text-[#c8102e]">*</span>
            </label>
            <select
              id="length"
              name="length"
              value={formData.length}
              onChange={handleChange}
              disabled={isLoading}
              className="w-full h-11 px-3.5 rounded-lg bg-[#faf9f6] border border-[#e8e7e0] focus:border-[#191919] outline-none transition-all text-xs font-medium text-[#191919] disabled:opacity-50 cursor-pointer"
            >
              <option value="SHORT">Short (~400 kata / ~3-5 menit)</option>
              <option value="MEDIUM">Medium (~850 kata / ~7-10 menit)</option>
              <option value="LONG">Long (~1800 kata / ~15-20 menit)</option>
            </select>
          </div>
        </div>

        {availableTags && availableTags.length > 0 && (
          <div className="space-y-1.5">
            <label htmlFor="knowledgeTagSlug" className="block text-xs font-mono font-bold uppercase tracking-wider text-[#191919]">
              Knowledge Base Reference (RAG Source)
            </label>
            <select
              id="knowledgeTagSlug"
              name="knowledgeTagSlug"
              value={formData.knowledgeTagSlug}
              onChange={handleChange}
              disabled={isLoading}
              className="w-full h-11 px-3.5 rounded-lg bg-[#faf9f6] border border-[#e8e7e0] focus:border-[#191919] outline-none transition-all text-xs font-medium text-[#191919] disabled:opacity-50 cursor-pointer"
            >
              <option value="">-- Tanpa referensi Knowledge Base --</option>
              {availableTags.map((t: any) => (
                <option key={t.slug} value={t.slug}>{t.title} ({t.category} - {t.type})</option>
              ))}
            </select>
            <p className="text-[11px] text-[#777777] mt-1 font-editorial-serif">
              Materi buku dari Knowledge Base akan disuntikkan ke prompt RAG agar naskah podcast berbobot dan akurat.
            </p>
          </div>
        )}

        <div className="space-y-1.5">
          <label htmlFor="notes" className="block text-xs font-mono font-bold uppercase tracking-wider text-[#191919]">
            Catatan Tambahan & Arahan Khusus
          </label>
          <textarea
            id="notes"
            name="notes"
            placeholder="Contoh: Berikan hook dramatis di intro, bahas studi kasus bab 3, dan berikan CTA ajakan baca buku di outro."
            value={formData.notes}
            onChange={handleChange}
            disabled={isLoading}
            className="w-full min-h-[100px] p-3 rounded-lg bg-[#faf9f6] border border-[#e8e7e0] focus:border-[#191919] outline-none transition-all text-xs text-[#191919] disabled:opacity-50 resize-y"
          />
        </div>

        <div className="pt-3">
          <button
            type="submit"
            disabled={isLoading || !formData.title || !formData.author}
            className="w-full h-11 bg-[#191919] hover:bg-[#333333] text-white rounded-lg font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-xs disabled:opacity-60"
          >
            {isLoading ? (
              <>
                <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
                <span>Generating Podcast Pipeline (~30-60s)...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-base">mic</span>
                <span>Generate ElevenLabs-Ready Podcast Script</span>
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  )
}
