"use client"

import * as React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Loader2, Sparkles } from "lucide-react"

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
    <div className="flex flex-col gap-6 w-full max-w-md mx-auto p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">
          AsikReview Generator
        </h2>
        <p className="text-sm text-gray-500">
          Masukkan info buku untuk membuat review ala Medium.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Judul Buku</Label>
          <Input
            id="title"
            name="title"
            placeholder="Mulai Dengan Mengapa"
            value={formData.title}
            onChange={handleChange}
            required
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="author">Penulis</Label>
          <Input
            id="author"
            name="author"
            placeholder="Simon Sinek"
            value={formData.author}
            onChange={handleChange}
            required
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Catatan Tambahan (Opsional)</Label>
          <Textarea
            id="notes"
            name="notes"
            placeholder="Fokus pada bagian kepemimpinan, gaya bahasa santai."
            value={formData.notes}
            onChange={handleChange}
            rows={4}
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="imageUrl">Cover Image URL (Opsional)</Label>
          <Input
            id="imageUrl"
            name="imageUrl"
            placeholder="https://example.com/cover.png"
            value={formData.imageUrl}
            onChange={handleChange}
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="affiliateLink">Affiliate Link (Opsional)</Label>
          <Input
            id="affiliateLink"
            name="affiliateLink"
            placeholder="https://tokopedia.link/..."
            value={formData.affiliateLink}
            onChange={handleChange}
            disabled={isLoading}
          />
        </div>

        <Button
          type="submit"
          disabled={isLoading || !formData.title || !formData.author}
          className="w-full relative overflow-hidden group h-11"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Menulis Review...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Generate Review 🚀
            </span>
          )}
        </Button>
      </form>
    </div>
  )
}
