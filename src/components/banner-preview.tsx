"use client"

import * as React from "react"
import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Download, Loader2 } from "lucide-react"
import html2canvas from "html2canvas"

interface BannerPreviewProps {
  htmlCode: string
}

export function BannerPreview({ htmlCode }: BannerPreviewProps) {
  const bannerRef = useRef<HTMLDivElement>(null)
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownload = async () => {
    if (!bannerRef.current) return
    
    try {
      setIsDownloading(true)
      const canvas = await html2canvas(bannerRef.current, { 
        useCORS: true,
        scale: 2, // better quality
        backgroundColor: null 
      })
      
      const dataUrl = canvas.toDataURL("image/png")
      const link = document.createElement("a")
      link.download = "asikreview-banner.png"
      link.href = dataUrl
      link.click()
    } catch (error) {
      console.error("Failed to download banner:", error)
      alert("Gagal mengunduh banner. Pastikan gambar cover bisa diakses (bebas CORS).")
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div 
        ref={bannerRef}
        className="w-full flex justify-center items-center rounded-lg overflow-hidden bg-transparent"
      >
        <div 
          className="w-full h-full [&>div]:w-full"
          dangerouslySetInnerHTML={{ __html: htmlCode }} 
        />
      </div>
      
      <div className="flex justify-end">
        <Button 
          onClick={handleDownload} 
          disabled={isDownloading}
          variant="outline"
          className="gap-2"
        >
          {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          Download Banner (PNG)
        </Button>
      </div>
    </div>
  )
}
