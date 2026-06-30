"use client"

import * as React from "react"
import { useState } from "react"
import { GeneratorFormData } from "@/lib/types/models"

interface GeneratorFormProps {
  onSubmit: (data: GeneratorFormData) => void
  isLoading: boolean
}

export function GeneratorForm({ onSubmit, isLoading }: GeneratorFormProps) {
  const [formData, setFormData] = useState<GeneratorFormData>({
    title: "",
    author: "",
    notes: "",
    affiliateLink: "",
    imageUrl: "",
    scheduledAt: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title || !formData.author) return
    onSubmit(formData)
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-1">
          <label htmlFor="title" className="block text-sm font-medium text-on-surface">Judul Buku <span className="text-error">*</span></label>
          <input
            id="title"
            name="title"
            placeholder="Mulai Dengan Mengapa"
            value={formData.title}
            onChange={handleChange}
            required
            disabled={isLoading}
            className="w-full h-11 px-4 rounded-lg bg-surface border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm disabled:opacity-50"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="author" className="block text-sm font-medium text-on-surface">Penulis <span className="text-error">*</span></label>
          <input
            id="author"
            name="author"
            placeholder="Simon Sinek"
            value={formData.author}
            onChange={handleChange}
            required
            disabled={isLoading}
            className="w-full h-11 px-4 rounded-lg bg-surface border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm disabled:opacity-50"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="notes" className="block text-sm font-medium text-on-surface">Catatan Tambahan (Opsional)</label>
          <textarea
            id="notes"
            name="notes"
            placeholder="Fokus pada bagian kepemimpinan, gaya bahasa santai."
            value={formData.notes}
            onChange={handleChange}
            disabled={isLoading}
            className="w-full min-h-[100px] p-4 rounded-lg bg-surface border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm disabled:opacity-50 resize-y"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label htmlFor="imageUrl" className="block text-sm font-medium text-on-surface">Cover Image URL (Opsional)</label>
            <input
              id="imageUrl"
              name="imageUrl"
              placeholder="https://example.com/cover.png"
              value={formData.imageUrl}
              onChange={handleChange}
              disabled={isLoading}
              className="w-full h-11 px-4 rounded-lg bg-surface border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm disabled:opacity-50"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="affiliateLink" className="block text-sm font-medium text-on-surface">Affiliate Link (Opsional)</label>
            <input
              id="affiliateLink"
              name="affiliateLink"
              placeholder="https://tokopedia.link/..."
              value={formData.affiliateLink}
              onChange={handleChange}
              disabled={isLoading}
              className="w-full h-11 px-4 rounded-lg bg-surface border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm disabled:opacity-50"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label htmlFor="scheduledAt" className="block text-sm font-medium text-on-surface">Jadwal Tayang (Opsional)</label>
          <input
            id="scheduledAt"
            name="scheduledAt"
            type="datetime-local"
            value={formData.scheduledAt || ""}
            onChange={handleChange}
            disabled={isLoading}
            className="w-full h-11 px-4 rounded-lg bg-surface border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm disabled:opacity-50"
          />
          <p className="text-xs text-secondary mt-1">Jika dikosongkan, artikel tidak akan otomatis dipublish ke Medium.</p>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={isLoading || !formData.title || !formData.author}
            className="w-full h-12 bg-primary hover:bg-surface-tint text-on-primary rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
          >
            {isLoading ? (
              <>
                <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                Menyimpan...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-lg">auto_awesome</span>
                Mulai Setup Konten
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  )
}
