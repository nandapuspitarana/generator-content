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
        const errJson = await response.json().catch(() => ({}))
        throw new Error(errJson.error || "Gagal menyimpan artikel.")
      }

      const article = await response.json()
      window.location.href = `/dashboard/article/${article.id}`
    } catch (error: any) {
      setFormState((prev) => ({
        ...prev,
        error: error.message || "Gagal menghubungi server.",
        isLoading: false,
      }))
    }
  }

  return (
    <main className="min-h-screen bg-[#faf9f6] text-[#191919] flex flex-col justify-between p-6 md:p-12">
      {/* Top Header */}
      <header className="max-w-4xl mx-auto w-full flex items-center justify-between border-b border-[#e8e7e0] pb-6 mb-12">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-[#191919] text-white flex items-center justify-center font-bold text-sm">
            AR
          </div>
          <div>
            <span className="font-bold text-base tracking-tight text-[#191919]">AsikReview</span>
            <span className="text-xs text-[#777777] block font-mono">Content Engine v2.0</span>
          </div>
        </div>
        <Link 
          href="/dashboard" 
          className="text-xs font-semibold px-4 py-2 rounded-full border border-[#d1d0c9] bg-white hover:bg-[#191919] hover:text-white transition-all duration-150 flex items-center gap-1.5"
        >
          <span>Open Dashboard</span>
          <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
        </Link>
      </header>

      {/* Hero Form Section */}
      <div className="max-w-2xl mx-auto w-full my-auto">
        <div className="mb-10 text-left">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#f0eee6] border border-[#e2e0d8] text-[11px] font-mono font-medium text-[#555555] mb-4">
            <span className="w-2 h-2 rounded-full bg-[#c8102e]"></span>
            <span>SWISS EDITORIAL SYSTEM</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-[#191919] leading-[1.1] font-sans">
            Craft distinctive book reviews in seconds.
          </h1>
          <p className="text-base text-[#666666] mt-3 font-editorial-serif leading-relaxed">
            Multi-agent AI pipeline yang menyusun outline, naskah Markdown berbobot, dan banner estetik siap publikasi di Medium.
          </p>
        </div>

        <div className="bg-white border border-[#e8e7e0] rounded-xl p-6 md:p-8 shadow-xs">
          <GeneratorForm
            onSubmit={handleGenerate}
            isLoading={formState.isLoading}
          />
          
          {formState.error && (
            <div className="mt-5 p-4 text-sm text-[#ba1a1a] bg-[#ffdad6]/40 rounded-lg border border-[#ba1a1a]/20 flex items-start gap-2.5">
              <span className="material-symbols-outlined text-lg shrink-0 mt-0.5">error</span>
              <div>
                <p className="font-semibold text-xs uppercase tracking-wider">Terjadi Kesalahan</p>
                <p className="text-xs mt-0.5">{formState.error}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="max-w-4xl mx-auto w-full border-t border-[#e8e7e0] pt-6 mt-12 flex flex-col sm:flex-row items-center justify-between text-xs text-[#888888]">
        <p>© 2026 AsikReview Studio. Built with Swiss typography & Next.js App Router.</p>
        <div className="flex items-center gap-4 mt-2 sm:mt-0 font-medium">
          <Link href="/dashboard/articles" className="hover:text-[#191919]">Articles</Link>
          <Link href="/dashboard/podcast" className="hover:text-[#191919]">Podcast</Link>
          <Link href="/dashboard/knowledge" className="hover:text-[#191919]">Knowledge Base</Link>
        </div>
      </footer>
    </main>
  )
}
