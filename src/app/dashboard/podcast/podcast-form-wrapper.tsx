"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { PodcastForm, PodcastFormData } from "@/components/podcast-form"

export function PodcastFormWrapper({ articleId, defaultTitle, defaultAuthor }: { articleId: string, defaultTitle: string, defaultAuthor: string }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (data: PodcastFormData) => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/podcast/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, articleId }),
      })

      if (!response.ok) {
        throw new Error("Gagal membuat podcast")
      }

      const result = await response.json()
      router.push(`/dashboard/article/${result.id}`)
    } catch (error) {
      alert("Terjadi kesalahan: " + error)
    } finally {
      setIsLoading(false)
    }
  }

  return <PodcastForm onSubmit={handleSubmit} isLoading={isLoading} defaultValues={{ title: defaultTitle, author: defaultAuthor, notes: "", length: "MEDIUM" }} />
}
