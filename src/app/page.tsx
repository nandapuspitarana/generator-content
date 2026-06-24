"use client"

import * as React from "react"
import { useState } from "react"
import { GeneratorForm, GeneratorFormData } from "@/components/generator-form"
import { GeneratorFormState, ParsedResult } from "@/lib/types/models"

import { BannerPreview } from "@/components/banner-preview"
import { ReviewViewer } from "@/components/review-viewer"

export default function Home() {
  const [formState, setFormState] = useState<GeneratorFormState>({
    title: "",
    author: "",
    notes: "",
    isLoading: false,
    error: null,
  })

  // We will store the result here later when we connect to the API
  const [result, setResult] = useState<ParsedResult | null>(null)

  const handleGenerate = async (data: GeneratorFormData) => {
    setFormState((prev) => ({
      ...prev,
      ...data,
      isLoading: true,
      error: null,
    }))
    
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Terjadi kesalahan pada server.")
      }

      const parsedData: ParsedResult = await response.json()
      setResult(parsedData)
    } catch (error: any) {
      setFormState((prev) => ({
        ...prev,
        error: error.message || "Gagal menghubungi server. Silakan coba lagi.",
      }))
    } finally {
      setFormState((prev) => ({ ...prev, isLoading: false }))
    }
  }

  return (
    <main className="min-h-screen bg-[#fafafa] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-7xl">
        {!result ? (
          <div className="flex flex-col items-center justify-center min-h-[80vh]">
            <GeneratorForm
              onSubmit={handleGenerate}
              isLoading={formState.isLoading}
            />
            {formState.error && (
              <div className="mt-4 p-4 text-sm text-red-600 bg-red-50 rounded-lg">
                {formState.error}
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-8">
            {/* Panel 1: Banner Preview (US2) */}
            <div className="flex flex-col gap-4">
              <h3 className="text-sm font-semibold tracking-wider text-gray-500 uppercase">Banner Preview</h3>
              <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center">
                <BannerPreview htmlCode={result.htmlBannerCode} />
              </div>
            </div>

            {/* Panel 2: Markdown Viewer (US2) */}
            <div className="flex flex-col gap-4">
              <h3 className="text-sm font-semibold tracking-wider text-gray-500 uppercase">Review Content</h3>
              <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100 min-h-[400px] overflow-auto max-h-[80vh]">
                <ReviewViewer markdown={result.markdownContent} />
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
