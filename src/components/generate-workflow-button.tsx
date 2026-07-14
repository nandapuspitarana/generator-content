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

  const isReady = status === "READY" || status === "PUBLISHED";

  return (
    <div className="flex flex-col items-end gap-2">
      {isReady && (
        <span className="text-xs text-orange-600 dark:text-orange-400 max-w-[300px] text-right">
          *Pastikan Anda menekan <strong>Save as Draft</strong> di kanan bawah sebelum re-generate jika ada perubahan gambar atau link.
        </span>
      )}
      <Button 
        onClick={handleGenerate} 
        disabled={isGenerating}
        className={`${isReady ? 'bg-orange-600 hover:bg-orange-700' : 'bg-[#c8102e] hover:bg-red-800'} text-white gap-2`}
      >
        {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
        {isGenerating 
          ? "AI sedang bekerja (Bisa butuh 30-60 detik)..." 
          : isReady 
            ? "Re-generate Content with AI" 
            : "Mulai Proses AI (Ideator -> Writer -> Designer -> Editor)"}
      </Button>
    </div>
  )
}
