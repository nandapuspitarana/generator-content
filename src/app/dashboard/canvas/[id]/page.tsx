"use client"

import { useState, useEffect, useRef, use, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Rnd } from "react-rnd"
import html2canvas from "html2canvas"
import Link from "next/link"

export type CanvasElement = {
  id: string
  type: "text" | "image" | "shape" | "group"
  x: number; y: number; w: number; h: number
  groupId?: string
  // Text specific
  text?: string; fontSize?: number; fontWeight?: string; color?: string; textAlign?: "left" | "center" | "right" | "justify"
  // Image specific
  src?: string; objectFit?: "cover" | "contain" | "fill"
  // Shape specific
  bgColor?: string; borderRadius?: number
  zIndex?: number
  bindTo?: "none" | "title" | "author" | "genre" | "badgeText" | "tags" | "imageUrl" | "color"
}

interface Banner {
  id: string
  name: string
  format: "MEDIUM" | "INSTAGRAM"
  template: string
  title: string
  author: string
  genre: string
  badgeText: string
  tags: string
  imageUrl: string
  elements: string // JSON
  backgroundColor: string
}

async function inlineImages(container: HTMLElement) {
  const imgs = container.querySelectorAll("img")
  const jobs = Array.from(imgs).map(async (img) => {
    const src = img.src
    if (!src || src.startsWith("data:")) return
    try {
      const resp = await fetch(src, { mode: "cors" })
      if (!resp.ok) return
      const blob = await resp.blob()
      return new Promise<void>((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => { img.src = reader.result as string; resolve() }
        reader.readAsDataURL(blob)
      })
    } catch { /* ignore */ }
  })
  await Promise.all(jobs)
}

function generateInitialElements(banner: Banner): CanvasElement[] {
  const W = banner.format === "MEDIUM" ? 1200 : 1080
  const H = banner.format === "MEDIUM" ? 675 : 1080
  const isMed = banner.format === "MEDIUM"
  
  const els: CanvasElement[] = []
  
  if (banner.imageUrl) {
    els.push({
      id: "img-1", type: "image",
      x: isMed ? W * 0.6 : 0, y: 0,
      w: isMed ? W * 0.4 : W, h: isMed ? H : H,
      src: banner.imageUrl, objectFit: "cover", zIndex: 1
    })
  }

  if (banner.badgeText) {
    els.push({
      id: "badge", type: "text",
      x: 60, y: 60, w: 200, h: 40,
      text: banner.badgeText.toUpperCase(),
      fontSize: 16, fontWeight: "800", color: "#6366f1", zIndex: 2
    })
  }

  if (banner.title) {
    els.push({
      id: "title", type: "text",
      x: 60, y: 120, w: isMed ? 600 : W - 120, h: 100,
      text: banner.title,
      fontSize: 64, fontWeight: "900", color: "#111827", zIndex: 2
    })
  }

  if (banner.author) {
    els.push({
      id: "author", type: "text",
      x: 60, y: 240, w: 400, h: 40,
      text: banner.author,
      fontSize: 24, fontWeight: "500", color: "#4b5563", zIndex: 2
    })
  }

  if (banner.genre) {
    els.push({
      id: "genre", type: "text",
      x: 60, y: 300, w: 200, h: 40,
      text: banner.genre,
      fontSize: 20, fontWeight: "700", color: "#f59e0b", zIndex: 2
    })
  }

  return els
}

