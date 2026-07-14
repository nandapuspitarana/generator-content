"use client"

import * as React from "react"
import { useRef, useState } from "react"
import html2canvas from "html2canvas"
import { BannerTemplate, BannerTemplateId } from "./banner-template"
import { CustomBannerRenderer } from "./custom-banner-renderer"
import { CanvasElement } from "@/app/dashboard/canvas/[id]/page"

interface LiveBannerProps {
  title: string
  author: string
  imageUrl?: string
  format: "MEDIUM" | "INSTAGRAM"
}

async function inlineImages(container: HTMLElement) {
  const imgs = container.querySelectorAll<HTMLImageElement>("img")
  const jobs = Array.from(imgs).map(async (img) => {
    const src = img.getAttribute("src")
    if (!src || src.startsWith("data:")) return
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000)
      const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(src)}`
      const resp = await fetch(proxyUrl, { signal: controller.signal })
      clearTimeout(timeoutId)
      if (!resp.ok) return
      const blob = await resp.blob()
      return new Promise<void>((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => { img.src = reader.result as string; resolve() }
        reader.readAsDataURL(blob)
      })
    } catch (e) {
      console.warn("Failed to inline image:", src, e)
    }
  })

  const divs = container.querySelectorAll<HTMLElement>("div")
  const bgJobs = Array.from(divs).map(async (div) => {
    const bg = div.style.backgroundImage
    if (!bg || bg === "none" || bg === "initial") return
    const match = bg.match(/^url\(['"](.*?)['"]\)/)
    if (!match) return
    const src = match[1]
    if (!src || src.startsWith("data:")) return
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000)
      const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(src)}`
      const resp = await fetch(proxyUrl, { signal: controller.signal })
      clearTimeout(timeoutId)
      if (!resp.ok) return
      const blob = await resp.blob()
      return new Promise<void>((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => {
          div.style.backgroundImage = `url(${reader.result})`
          resolve()
        }
        reader.readAsDataURL(blob)
      })
    } catch (e) {
      console.warn("Failed to inline bg image:", src, e)
    }
  })

  await Promise.all([...jobs, ...bgJobs])
}

