"use client"

import * as React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, Zap } from "lucide-react"

export function GenerateWorkflowButton({ articleId, status }: { articleId: string, status: string }) {
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerate = async () => {
    setIsGenerating(true)
    try {
      const res = await fetch(`/api/articles/${articleId}/generate`, { method: "POST" })
      if (!res.ok) throw new Error("Gagal menjalankan AI workflow")
      // reload page to show results
      window.location.reload()
    } catch (error) {
      alert("Error: " + error)
    } finally {
      setIsGenerating(false)
    }
  }

  if (status === "READY" || status === "PUBLISHED") {
    return null;
  }

  return (
    <Button 
      onClick={handleGenerate} 
      disabled={isGenerating}
      className="bg-[#c8102e] hover:bg-red-800 text-white gap-2"
    >
      {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
      {isGenerating ? "AI sedang bekerja (Bisa butuh 30-60 detik)..." : "Mulai Proses AI (Ideator -> Writer -> Designer -> Editor)"}
    </Button>
  )
}
