"use client"

import * as React from "react"
import { useRef, useState } from "react"
import html2canvas from "html2canvas"

interface BannerPreviewProps {
  htmlContent: string
  platform: string
  title?: string
}

/** Convert all external <img> URLs to base64 before html2canvas renders */
async function inlineImages(container: HTMLDivElement) {
  const imgs = container.querySelectorAll<HTMLImageElement>("img")
  const jobs = Array.from(imgs).map(async (img) => {
    const src = img.getAttribute("src")
    if (!src || src.startsWith("data:")) return // already base64
    try {
      const resp = await fetch(src, { mode: "cors" })
      if (!resp.ok) return
      const blob = await resp.blob()
      return new Promise<void>((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => {
          img.src = reader.result as string
          resolve()
        }
        reader.readAsDataURL(blob)
      })
    } catch {
      console.warn("Could not inline image (CORS or network):", src)
    }
  })
  await Promise.all(jobs)
}

export function BannerPreview({ htmlContent, platform, title }: BannerPreviewProps) {
  const bannerRef = useRef<HTMLDivElement>(null)
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownload = async () => {
    if (!bannerRef.current) return
    try {
      setIsDownloading(true)

      // Clone node into a hidden off-screen div so we can mutate it safely
      const clone = bannerRef.current.cloneNode(true) as HTMLDivElement
      clone.style.position = "fixed"
      clone.style.top = "-9999px"
      clone.style.left = "-9999px"
      
      // Force exact dimensions for standard aspect ratios to ensure high-quality output
      if (platform === 'MEDIUM') {
        clone.style.width = "1200px"
        clone.style.height = "675px" // 16:9
      } else {
        clone.style.width = "1080px"
        clone.style.height = "1080px" // 1:1
      }
      
      // Remove border radius for clean edges
      clone.style.borderRadius = "0"
      const innerDiv = clone.firstElementChild as HTMLElement
      if (innerDiv) {
        innerDiv.style.borderRadius = "0"
      }

      document.body.appendChild(clone)

      // Convert all <img> URLs to base64 to avoid CORS taint
      await inlineImages(clone)

      const canvas = await html2canvas(clone, {
        useCORS: false,       // we already inlined images
        allowTaint: false,
        scale: 1, // We already forced large dimensions, so scale 1 is enough (1200x675 or 1080x1080)
        backgroundColor: null,
        logging: false,
      })

      document.body.removeChild(clone)

      // Use toBlob to generate a real .png file download instead of a base64 Data URL
      canvas.toBlob((blob) => {
        if (!blob) {
          throw new Error("Canvas to Blob failed")
        }
        const blobUrl = URL.createObjectURL(blob)
        const link = document.createElement("a")
        const filename = `banner-${platform.toLowerCase()}-${(title || "content").replace(/\s+/g, "-").toLowerCase()}.png`
        link.download = filename
        link.href = blobUrl
        link.click()
        
        // Clean up
        setTimeout(() => URL.revokeObjectURL(blobUrl), 100)
      }, "image/png")
      
    } catch (error) {
      console.error("Failed to download banner:", error)
      alert("Gagal mengunduh banner. Pastikan gambar cover bisa diakses (bebas CORS).")
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div
        ref={bannerRef}
        className="w-full overflow-hidden rounded-lg"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
      <button
        onClick={handleDownload}
        disabled={isDownloading}
        className="self-end flex items-center gap-1.5 px-3 py-1.5 border border-outline-variant bg-surface-container-lowest text-on-surface-variant text-xs font-medium rounded hover:bg-surface-container hover:text-on-surface transition-colors disabled:opacity-50"
      >
        {isDownloading ? (
          <>
            <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
            Mengunduh...
          </>
        ) : (
          <>
            <span className="material-symbols-outlined text-sm">download</span>
            {platform} PNG
          </>
        )}
      </button>
    </div>
  )
}