export function LiveBanner({ title, author, imageUrl, format }: LiveBannerProps) {
  const [genre, setGenre] = useState("")
  const [badgeText, setBadgeText] = useState("")
  const [tags, setTags] = useState(["", "", ""])
  const [themeColor, setThemeColor] = useState("#c8102e")
  const [template, setTemplate] = useState<BannerTemplateId>("classic")
  const [isDownloading, setIsDownloading] = useState(false)
  const bannerRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  const W = format === "MEDIUM" ? 1200 : 1080
  const H = format === "MEDIUM" ? 675  : 1080

  const [dbBanners, setDbBanners] = useState<any[]>([])

  // Fetch db banners
  React.useEffect(() => {
    fetch("/api/banners")
      .then(res => res.json())
      .then((data: any[]) => {
        // filter by format
        const filtered = data.filter(b => b.format === format)
        setDbBanners(filtered)
      })
      .catch(console.error)
  }, [format])

  // Determine background color for canvas based on template
  const bgColor = React.useMemo(() => {
    const dbBanner = dbBanners.find(b => b.id === template)
    if (dbBanner) return dbBanner.backgroundColor || "#ffffff"

    if (format === "MEDIUM") {
      if (template === "dark") return "#111111"
      if (template === "minimal") return "#ffffff"
      return "#e8e4dc"
    }
    if (template === "quote") return "#0f0f0f"
    return "#1c1c1c"
  }, [format, template, dbBanners])

  React.useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth
        setScale(containerWidth / W)
      }
    }
    handleResize()

    if (typeof ResizeObserver !== "undefined" && containerRef.current) {
      const observer = new ResizeObserver(handleResize)
      observer.observe(containerRef.current)
      return () => observer.disconnect()
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [W])

  const handleTagChange = (i: number, val: string) => {
    const next = [...tags]
    next[i] = val
    setTags(next)
  }

  const handleDownload = async () => {
    if (!bannerRef.current) return
    setIsDownloading(true)
    try {
      const filename = `banner-${format.toLowerCase()}-${(title || "content").replace(/\s+/g, "-").toLowerCase()}.png`
      let fileHandle: any = null
      
      // Request file handle first to preserve user gesture
      if ("showSaveFilePicker" in window) {
        try {
          fileHandle = await (window as any).showSaveFilePicker({
            suggestedName: filename,
            types: [{ description: "PNG Image", accept: { "image/png": [".png"] } }],
          })
        } catch (err: any) {
          if (err.name !== "AbortError") console.error(err.name, err.message)
          setIsDownloading(false)
          return
        }
      }

      // Clone & set exact export dimensions (neutralize scale)
      const clone = bannerRef.current.cloneNode(true) as HTMLDivElement
      clone.style.cssText = `position:fixed;top:-9999px;left:-9999px;width:${W}px;height:${H}px;transform:none;overflow:hidden;border-radius:0;`

      const bannerRoot = clone.firstElementChild as HTMLElement | null
      if (bannerRoot) {
        bannerRoot.style.width = `${W}px`
        bannerRoot.style.height = `${H}px`
        bannerRoot.style.aspectRatio = "unset"
        bannerRoot.style.borderRadius = "0"
        bannerRoot.style.overflow = "hidden"

        if (format === "MEDIUM") {
          const rightPanel = bannerRoot.lastElementChild as HTMLElement | null
          if (rightPanel) {
            const panelW = Math.round(W * 0.40)
            rightPanel.style.width = `${panelW}px`
            rightPanel.style.height = `${H}px`
            rightPanel.style.flex = "none"
            rightPanel.style.position = "relative"
            rightPanel.style.overflow = "hidden"
          }
        }
      }

      document.body.appendChild(clone)
      await inlineImages(clone)

      const canvas = await html2canvas(clone, {
        useCORS: true,
        allowTaint: false,
        width: W,
        height: H,
        scale: 1,
        backgroundColor: bgColor,
        logging: false,
      })
      document.body.removeChild(clone)

      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/png"))
      if (!blob) return

      if (fileHandle) {
        const writable = await fileHandle.createWritable()
        await writable.write(blob)
        await writable.close()
      } else {
        const blobUrl = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.download = filename
        link.href = blobUrl
        link.addEventListener("click", (e) => e.stopPropagation())
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        setTimeout(() => URL.revokeObjectURL(blobUrl), 60000)
      }
    } catch (e) {
      alert("Gagal download: " + e)
    } finally {
      setIsDownloading(false)
    }
  }

  const hardcodedOptions = format === "MEDIUM"
    ? [{ id: "classic", name: "Classic" }, { id: "dark", name: "Dark" }, { id: "minimal", name: "Minimal" }]
    : [{ id: "classic", name: "Book" }, { id: "quote", name: "Quote" }]
    
  const templateOptions = [
    ...hardcodedOptions,
    ...dbBanners.map(b => ({ id: b.id, name: b.name }))
  ]

  const activeDbBanner = dbBanners.find(b => b.id === template)
  const activeElements = React.useMemo(() => {
    if (!activeDbBanner) return []
    try {
      return JSON.parse(activeDbBanner.elements || "[]") as CanvasElement[]
    } catch {
      return []
    }
  }, [activeDbBanner])

  return (
    <div className="flex flex-col gap-3">
      {/* Scaled Live Preview Container */}
      <div
        ref={containerRef}
        style={{ width: "100%", height: H * scale, overflow: "hidden", position: "relative" }}
        className="rounded border border-outline-variant shadow-sm bg-surface-container-low"
      >
        <div
          ref={bannerRef}
          style={{ width: W, height: H, transform: `scale(${scale})`, transformOrigin: "top left", position: "absolute", top: 0, left: 0 }}
        >
          {activeDbBanner ? (
            <CustomBannerRenderer
              elements={activeElements}
              bgColor={bgColor}
              bgImage={activeDbBanner.backgroundImage}
              bgImageOpacity={activeDbBanner.backgroundImageOpacity}
              bgBlendMode={activeDbBanner.backgroundBlendMode}
              width={W}
              height={H}
              data={{
                title: title,
                author: author,
                genre: genre,
                badgeText: badgeText,
                tags: tags.join(","),
                imageUrl: imageUrl,
                themeColor: themeColor
              }}
            />
          ) : (
            <BannerTemplate
              title={title}
              author={author}
              genre={genre}
              badgeText={badgeText}
              tags={tags}
              imageUrl={imageUrl}
              format={format}
              template={template}
            />
          )}
        </div>
      </div>

      {/* Template Picker */}
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-bold uppercase tracking-wider text-secondary">Pilih Desain Banner</label>
        <select
          value={template}
          onChange={(e) => setTemplate(e.target.value as BannerTemplateId)}
          className="w-full bg-surface-container border border-outline-variant rounded px-2.5 py-1.5 text-xs font-bold uppercase tracking-wider text-on-surface focus:border-primary outline-none transition-all cursor-pointer"
        >
          <optgroup label="Default Templates">
            {hardcodedOptions.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </optgroup>
          {dbBanners.length > 0 && (
            <optgroup label="My Canvas Designs">
              {dbBanners.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </optgroup>
          )}
        </select>
      </div>

      {/* Editable Meta Form */}
      <div className="flex flex-col gap-3 p-3 bg-surface rounded border border-outline-variant shadow-sm">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-secondary">Theme Color</label>
          <div className="flex items-center gap-2">
            <input type="color" value={themeColor} onChange={e => setThemeColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer p-0 border-none bg-transparent" />
            <input type="text" value={themeColor} onChange={e => setThemeColor(e.target.value)} className="flex-1 bg-surface-container border border-outline-variant rounded px-2.5 py-1 text-xs text-on-surface focus:border-primary outline-none h-8 transition-all uppercase font-mono" />
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-secondary">Badge Label</label>
          <input
            className="w-full bg-surface-container border border-outline-variant rounded px-2.5 py-1 text-xs text-on-surface focus:border-primary outline-none h-8 transition-all"
            placeholder="Book Review"
            value={badgeText}
            onChange={e => setBadgeText(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-secondary">Genre</label>
          <input
            className="w-full bg-surface-container border border-outline-variant rounded px-2.5 py-1 text-xs text-on-surface focus:border-primary outline-none h-8 transition-all"
            placeholder="Self-Help, Business, Fiction..."
            value={genre}
            onChange={e => setGenre(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-secondary">Tags (3)</label>
          <div className="flex gap-2">
            {tags.map((t, i) => (
              <input
                key={i}
                className="flex-1 min-w-0 bg-surface-container border border-outline-variant rounded px-2 py-1 text-xs text-on-surface focus:border-primary outline-none h-8 transition-all text-center"
                placeholder={`Tag ${i + 1}`}
                value={t}
                onChange={e => handleTagChange(i, e.target.value)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Download Action */}
      <button
        onClick={handleDownload}
        disabled={isDownloading}
        className="w-full flex items-center justify-center gap-2 h-11 bg-primary text-on-primary text-sm font-bold rounded-md hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
      >
        <span className={`material-symbols-outlined text-base ${isDownloading ? "animate-spin" : ""}`}>
          {isDownloading ? "progress_activity" : "download"}
        </span>
        {isDownloading ? "Mengunduh..." : `Unduh ${format} PNG`}
      </button>
    </div>
  )
}
