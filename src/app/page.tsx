"use client"

import * as React from "react"
import { useState } from "react"
import { GeneratorForm } from "@/components/generator-form"
import { GeneratorFormData, GeneratorFormState } from "@/lib/types/models"
import Link from "next/link"

export default function Home() {
  const [formState, setFormState] = useState<GeneratorFormState>({
    title: "",
    author: "",
    notes: "",
    isLoading: false,
    error: null,
  })

  const handleGenerate = async (data: GeneratorFormData) => {
    setFormState((prev) => ({
      ...prev,
      ...data,
      isLoading: true,
      error: null,
    }))
    
    try {
      const response = await fetch("/api/articles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error("Gagal menyimpan artikel.")
      }

      const article = await response.json()
      window.location.href = `/dashboard/article/${article.id}`
    } catch (error: any) {
      setFormState((prev) => ({
        ...prev,
        error: error.message || "Gagal menghubungi server.",
      }))
      setFormState((prev) => ({ ...prev, isLoading: false }))
    }
  }

  return (
    <main className="min-h-screen bg-surface flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="flex flex-col items-center justify-center min-h-[80vh]">
          
          <div className="mb-8 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mx-auto mb-4">
              <span className="material-symbols-outlined text-3xl">edit_document</span>
            </div>
            <h1 className="text-3xl font-semibold text-on-surface tracking-tight m-0">Write New Story</h1>
            <p className="text-sm text-secondary mt-2">Masukkan info buku untuk membuat artikel review.</p>
          </div>

          <div className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl p-6 md:p-8 shadow-sm">
            <GeneratorForm
              onSubmit={handleGenerate}
              isLoading={formState.isLoading}
            />
            
            {formState.error && (
              <div className="mt-4 p-4 text-sm text-error bg-error-container rounded-lg border border-error/20 flex gap-2">
                <span className="material-symbols-outlined text-lg">error</span>
                {formState.error}
              </div>
            )}
          </div>
          
          <div className="mt-8 text-center">
            <Link href="/dashboard" className="text-sm font-semibold text-primary hover:underline flex items-center justify-center gap-1">
              <span className="material-symbols-outlined text-base">arrow_back</span>
              Buka Dashboard (Lihat Riwayat Review)
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
