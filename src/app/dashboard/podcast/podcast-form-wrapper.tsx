"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { PodcastForm, PodcastFormData } from "@/components/podcast-form"

export function PodcastFormWrapper({ articleId, defaultTitle, defaultAuthor, defaultKnowledgeTagSlug }: { articleId: string, defaultTitle: string, defaultAuthor: string, defaultKnowledgeTagSlug?: string }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [availableTags, setAvailableTags] = useState<any[]>([])

  useEffect(() => {
    fetch("/api/knowledge/tags")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setAvailableTags(data)
      })
      .catch(console.error)
  }, [])

  const handleSubmit = async (data: PodcastFormData) => {
    if (isLoading) return
    setIsLoading(true)
    setErrorMsg(null)
    try {
      const response = await fetch("/api/podcast/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, articleId }),
      })

      if (!response.ok) {
        const text = await response.text()
        throw new Error(`Gagal membuat podcast: ${response.status} ${text}`)
      }

      const result = await response.json()
      window.location.href = `/dashboard/article/${result.id}`
      // Keep isLoading as true during client-side navigation to prevent duplicate submissions
    } catch (error: any) {
      console.error("Podcast Generation Error:", error)
      setErrorMsg("Terjadi kesalahan: " + (error.message || error))
      alert("Terjadi kesalahan: " + (error.message || error))
      setIsLoading(false)
    }
  }

  return (
    <>
      {errorMsg && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg border border-red-200 text-sm">
          {errorMsg}
        </div>
      )}
      <PodcastForm 
        onSubmit={handleSubmit} 
        isLoading={isLoading} 
        availableTags={availableTags}
        defaultValues={{ 
          title: defaultTitle, 
          author: defaultAuthor, 
          notes: "", 
          length: "MEDIUM",
          knowledgeTagSlug: defaultKnowledgeTagSlug || ""
        }} 
      />
    </>
  )
}
