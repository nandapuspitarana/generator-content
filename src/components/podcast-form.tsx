"use client"

import * as React from "react"
import { useState } from "react"

export interface PodcastFormData {
  title: string
  author: string
  notes?: string
  length: "SHORT" | "MEDIUM" | "LONG"
}

export interface PodcastFormProps {
  onSubmit: (data: PodcastFormData) => void
  isLoading?: boolean
  defaultValues?: Partial<PodcastFormData>
}

export function PodcastForm({ onSubmit, isLoading, defaultValues }: PodcastFormProps) {
  const [formData, setFormData] = useState<PodcastFormData>({
    title: defaultValues?.title || "",
    author: defaultValues?.author || "",
    notes: defaultValues?.notes || "",
    length: defaultValues?.length || "MEDIUM"
  })

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
      <div className="space-y-4">
        <div className="space-y-1">
          <label htmlFor="title" className="block text-sm font-medium text-on-surface">Topik / Judul Buku <span className="text-error">*</span></label>
          <input
            id="title"
            name="title"
            placeholder="Contoh: Atomic Habits oleh James Clear"
            value={formData.title}
            onChange={handleChange}
            disabled={isLoading}
            required
            className="w-full h-11 px-4 rounded-lg bg-surface border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm disabled:opacity-50"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="author" className="block text-sm font-medium text-on-surface">Nama Host / Podcaster <span className="text-error">*</span></label>
          <input
            id="author"
            name="author"
            placeholder="Contoh: Nanda Puspitarana"
            value={formData.author}
            onChange={handleChange}
            disabled={isLoading}
            required
            className="w-full h-11 px-4 rounded-lg bg-surface border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm disabled:opacity-50"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="length" className="block text-sm font-medium text-on-surface">Durasi / Panjang Naskah <span className="text-error">*</span></label>
          <select
            id="length"
            name="length"
            value={formData.length}
            onChange={handleChange}
            disabled={isLoading}
            className="w-full h-11 px-4 rounded-lg bg-surface border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm disabled:opacity-50"
          >
            <option value="SHORT">Pendek (300 - 500 kata / ~3-5 menit)</option>
            <option value="MEDIUM">Sedang (700 - 1000 kata / ~7-10 menit)</option>
            <option value="LONG">Panjang (1500 - 2000 kata / ~15-20 menit)</option>
          </select>
        </div>

        <div className="space-y-1">
          <label htmlFor="notes" className="block text-sm font-medium text-on-surface">Catatan Tambahan / Arahan (Opsional)</label>
          <textarea
            id="notes"
            name="notes"
            placeholder="Contoh: Tolong mention link afiliasi shopee di outro, gunakan bahasa anak gaul Jaksel."
            value={formData.notes}
            onChange={handleChange}
            disabled={isLoading}
            className="w-full min-h-[120px] p-4 rounded-lg bg-surface border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm disabled:opacity-50 resize-y"
          />
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
                Menyusun Naskah (10-30 detik)...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-lg">mic</span>
                Buat Naskah Podcast
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  )
}