export default function CanvasEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [banner, setBanner] = useState<Banner | null>(null)
  const [elements, setElements] = useState<CanvasElement[]>([])
  const [bgColor, setBgColor] = useState("#ffffff")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [downloading, setDownloading] = useState(false)
  
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  
  const containerRef = useRef<HTMLDivElement>(null)
  const bannerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  const [past, setPast] = useState<CanvasElement[][]>([])
  const [future, setFuture] = useState<CanvasElement[][]>([])

  // AI Import State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [importType, setImportType] = useState<"image"|"html">("image")
  const [importContent, setImportContent] = useState("")
  const [isImporting, setIsImporting] = useState(false)

  useEffect(() => {
    fetch(`/api/banners/${id}`)
      .then(r => r.json())
      .then((data: Banner) => {
        setBanner(data)
        setBgColor(data.backgroundColor || "#ffffff")
        try {
          const parsed = JSON.parse(data.elements || "[]")
          if (parsed && parsed.length > 0) {
            setElements(parsed)
          } else {
            setElements(generateInitialElements(data))
          }
        } catch {
          setElements(generateInitialElements(data))
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [id])

  const saveHistory = useCallback(() => {
    setPast(prev => [...prev, elements])
    setFuture([])
  }, [elements])

  const handleUndo = () => {
    if (past.length === 0) return
    const previous = past[past.length - 1]
    setPast(prev => prev.slice(0, -1))
    setFuture(prev => [elements, ...prev])
    setElements(previous)
    setHasUnsavedChanges(true)
  }

  const handleRedo = () => {
    if (future.length === 0) return
    const next = future[0]
    setFuture(prev => prev.slice(1))
    setPast(prev => [...prev, elements])
    setElements(next)
    setHasUnsavedChanges(true)
  }

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  const handleManualSave = async () => {
    if (!banner) return
    setSaving(true)
    await fetch(`/api/banners/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ elements: JSON.stringify(elements), backgroundColor: bgColor, name: banner.name })
    })
    setSaving(false)
    setHasUnsavedChanges(false)
  }

  const W = banner?.format === "MEDIUM" ? 1200 : 1080
  const H = banner?.format === "MEDIUM" ? 675 : 1080

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setScale(containerRef.current.offsetWidth / W)
      }
    }
    const t = setTimeout(handleResize, 50)
    window.addEventListener("resize", handleResize)
    return () => { clearTimeout(t); window.removeEventListener("resize", handleResize) }
  }, [W])

  const handleUpdateElement = (elId: string, updates: Partial<CanvasElement>) => {
    setElements(prev => prev.map(el => el.id === elId ? { ...el, ...updates } : el))
    setHasUnsavedChanges(true)
  }

  const handleDeleteElement = (elId: string) => {
    saveHistory()
    setElements(prev => {
      // If it's a group, delete all children too
      const toDelete = new Set([elId, ...prev.filter(e => e.groupId === elId).map(e => e.id)])
      return prev.filter(el => !toDelete.has(el.id))
    })
    if (selectedIds.includes(elId)) setSelectedIds(prev => prev.filter(id => id !== elId))
    setHasUnsavedChanges(true)
  }

  const handleGroup = () => {
    if (selectedIds.length < 2) return
    saveHistory()
    const selectedEls = elements.filter(e => selectedIds.includes(e.id) && !e.groupId)
    if (selectedEls.length < 2) return

    const minX = Math.min(...selectedEls.map(e => e.x))
    const minY = Math.min(...selectedEls.map(e => e.y))
    const maxW = Math.max(...selectedEls.map(e => e.x + e.w)) - minX
    const maxH = Math.max(...selectedEls.map(e => e.y + e.h)) - minY
    
    const newGroupId = Math.random().toString(36).substr(2, 9)
    const newGroup: CanvasElement = {
      id: newGroupId, type: "group",
      x: minX, y: minY, w: maxW, h: maxH,
      zIndex: Math.max(...selectedEls.map(e => e.zIndex || 0)) + 1
    }
    
    setElements(prev => {
      const next = [...prev, newGroup]
      return next.map(el => {
        if (selectedEls.find(s => s.id === el.id)) {
          return { ...el, groupId: newGroupId, x: el.x - minX, y: el.y - minY }
        }
        return el
      })
    })
    setSelectedIds([newGroupId])
    setHasUnsavedChanges(true)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      if (ev.target?.result) {
        setImportContent(ev.target.result as string)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleImportAI = async () => {
    if (!importContent) return alert("Mohon masukkan URL gambar atau HTML!")
    setIsImporting(true)
    try {
      const res = await fetch("/api/banners/import-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: importType,
          content: importContent,
          format: banner?.format || "MEDIUM"
        })
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Gagal mengimpor dari AI")
      }
      const data = await res.json()
      if (data.elements && Array.isArray(data.elements)) {
        saveHistory()
        setElements(data.elements)
        setIsImportModalOpen(false)
        setHasUnsavedChanges(true)
      } else {
        throw new Error("Format respons tidak valid")
      }
    } catch (error: any) {
      alert("Error: " + error.message)
    } finally {
      setIsImporting(false)
    }
  }

  const handleUngroup = () => {
    if (selectedIds.length !== 1) return
    const group = elements.find(e => e.id === selectedIds[0])
    if (!group || group.type !== "group") return
    
    saveHistory()
    const childrenIds: string[] = []
    setElements(prev => {
      const next = prev.filter(e => e.id !== group.id)
      return next.map(el => {
        if (el.groupId === group.id) {
          childrenIds.push(el.id)
          return { ...el, groupId: undefined, x: el.x + group.x, y: el.y + group.y }
        }
        return el
      })
    })
    setSelectedIds(childrenIds)
    setHasUnsavedChanges(true)
  }

  const handleDragMulti = (elId: string, d: { x: number, y: number }) => {
    setElements(prev => {
      const draggedPrev = prev.find(e => e.id === elId)
      if (!draggedPrev) return prev;
      const dx = d.x - draggedPrev.x;
      const dy = d.y - draggedPrev.y;
      
      if (dx === 0 && dy === 0) return prev;
      
      const isDraggingSelected = selectedIds.includes(elId);

      return prev.map(item => {
        if (item.id === elId) {
          return { ...item, x: d.x, y: d.y }
        }
        if (isDraggingSelected && selectedIds.includes(item.id) && !item.groupId) {
          return { ...item, x: item.x + dx, y: item.y + dy }
        }
        return item;
      })
    })
    setHasUnsavedChanges(true)
  }

  const handleAddElement = (type: "text" | "image" | "shape") => {
    saveHistory()
    const newId = Math.random().toString(36).substr(2, 9)
    const offset = (elements.length * 20) % 100
    const newEl: CanvasElement = {
      id: newId, type,
      x: W / 2 - 100 + offset, y: H / 2 - 50 + offset, w: 200, h: 100, zIndex: elements.length + 1
    }
    if (type === "text") {
      newEl.text = "New Text"
      newEl.fontSize = 48
      newEl.color = "#000000"
      newEl.fontWeight = "bold"
      newEl.h = 60
    }
    if (type === "shape") {
      newEl.bgColor = "#e5e7eb"
      newEl.borderRadius = 0
    }
    if (type === "image") {
      newEl.src = "https://images.unsplash.com/photo-1542204165-65bf26472b9b?auto=format&fit=crop&q=80&w=800"
      newEl.objectFit = "cover"
    }
    setElements(prev => [...prev, newEl])
    setSelectedIds([newId])
    setHasUnsavedChanges(true)
  }

  const handleDownload = async () => {
    if (!bannerRef.current || !banner) return
    setSelectedIds([]) // deselect to remove outlines
    setDownloading(true)
    // slight delay to let outline disappear
    await new Promise(r => setTimeout(r, 100))
    try {
      const filename = `banner-${banner.name.replace(/\s+/g, "-").toLowerCase()}.png`
      
      const clone = bannerRef.current.cloneNode(true) as HTMLDivElement
      clone.style.cssText = `position:fixed;top:-9999px;left:-9999px;width:${W}px;height:${H}px;transform:none;overflow:hidden;border-radius:0;`
      document.body.appendChild(clone)
      await inlineImages(clone)
      
      const canvas = await html2canvas(clone, { useCORS: true, allowTaint: false, width: W, height: H, scale: 1, backgroundColor: bgColor, logging: false })
      document.body.removeChild(clone)
      
      const blob = await new Promise<Blob | null>(r => canvas.toBlob(r, "image/png"))
      if (!blob) return
      
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a"); a.download = filename; a.href = url
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      alert("Failed to download: " + e)
    } finally {
      setDownloading(false)
    }
  }

  if (loading) return <div className="flex-1 flex items-center justify-center min-h-screen"><span className="material-symbols-outlined animate-spin mr-2">progress_activity</span> Memuat...</div>
  if (!banner) return <div className="flex-1 flex items-center justify-center min-h-screen">Banner tidak ditemukan.</div>

  const isMultiSelect = selectedIds.length > 1;
  const selectedEls = elements.filter(e => selectedIds.includes(e.id));
  const selectedEl = selectedEls.length === 1 ? selectedEls[0] : null;

  const topLevelElements = elements.filter(el => !el.groupId)

  const handleStyle = {
    width: "12px",
    height: "12px",
    backgroundColor: "#ffffff",
    border: "2px solid #3b82f6",
    borderRadius: "2px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
  }
  const activeResizeHandles = {
    bottom: handleStyle,
    bottomLeft: handleStyle,
    bottomRight: handleStyle,
    left: handleStyle,
    right: handleStyle,
    top: handleStyle,
    topLeft: handleStyle,
    topRight: handleStyle,
  }

  const renderElementContent = (el: CanvasElement) => {
    let text = el.text
    let src = el.src
    
    // Resolve bindings
    if (el.bindTo && el.bindTo !== "none") {
      if (el.bindTo === "title") text = banner.title || "Atomic Habits"
      if (el.bindTo === "author") text = banner.author || "James Clear"
      if (el.bindTo === "genre") text = banner.genre || "Self-Help"
      if (el.bindTo === "badgeText") text = banner.badgeText || "Book Review"
      if (el.bindTo === "imageUrl") src = banner.imageUrl || "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?q=80&w=800&auto=format&fit=crop"
    }

    let currentColor = el.color
    let currentBgColor = el.bgColor
    if (el.bindTo === "color") {
      currentColor = "#c8102e"
      currentBgColor = "#c8102e"
    }

    if (el.type === "text") {
      if (el.bindTo === "tags") {
        const tagsList = banner.tags ? banner.tags.split(",").map(t => t.trim()).filter(Boolean) : ["Productivity", "Habits", "Life"]
        return (
          <div style={{ width: "100%", height: "100%", display: "flex", flexWrap: "wrap", gap: "10px", alignContent: "flex-start", overflow: "hidden" }}>
            {tagsList.map((t, i) => (
              <span key={i} style={{ fontSize: `${el.fontSize}px`, color: currentColor, fontWeight: el.fontWeight, padding: "0.2em 0.8em", border: `1px solid ${currentColor}`, borderRadius: "99px", whiteSpace: "nowrap" }}>
                {t}
              </span>
            ))}
          </div>
        )
      }
      return (
        <div style={{ width: "100%", height: "100%", fontSize: `${el.fontSize}px`, color: currentColor, fontWeight: el.fontWeight, textAlign: el.textAlign || "left", display: "flex", alignItems: "center", lineHeight: 1.2 }}>
          {text}
        </div>
      )
    }
    
    if (el.type === "image" && src) {
      // eslint-disable-next-line @next/next/no-img-element
      return <img src={src} alt="element" style={{ width: "100%", height: "100%", objectFit: el.objectFit || "cover", pointerEvents: "none", borderRadius: `${el.borderRadius || 0}px` }} crossOrigin="anonymous" />
    }
    
    if (el.type === "shape") {
      return <div style={{ width: "100%", height: "100%", backgroundColor: currentBgColor, borderRadius: `${el.borderRadius}px` }} />
    }
    return null
  }

  return (
    <div className="flex flex-col min-h-screen bg-surface">
      {/* HEADER */}
      <header className="h-14 px-4 border-b border-outline-variant bg-surface-container flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/canvas" className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-outline-variant/30 text-secondary">
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </Link>
          <input
            className="bg-transparent border-none outline-none font-semibold text-sm w-48 text-on-surface"
            value={banner.name}
            onChange={e => { setBanner({ ...banner, name: e.target.value }); setHasUnsavedChanges(true) }}
            placeholder="Nama Banner"
          />
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded bg-primary/10 text-primary">
            {banner.format}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 mr-2 border-r border-outline-variant pr-4">
            <button onClick={handleUndo} disabled={past.length === 0} className="w-8 h-8 flex items-center justify-center rounded hover:bg-surface-container disabled:opacity-30" title="Undo">
              <span className="material-symbols-outlined text-[18px]">undo</span>
            </button>
            <button onClick={handleRedo} disabled={future.length === 0} className="w-8 h-8 flex items-center justify-center rounded hover:bg-surface-container disabled:opacity-30" title="Redo">
              <span className="material-symbols-outlined text-[18px]">redo</span>
            </button>
          </div>
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-2 bg-tertiary text-on-tertiary text-xs font-semibold px-4 py-2 rounded-lg hover:bg-tertiary/90 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
            AI Import
          </button>
          <button
            onClick={handleManualSave}
            disabled={saving || !hasUnsavedChanges}
            className="flex items-center gap-2 bg-surface border border-outline-variant text-on-surface text-xs font-semibold px-4 py-2 rounded-lg hover:bg-surface-container transition-colors disabled:opacity-50"
          >
            <span className={`material-symbols-outlined text-[16px] ${saving ? "animate-spin" : ""}`}>{saving ? "sync" : (hasUnsavedChanges ? "save" : "check")}</span>
            {saving ? "Menyimpan..." : (hasUnsavedChanges ? "Simpan Perubahan" : "Tersimpan")}
          </button>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-2 bg-primary text-on-primary text-xs font-semibold px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <span className={`material-symbols-outlined text-[16px] ${downloading ? "animate-spin" : ""}`}>{downloading ? "progress_activity" : "download"}</span>
            Download PNG
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden h-[calc(100vh-56px)]">
        {/* LEFT TOOLBAR */}
        <aside className="w-16 border-r border-outline-variant bg-surface-container flex flex-col items-center py-4 gap-4 shrink-0 overflow-y-auto">
          <button onClick={() => handleAddElement("text")} className="w-10 h-10 flex flex-col items-center justify-center rounded hover:bg-outline-variant/50 text-secondary hover:text-primary transition-colors group">
            <span className="material-symbols-outlined text-[24px]">title</span>
            <span className="text-[9px] font-medium mt-1">Text</span>
          </button>
          <button onClick={() => handleAddElement("image")} className="w-10 h-10 flex flex-col items-center justify-center rounded hover:bg-outline-variant/50 text-secondary hover:text-primary transition-colors group">
            <span className="material-symbols-outlined text-[24px]">image</span>
            <span className="text-[9px] font-medium mt-1">Image</span>
          </button>
          <button onClick={() => handleAddElement("shape")} className="w-10 h-10 flex flex-col items-center justify-center rounded hover:bg-outline-variant/50 text-secondary hover:text-primary transition-colors group">
            <span className="material-symbols-outlined text-[24px]">square</span>
            <span className="text-[9px] font-medium mt-1">Shape</span>
          </button>
        </aside>

        {/* CANVAS AREA */}
        <div className="flex-1 bg-surface-container-lowest overflow-auto relative p-8 flex items-center justify-center" onClick={() => setSelectedIds([])}>
          <div ref={containerRef} style={{ width: "min(900px, 100%)", aspectRatio: `${W}/${H}`, position: "relative" }}>
            <div
              ref={bannerRef}
              style={{ width: W, height: H, backgroundColor: bgColor, transform: `scale(${scale})`, transformOrigin: "top left", overflow: "hidden", position: "absolute", top: 0, left: 0 }}
              className="shadow-2xl border border-outline-variant"
            >
              {topLevelElements.map((el) => {
                const isSelected = selectedIds.includes(el.id)
                return (
                  <Rnd
                    key={el.id}
                    size={{ width: el.w, height: el.h }}
                    position={{ x: el.x, y: el.y }}
                    onDragStart={() => {
                      saveHistory();
                      if (!selectedIds.includes(el.id)) {
                        setSelectedIds([el.id]);
                      }
                    }}
                    onDrag={(e, d) => handleDragMulti(el.id, d)}
                    onDragStop={(e, d) => handleDragMulti(el.id, d)}
                    onResizeStart={saveHistory}
                    onResize={(e, dir, ref, delta, pos) => handleUpdateElement(el.id, { w: parseInt(ref.style.width), h: parseInt(ref.style.height), x: pos.x, y: pos.y })}
                    onResizeStop={(e, dir, ref, delta, pos) => handleUpdateElement(el.id, { w: parseInt(ref.style.width), h: parseInt(ref.style.height), x: pos.x, y: pos.y })}
                    bounds="parent"
                    scale={scale}
                    onClick={(e: React.MouseEvent) => { 
                      e.stopPropagation(); 
                      if (e.shiftKey) {
                        setSelectedIds(prev => prev.includes(el.id) ? prev.filter(i => i !== el.id) : [...prev, el.id])
                      } else {
                        setSelectedIds([el.id])
                      }
                    }}
                    style={{
                      zIndex: el.zIndex || 1,
                      outline: isSelected ? "2px solid #3b82f6" : "none",
                      outlineOffset: "-2px",
                    }}
                    dragHandleClassName="rnd-drag-handle"
                    resizeHandleStyles={isSelected ? activeResizeHandles : {}}
                    enableResizing={isSelected}
                  >
                    <div className="rnd-drag-handle w-full h-full relative" style={{ cursor: isSelected ? "move" : "default" }}>
                      {el.type === "group" ? (
                        <div className="w-full h-full relative">
                          {elements.filter(child => child.groupId === el.id).map(child => (
                            <div key={child.id} style={{ position: "absolute", left: child.x, top: child.y, width: child.w, height: child.h, zIndex: child.zIndex || 1 }}>
                              {renderElementContent(child)}
                            </div>
                          ))}
                        </div>
                      ) : (
                        renderElementContent(el)
                      )}
                    </div>
                  </Rnd>
                )
              })}
            </div>
          </div>
        </div>

        {/* RIGHT PROPERTY PANEL */}
        <aside className="w-80 border-l border-outline-variant bg-surface-container flex flex-col shrink-0 overflow-y-auto">
          <div className="p-4 border-b border-outline-variant flex flex-col gap-4">
            <h3 className="text-sm font-bold text-on-surface">Canvas</h3>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-secondary uppercase">Background Color</label>
              <div className="flex items-center gap-2">
                <input type="color" value={bgColor} onChange={e => { setBgColor(e.target.value); setHasUnsavedChanges(true) }} className="w-8 h-8 rounded cursor-pointer p-0 border-none bg-transparent" />
                <input type="text" value={bgColor} onChange={e => { setBgColor(e.target.value); setHasUnsavedChanges(true) }} className="flex-1 bg-surface border border-outline-variant rounded px-2 py-1 text-xs outline-none focus:border-primary uppercase font-mono" />
              </div>
            </div>
          </div>
          
          {isMultiSelect && (
            <div className="p-4 border-b border-outline-variant flex flex-col gap-4">
              <h3 className="text-sm font-bold text-on-surface">{selectedIds.length} Elements Selected</h3>
              <button onClick={handleGroup} className="w-full py-2 bg-primary text-on-primary font-bold text-xs rounded hover:bg-primary/90">
                Group Elements
              </button>
              <button onClick={() => { saveHistory(); selectedIds.forEach(handleDeleteElement); setSelectedIds([]); }} className="w-full py-2 bg-error/10 text-error font-bold text-xs rounded hover:bg-error/20">
                Delete All Selected
              </button>
            </div>
          )}

          {selectedEl?.type === "group" && (
            <div className="p-4 flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-on-surface capitalize">Group Container</h3>
                <button onClick={() => handleDeleteElement(selectedEl.id)} className="w-7 h-7 rounded hover:bg-error/10 text-error flex items-center justify-center" title="Delete Group">
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
              </div>
              <button onClick={handleUngroup} className="w-full py-2 bg-surface border border-primary text-primary font-bold text-xs rounded hover:bg-primary/10">
                Ungroup Elements
              </button>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-secondary uppercase">X Position</label>
                  <input type="number" value={Math.round(selectedEl.x)} onChange={e => handleUpdateElement(selectedEl.id, { x: Number(e.target.value) })} className="bg-surface border border-outline-variant rounded px-2 py-1.5 text-xs outline-none focus:border-primary" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-secondary uppercase">Y Position</label>
                  <input type="number" value={Math.round(selectedEl.y)} onChange={e => handleUpdateElement(selectedEl.id, { y: Number(e.target.value) })} className="bg-surface border border-outline-variant rounded px-2 py-1.5 text-xs outline-none focus:border-primary" />
                </div>
              </div>
            </div>
          )}

          {selectedEl && selectedEl.type !== "group" && (
            <div className="p-4 flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-on-surface capitalize">{selectedEl.type} Element</h3>
                <button onClick={() => handleDeleteElement(selectedEl.id)} className="w-7 h-7 rounded hover:bg-error/10 text-error flex items-center justify-center" title="Delete Element">
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
              </div>

              {/* Dimensions */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-secondary font-semibold">X (px)</label>
                  <input type="number" value={Math.round(selectedEl.x)} onChange={e => handleUpdateElement(selectedEl.id, { x: Number(e.target.value) })} className="bg-surface border border-outline-variant rounded px-2 py-1.5 text-xs outline-none focus:border-primary" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-secondary font-semibold">Y (px)</label>
                  <input type="number" value={Math.round(selectedEl.y)} onChange={e => handleUpdateElement(selectedEl.id, { y: Number(e.target.value) })} className="bg-surface border border-outline-variant rounded px-2 py-1.5 text-xs outline-none focus:border-primary" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-secondary font-semibold">Width (px)</label>
                  <input type="number" value={Math.round(selectedEl.w)} onChange={e => handleUpdateElement(selectedEl.id, { w: Number(e.target.value) })} className="bg-surface border border-outline-variant rounded px-2 py-1.5 text-xs outline-none focus:border-primary" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-secondary font-semibold">Height (px)</label>
                  <input type="number" value={Math.round(selectedEl.h)} onChange={e => handleUpdateElement(selectedEl.id, { h: Number(e.target.value) })} className="bg-surface border border-outline-variant rounded px-2 py-1.5 text-xs outline-none focus:border-primary" />
                </div>
              </div>

              {/* Data Binding */}
              {(selectedEl.type === "text" || selectedEl.type === "image" || selectedEl.type === "shape") && (
                <div className="flex flex-col gap-1 pb-4 border-b border-outline-variant">
                  <label className="text-[10px] font-bold text-primary uppercase">Bind to Data</label>
                  <select value={selectedEl.bindTo || "none"} onChange={e => handleUpdateElement(selectedEl.id, { bindTo: e.target.value as any })} className="bg-primary/5 border border-primary/30 text-primary font-medium rounded px-2 py-1.5 text-xs outline-none focus:border-primary">
                    <option value="none">None (Manual)</option>
                    {selectedEl.type === "text" && (
                      <>
                        <option value="title">Article Title</option>
                        <option value="author">Article Author</option>
                        <option value="genre">Article Genre</option>
                        <option value="badgeText">Badge Text</option>
                        <option value="tags">Tags (Flex Container)</option>
                        <option value="color">Theme Color</option>
                      </>
                    )}
                    {selectedEl.type === "image" && (
                      <option value="imageUrl">Article Image URL</option>
                    )}
                    {selectedEl.type === "shape" && (
                      <option value="color">Theme Color</option>
                    )}
                  </select>
                  <p className="text-[9px] text-secondary mt-1">If bound, content will automatically update from the article data.</p>
                </div>
              )}

              {/* Text specific */}
              {selectedEl.type === "text" && (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-secondary uppercase">Text Content</label>
                    <textarea 
                      value={selectedEl.text || ""} 
                      onFocus={saveHistory}
                      onChange={e => handleUpdateElement(selectedEl.id, { text: e.target.value })} 
                      disabled={selectedEl.bindTo !== undefined && selectedEl.bindTo !== "none"}
                      className="bg-surface border border-outline-variant rounded px-2.5 py-2 text-xs outline-none focus:border-primary min-h-[80px] resize-y disabled:opacity-50 disabled:bg-surface-container" 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-secondary uppercase">Font Size</label>
                      <input type="number" value={selectedEl.fontSize} onChange={e => handleUpdateElement(selectedEl.id, { fontSize: Number(e.target.value) })} className="bg-surface border border-outline-variant rounded px-2 py-1.5 text-xs outline-none focus:border-primary" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-secondary uppercase">Weight</label>
                      <select value={selectedEl.fontWeight || "normal"} onChange={e => handleUpdateElement(selectedEl.id, { fontWeight: e.target.value })} className="bg-surface border border-outline-variant rounded px-2 py-1.5 text-xs outline-none focus:border-primary">
                        <option value="normal">Normal</option>
                        <option value="500">Medium</option>
                        <option value="bold">Bold</option>
                        <option value="800">Extra Bold</option>
                        <option value="900">Black</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-secondary uppercase">Text Color</label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={selectedEl.color} onChange={e => handleUpdateElement(selectedEl.id, { color: e.target.value })} className="w-8 h-8 rounded cursor-pointer p-0 border-none bg-transparent" />
                      <input type="text" value={selectedEl.color} onChange={e => handleUpdateElement(selectedEl.id, { color: e.target.value })} className="flex-1 bg-surface border border-outline-variant rounded px-2 py-1.5 text-xs outline-none focus:border-primary uppercase font-mono" />
                    </div>
                  </div>
                </div>
              )}

              {/* Image specific */}
              {selectedEl.type === "image" && (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-secondary uppercase">Image URL</label>
                    <input 
                      type="text" 
                      value={selectedEl.src || ""} 
                      onFocus={saveHistory}
                      onChange={e => handleUpdateElement(selectedEl.id, { src: e.target.value })} 
                      disabled={selectedEl.bindTo === "imageUrl"}
                      className="bg-surface border border-outline-variant rounded px-2 py-1.5 text-xs outline-none focus:border-primary disabled:opacity-50 disabled:bg-surface-container" 
                      placeholder="https://" 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-secondary uppercase">Fit</label>
                      <select value={selectedEl.objectFit || "cover"} onChange={e => handleUpdateElement(selectedEl.id, { objectFit: e.target.value as any })} className="bg-surface border border-outline-variant rounded px-2 py-1.5 text-xs outline-none focus:border-primary">
                        <option value="cover">Cover</option>
                        <option value="contain">Contain</option>
                        <option value="fill">Fill</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-secondary uppercase">Radius (px)</label>
                      <input type="number" value={selectedEl.borderRadius || 0} onChange={e => handleUpdateElement(selectedEl.id, { borderRadius: Number(e.target.value) })} className="bg-surface border border-outline-variant rounded px-2 py-1.5 text-xs outline-none focus:border-primary" />
                    </div>
                  </div>
                </div>
              )}

              {/* Shape specific */}
              {selectedEl.type === "shape" && (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-secondary uppercase">Fill Color</label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={selectedEl.bgColor || "#000000"} onChange={e => handleUpdateElement(selectedEl.id, { bgColor: e.target.value })} className="w-8 h-8 rounded cursor-pointer p-0 border-none bg-transparent" />
                      <input type="text" value={selectedEl.bgColor || "#000000"} onChange={e => handleUpdateElement(selectedEl.id, { bgColor: e.target.value })} className="flex-1 bg-surface border border-outline-variant rounded px-2 py-1.5 text-xs outline-none focus:border-primary uppercase font-mono" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-secondary uppercase">Radius (px)</label>
                    <input type="number" value={selectedEl.borderRadius || 0} onChange={e => handleUpdateElement(selectedEl.id, { borderRadius: Number(e.target.value) })} className="bg-surface border border-outline-variant rounded px-2 py-1.5 text-xs outline-none focus:border-primary" />
                  </div>
                </div>
              )}

              {/* Layer Ordering */}
              <div className="flex flex-col gap-1 pt-4 border-t border-outline-variant">
                <label className="text-[10px] font-bold text-secondary uppercase">Layer Order (Z-Index)</label>
                <input type="number" value={selectedEl.zIndex || 1} onChange={e => handleUpdateElement(selectedEl.id, { zIndex: Number(e.target.value) })} className="bg-surface border border-outline-variant rounded px-2 py-1.5 text-xs outline-none focus:border-primary" />
              </div>
            </div>
          )}

          {!selectedEl && !isMultiSelect && (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-secondary">
              <span className="material-symbols-outlined text-[48px] mb-2 opacity-50">touch_app</span>
              <p className="text-xs">Pilih elemen pada canvas untuk memodifikasinya.</p>
            </div>
          )}
        </aside>
      </div>

      {/* AI Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-surface w-[500px] rounded-xl border border-outline-variant shadow-2xl p-6 flex flex-col gap-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-tertiary">auto_awesome</span>
                Import Design with AI
              </h2>
              <button onClick={() => setIsImportModalOpen(false)} className="text-secondary hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <p className="text-sm text-secondary">
              Gunakan AI untuk membaca tata letak dari gambar referensi (URL) atau kode HTML, lalu ubah menjadi elemen Canvas yang bisa diedit.
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => setImportType("image")}
                className={`flex-1 py-2 rounded text-sm font-semibold transition-colors ${importType === "image" ? "bg-tertiary/20 text-tertiary border border-tertiary" : "bg-surface-container text-secondary border border-transparent"}`}
              >
                From Image URL
              </button>
              <button
                onClick={() => setImportType("html")}
                className={`flex-1 py-2 rounded text-sm font-semibold transition-colors ${importType === "html" ? "bg-tertiary/20 text-tertiary border border-tertiary" : "bg-surface-container text-secondary border border-transparent"}`}
              >
                From HTML
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase text-secondary">
                {importType === "image" ? "Image URL or Upload File" : "Paste HTML Code"}
              </label>
              {importType === "image" ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="https://example.com/banner.png"
                      value={importContent.startsWith("data:image") ? "[File Uploaded]" : importContent}
                      onChange={e => {
                        if (e.target.value === "[File Uploaded]") return
                        setImportContent(e.target.value)
                      }}
                      className="flex-1 min-w-0 bg-surface-container border border-outline-variant rounded px-3 py-2 text-sm text-on-surface outline-none focus:border-tertiary"
                    />
                    <label className="bg-surface-container-high border border-outline-variant hover:bg-surface-container-highest cursor-pointer px-3 py-2 rounded text-sm font-semibold flex items-center justify-center text-on-surface transition-colors" title="Upload Image File">
                      <span className="material-symbols-outlined text-[18px]">upload_file</span>
                      <input type="file" accept="image/png, image/jpeg, image/webp" className="hidden" onChange={handleFileUpload} />
                    </label>
                  </div>
                  {importContent.startsWith("data:image") && (
                    <div className="text-xs text-tertiary font-semibold flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">check_circle</span>
                      Image file ready to be analyzed
                    </div>
                  )}
                </div>
              ) : (
                <textarea
                  placeholder="<div style='...'>...</div>"
                  value={importContent}
                  onChange={e => setImportContent(e.target.value)}
                  className="w-full h-32 bg-surface-container border border-outline-variant rounded px-3 py-2 text-sm text-on-surface outline-none focus:border-tertiary resize-none font-mono"
                />
              )}
            </div>

            <div className="flex justify-end gap-3 mt-2">
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 text-sm font-semibold text-secondary hover:bg-surface-container rounded"
              >
                Batal
              </button>
              <button
                onClick={handleImportAI}
                disabled={isImporting || !importContent}
                className="px-4 py-2 bg-tertiary text-on-tertiary text-sm font-semibold rounded hover:bg-tertiary/90 flex items-center gap-2 disabled:opacity-50"
              >
                {isImporting ? (
                  <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                ) : (
                  <span className="material-symbols-outlined text-[18px]">magic_button</span>
                )}
                {isImporting ? "Menganalisis..." : "Generate Canvas Elements"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
