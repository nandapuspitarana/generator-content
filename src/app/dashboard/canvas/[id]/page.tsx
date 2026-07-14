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
  lineHeight?: number; letterSpacing?: number; textWrap?: "normal" | "nowrap" | "pre-wrap"
  // Image specific
  src?: string; objectFit?: "cover" | "contain" | "fill"
  opacity?: number              // 0-1, default 1
  blendMode?: string            // CSS mix-blend-mode, default "normal"
  objectPositionX?: number      // 0-100, default 50
  objectPositionY?: number      // 0-100, default 50
  // Shape specific
  bgColor?: string; borderRadius?: number
  zIndex?: number
  bindTo?: "none" | "title" | "author" | "genre" | "badgeText" | "tags" | "imageUrl" | "color"
  // Layer System
  locked?: boolean
  hidden?: boolean
  layerName?: string
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
  backgroundImage?: string
  backgroundImageOpacity?: number
  backgroundBlendMode?: string
}

async function inlineImages(container: HTMLElement) {
  const imgs = container.querySelectorAll("img")
  const jobs = Array.from(imgs).map(async (img) => {
    const src = img.src
    if (!src || src.startsWith("data:")) return
    try {
      const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(src)}`
      const resp = await fetch(proxyUrl)
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
  
  const [bgImage, setBgImage] = useState<string>("")
  const [bgImageOpacity, setBgImageOpacity] = useState(1)
  const [bgBlendMode, setBgBlendMode] = useState("normal")
  const [dragLayerId, setDragLayerId] = useState<string | null>(null)
  
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [articles, setArticles] = useState<any[]>([])
  
  useEffect(() => {
    fetch("/api/articles")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setArticles(data)
      })
      .catch(console.error)
  }, [])
  
  type Guideline = { type: "horizontal" | "vertical", pos: number }
  const [guidelines, setGuidelines] = useState<Guideline[]>([])
  
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
        setBgImage(data.backgroundImage || "")
        setBgImageOpacity(data.backgroundImageOpacity ?? 1)
        setBgBlendMode(data.backgroundBlendMode || "normal")
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
    try {
      const res = await fetch(`/api/banners/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          elements: JSON.stringify(elements), 
          backgroundColor: bgColor, 
          name: banner.name,
          title: banner.title,
          author: banner.author,
          genre: banner.genre,
          imageUrl: banner.imageUrl,
          backgroundImage: bgImage,
          backgroundImageOpacity: bgImageOpacity,
          backgroundBlendMode: bgBlendMode
        })
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Unknown error occurred')
      }
      setHasUnsavedChanges(false)
    } catch (e: any) {
      alert(`Gagal menyimpan banner: ${e.message}`)
    } finally {
      setSaving(false)
    }
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

  const normalizeZIndexes = (els: CanvasElement[]) => {
    return [...els]
      .sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0))
      .map((el, i) => ({ ...el, zIndex: i + 1 }))
  }

  const handleLayerMoveUp = (elId: string) => {
    saveHistory()
    setElements(prev => {
      const normalized = normalizeZIndexes(prev)
      const idx = normalized.findIndex(e => e.id === elId)
      if (idx === -1 || idx === normalized.length - 1) return prev
      const current = normalized[idx]
      const next = normalized[idx + 1]
      normalized[idx] = { ...next, zIndex: current.zIndex }
      normalized[idx + 1] = { ...current, zIndex: next.zIndex }
      return normalized
    })
    setHasUnsavedChanges(true)
  }

  const handleLayerMoveDown = (elId: string) => {
    saveHistory()
    setElements(prev => {
      const normalized = normalizeZIndexes(prev)
      const idx = normalized.findIndex(e => e.id === elId)
      if (idx <= 0) return prev
      const current = normalized[idx]
      const prevEl = normalized[idx - 1]
      normalized[idx] = { ...prevEl, zIndex: current.zIndex }
      normalized[idx - 1] = { ...current, zIndex: prevEl.zIndex }
      return normalized
    })
    setHasUnsavedChanges(true)
  }

  const handleLayerReorder = (fromId: string, toId: string) => {
    if (fromId === toId) return
    saveHistory()
    setElements(prev => {
      const normalized = normalizeZIndexes(prev)
      const fromIdx = normalized.findIndex(e => e.id === fromId)
      const toIdx = normalized.findIndex(e => e.id === toId)
      if (fromIdx === -1 || toIdx === -1) return prev
      
      const [moved] = normalized.splice(fromIdx, 1)
      normalized.splice(toIdx, 0, moved)
      return normalizeZIndexes(normalized)
    })
    setHasUnsavedChanges(true)
  }

  const handleToggleLock = (elId: string) => {
    setElements(prev => prev.map(el => el.id === elId ? { ...el, locked: !el.locked } : el))
    setHasUnsavedChanges(true)
  }

  const handleToggleHidden = (elId: string) => {
    setElements(prev => prev.map(el => el.id === elId ? { ...el, hidden: !el.hidden } : el))
    setHasUnsavedChanges(true)
  }

  const handleRenameLayer = (elId: string, name: string) => {
    handleUpdateElement(elId, { layerName: name })
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
    const SNAP_THRESHOLD = 5;
    let newX = d.x;
    let newY = d.y;
    const activeGuides: Guideline[] = [];
    
    const draggedEl = elements.find(e => e.id === elId);
    if (!draggedEl) return;
    
    const topLevelEls = elements.filter(el => !el.groupId);
    const otherEls = topLevelEls.filter(e => !selectedIds.includes(e.id) && e.id !== elId);
    
    let snappedX = false;
    let snappedY = false;

    // Check X axis (left, center, right)
    for (const other of otherEls) {
      if (!snappedX) {
        const targetEdgesX = [other.x, other.x + other.w / 2, other.x + other.w];
        const draggedEdgesX = [newX, newX + draggedEl.w / 2, newX + draggedEl.w];
        
        for (const te of targetEdgesX) {
          for (const de of draggedEdgesX) {
            if (Math.abs(de - te) < SNAP_THRESHOLD) {
              const offset = te - de;
              newX += offset;
              activeGuides.push({ type: 'vertical', pos: te });
              snappedX = true;
              break;
            }
          }
          if (snappedX) break;
        }
      }
      
      if (!snappedY) {
        const targetEdgesY = [other.y, other.y + other.h / 2, other.y + other.h];
        const draggedEdgesY = [newY, newY + draggedEl.h / 2, newY + draggedEl.h];
        
        for (const te of targetEdgesY) {
          for (const de of draggedEdgesY) {
            if (Math.abs(de - te) < SNAP_THRESHOLD) {
              const offset = te - de;
              newY += offset;
              activeGuides.push({ type: 'horizontal', pos: te });
              snappedY = true;
              break;
            }
          }
          if (snappedY) break;
        }
      }
      
      if (snappedX && snappedY) break;
    }
    
    setGuidelines(activeGuides);

    setElements(prev => {
      const draggedPrev = prev.find(e => e.id === elId)
      if (!draggedPrev) return prev;
      const dx = newX - draggedPrev.x;
      const dy = newY - draggedPrev.y;
      
      if (dx === 0 && dy === 0) return prev;
      
      const isDraggingSelected = selectedIds.includes(elId);

      return prev.map(item => {
        if (item.id === elId) {
          return { ...item, x: newX, y: newY }
        }
        if (isDraggingSelected && selectedIds.includes(item.id) && !item.groupId) {
          return { ...item, x: item.x + dx, y: item.y + dy }
        }
        return item;
      })
    })
    setHasUnsavedChanges(true)
  }

  const handleDragStop = (elId: string, d: { x: number, y: number }) => {
    handleDragMulti(elId, d);
    setGuidelines([]);
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
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input/textarea
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') return

      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'g' || e.key === 'G') {
          e.preventDefault()
          if (e.shiftKey) {
            handleUngroup()
          } else {
            handleGroup()
          }
        }
        if (e.key === 'l' || e.key === 'L') {
          e.preventDefault()
          if (selectedIds.length === 1) handleToggleLock(selectedIds[0])
        }
        if (e.key === 'h' || e.key === 'H') {
          e.preventDefault()
          if (selectedIds.length === 1) handleToggleHidden(selectedIds[0])
        }
      } else {
        if (e.key === ']' && selectedIds.length === 1) {
          handleLayerMoveUp(selectedIds[0])
        }
        if (e.key === '[' && selectedIds.length === 1) {
          handleLayerMoveDown(selectedIds[0])
        }
        if (e.key === 'Delete' || e.key === 'Backspace') {
          if (selectedIds.length > 0) {
            saveHistory()
            selectedIds.forEach(id => handleDeleteElement(id))
            setSelectedIds([])
          }
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIds, handleGroup, handleUngroup, saveHistory, elements])


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
      const alignMap = { left: "flex-start", center: "center", right: "flex-end", justify: "flex-start" }
      const jc = alignMap[el.textAlign || "left"]
      return (
        <div style={{ width: "100%", height: "100%", fontSize: `${el.fontSize}px`, color: currentColor, fontWeight: el.fontWeight, textAlign: el.textAlign || "left", display: "flex", alignItems: "center", justifyContent: jc, lineHeight: el.lineHeight || 1.2, letterSpacing: `${el.letterSpacing || 0}px`, whiteSpace: el.textWrap || "pre-wrap", wordBreak: "break-word" }}>
          {text}
        </div>
      )
    }
    
    if (el.type === "image" && src) {
      const proxySrc = src.startsWith('data:') ? src : `/api/proxy-image?url=${encodeURIComponent(src)}`;
      // eslint-disable-next-line @next/next/no-img-element
      return <img src={proxySrc} alt="element" style={{ width: "100%", height: "100%", objectFit: el.objectFit || "cover", objectPosition: `${el.objectPositionX ?? 50}% ${el.objectPositionY ?? 50}%`, opacity: el.opacity ?? 1, mixBlendMode: (el.blendMode || "normal") as any, pointerEvents: "none", borderRadius: `${el.borderRadius || 0}px` }} crossOrigin="anonymous" />
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
        {/* LEFT TOOLBAR / LAYERS PANEL */}
        <aside className="w-64 border-r border-outline-variant bg-surface-container flex flex-col shrink-0 overflow-hidden">
          <div className="p-4 border-b border-outline-variant grid grid-cols-3 gap-2">
            <button onClick={() => handleAddElement("text")} className="h-14 flex flex-col items-center justify-center rounded border border-outline-variant hover:bg-outline-variant/50 text-secondary hover:text-primary transition-colors group bg-surface">
              <span className="material-symbols-outlined text-[20px]">title</span>
              <span className="text-[9px] font-medium mt-1">Text</span>
            </button>
            <button onClick={() => handleAddElement("image")} className="h-14 flex flex-col items-center justify-center rounded border border-outline-variant hover:bg-outline-variant/50 text-secondary hover:text-primary transition-colors group bg-surface">
              <span className="material-symbols-outlined text-[20px]">image</span>
              <span className="text-[9px] font-medium mt-1">Image</span>
            </button>
            <button onClick={() => handleAddElement("shape")} className="h-14 flex flex-col items-center justify-center rounded border border-outline-variant hover:bg-outline-variant/50 text-secondary hover:text-primary transition-colors group bg-surface">
              <span className="material-symbols-outlined text-[20px]">square</span>
              <span className="text-[9px] font-medium mt-1">Shape</span>
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto flex flex-col">
            <div className="px-4 py-3 border-b border-outline-variant bg-surface-container-low flex items-center justify-between">
              <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider">Layers</h3>
              <span className="text-[10px] text-secondary">Shift+Click to select</span>
            </div>
            <div className="flex flex-col p-2 gap-1">
              {[...topLevelElements].reverse().map(el => {
                const isSelected = selectedIds.includes(el.id);
                const isGroup = el.type === "group";
                
                return (
                  <div key={el.id} className="flex flex-col gap-1">
                    <div 
                      onClick={(e) => {
                        if (e.shiftKey) {
                          setSelectedIds(prev => prev.includes(el.id) ? prev.filter(i => i !== el.id) : [...prev, el.id])
                        } else {
                          setSelectedIds([el.id])
                        }
                      }}
                      className={`flex items-center gap-1.5 px-2 py-1.5 rounded text-xs font-medium border ${isSelected ? 'bg-primary/10 border-primary text-primary' : 'bg-surface border-transparent text-secondary hover:bg-outline-variant/30 hover:text-on-surface'} ${el.hidden ? 'opacity-50' : ''}`}
                    >
                      {/* Drag Handle & Ordering */}
                      <div className="flex flex-col items-center justify-center opacity-50 hover:opacity-100">
                        <button onClick={(e) => { e.stopPropagation(); handleLayerMoveUp(el.id) }} className="hover:text-primary leading-none" title="Move Up"><span className="material-symbols-outlined text-[12px]">keyboard_arrow_up</span></button>
                        <button onClick={(e) => { e.stopPropagation(); handleLayerMoveDown(el.id) }} className="hover:text-primary leading-none" title="Move Down"><span className="material-symbols-outlined text-[12px]">keyboard_arrow_down</span></button>
                      </div>

                      {/* Icon */}
                      <span className="material-symbols-outlined text-[16px] ml-1">
                        {isGroup ? "folder" : el.type === "text" ? "title" : el.type === "image" ? "image" : "square"}
                      </span>

                      {/* Name with double click to rename */}
                      <input 
                        className="flex-1 min-w-0 bg-transparent border-none outline-none cursor-pointer text-inherit placeholder-secondary/50 focus:cursor-text focus:bg-surface focus:px-1 focus:-ml-1 rounded"
                        value={el.layerName || (isGroup ? "Group" : el.type)}
                        onChange={(e) => handleRenameLayer(el.id, e.target.value)}
                        onDoubleClick={(e) => (e.target as HTMLInputElement).select()}
                      />

                      {/* Quick Actions */}
                      <div className="flex items-center gap-1 opacity-70">
                        <button onClick={(e) => { e.stopPropagation(); handleToggleHidden(el.id) }} className={`hover:text-primary ${el.hidden ? 'text-primary opacity-100' : ''}`} title="Toggle Visibility">
                          <span className="material-symbols-outlined text-[14px]">{el.hidden ? "visibility_off" : "visibility"}</span>
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleToggleLock(el.id) }} className={`hover:text-primary ${el.locked ? 'text-error opacity-100' : ''}`} title="Toggle Lock">
                          <span className="material-symbols-outlined text-[14px]">{el.locked ? "lock" : "lock_open"}</span>
                        </button>
                      </div>
                    </div>
                    {/* Render children if group */}
                    {isGroup && (
                      <div className="flex flex-col gap-1 pl-6">
                        {elements.filter(child => child.groupId === el.id).map(child => (
                          <div key={child.id} className="flex items-center gap-2 px-2 py-1 rounded text-[11px] font-medium text-secondary/70 bg-surface-container-low border border-outline-variant/30">
                            <span className="material-symbols-outlined text-[14px]">
                              {child.type === "text" ? "title" : child.type === "image" ? "image" : "square"}
                            </span>
                            <span className="flex-1 truncate capitalize">{child.layerName || child.type}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
              {topLevelElements.length === 0 && (
                <div className="text-center p-4 text-xs text-secondary opacity-70">
                  Canvas kosong.
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* CANVAS AREA */}
        <div className="flex-1 bg-surface-container-lowest overflow-auto relative p-8 flex items-center justify-center" onClick={() => setSelectedIds([])}>
          <div ref={containerRef} style={{ width: "min(900px, 100%)", aspectRatio: `${W}/${H}`, position: "relative" }}>
            <div
              ref={bannerRef}
              style={{ 
                width: W, height: H, 
                backgroundColor: bgColor, 
                backgroundImage: bgImage ? `url(${bgImage})` : undefined,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundBlendMode: bgBlendMode,
                ...(bgImage ? { opacity: bgImageOpacity } : {}), // Wait, if I set opacity here, it sets the whole banner opacity. Let's fix that. Actually, to set background opacity without affecting children, we need a pseudo-element or a wrapper. 
                // Let's use a separate layer for background image so it doesn't affect child elements' opacity.
                // Wait, background blend mode works with backgroundColor and backgroundImage. If we just want opacity on the bg image, CSS doesn't support that directly on background-image. 
                // Let's remove opacity here and just render an img absolute for the background if it exists.
                transform: `scale(${scale})`, transformOrigin: "top left", overflow: "hidden", position: "absolute", top: 0, left: 0 
              }}
              className="shadow-2xl border border-outline-variant"
            >
              {/* Background Image Layer */}
              {bgImage && (
                <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${bgImage})`, backgroundSize: "cover", backgroundPosition: "center", opacity: bgImageOpacity, mixBlendMode: bgBlendMode as any, pointerEvents: "none", zIndex: 0 }} />
              )}
              
              {topLevelElements.filter(el => !el.hidden).map((el) => {
                const isSelected = selectedIds.includes(el.id)
                const isLocked = el.locked
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
                    onDragStop={(e, d) => handleDragStop(el.id, d)}
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
                    resizeHandleStyles={isSelected && !isLocked ? activeResizeHandles : {}}
                    enableResizing={isSelected && !isLocked}
                    disableDragging={isLocked}
                  >
                    <div className="rnd-drag-handle w-full h-full relative" style={{ cursor: isSelected ? "move" : "default" }}>
                      {el.type === "group" ? (
                        <div className="w-full h-full relative">
                          {elements.filter(child => child.groupId === el.id && !child.hidden).map(child => (
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
              
              {/* Render Guidelines */}
              {guidelines.map((g, i) => (
                <div 
                  key={`guide-${i}`} 
                  style={{
                    position: "absolute",
                    backgroundColor: "#3b82f6", // Blue snap line
                    zIndex: 9999,
                    pointerEvents: "none",
                    ...(g.type === 'vertical' ? {
                      left: g.pos,
                      top: 0,
                      width: 1,
                      height: "100%",
                    } : {
                      top: g.pos,
                      left: 0,
                      height: 1,
                      width: "100%",
                    })
                  }}
                />
              ))}
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
            <div className="flex flex-col gap-1.5 pt-3 border-t border-outline-variant">
              <label className="text-[10px] font-bold text-secondary uppercase">Auto-Fill Content</label>
              <select 
                className="bg-surface border border-outline-variant rounded px-2 py-1.5 text-xs outline-none focus:border-primary"
                onChange={(e) => {
                  const articleId = e.target.value
                  if (!articleId || !banner) return
                  const article = articles.find(a => a.id === articleId)
                  if (!article) return
                  
                  setBanner({
                    ...banner,
                    title: article.title || banner.title,
                    author: article.author || banner.author,
                    genre: article.knowledgeTagSlug || banner.genre,
                    imageUrl: article.imageUrl || banner.imageUrl,
                  })
                  setHasUnsavedChanges(true)
                  e.target.value = "" // reset select
                }}
              >
                <option value="">Select Article / Podcast...</option>
                {articles.map(a => (
                  <option key={a.id} value={a.id}>{a.title} ({a.contentType})</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-3 pt-3 border-t border-outline-variant">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-secondary uppercase">Background Image</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="https://... or upload"
                    value={bgImage.startsWith("data:image") ? "[Local Image]" : bgImage}
                    onChange={e => {
                      if (e.target.value === "[Local Image]") return
                      setBgImage(e.target.value)
                      setHasUnsavedChanges(true)
                    }}
                    className="flex-1 min-w-0 bg-surface border border-outline-variant rounded px-2 py-1.5 text-xs outline-none focus:border-primary"
                  />
                  <label className="bg-surface-container border border-outline-variant hover:bg-surface-container-high cursor-pointer w-8 h-8 rounded flex items-center justify-center text-on-surface transition-colors" title="Upload Image File">
                    <span className="material-symbols-outlined text-[16px]">upload_file</span>
                    <input type="file" accept="image/png, image/jpeg, image/webp" className="hidden" onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      const reader = new FileReader()
                      reader.onload = (ev) => {
                        if (ev.target?.result) {
                          setBgImage(ev.target.result as string)
                          setHasUnsavedChanges(true)
                        }
                      }
                      reader.readAsDataURL(file)
                    }} />
                  </label>
                  <button onClick={() => { setBgImage(""); setHasUnsavedChanges(true) }} className="w-8 h-8 rounded flex items-center justify-center text-error hover:bg-error/10 border border-transparent" title="Clear Image">
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                  </button>
                </div>
              </div>
              {bgImage && (
                <>
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold text-secondary uppercase">Opacity</label>
                      <span className="text-[10px] font-mono text-secondary">{Math.round(bgImageOpacity * 100)}%</span>
                    </div>
                    <input type="range" min="0" max="1" step="0.01" value={bgImageOpacity} onChange={e => { setBgImageOpacity(Number(e.target.value)); setHasUnsavedChanges(true) }} className="w-full cursor-pointer" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-secondary uppercase">Blend Mode</label>
                    <select value={bgBlendMode} onChange={e => { setBgBlendMode(e.target.value); setHasUnsavedChanges(true) }} className="bg-surface border border-outline-variant rounded px-2 py-1.5 text-xs outline-none focus:border-primary">
                      <option value="normal">Normal</option>
                      <option value="multiply">Multiply (Darken)</option>
                      <option value="screen">Screen (Lighten)</option>
                      <option value="overlay">Overlay (Contrast)</option>
                      <option value="darken">Darken</option>
                      <option value="lighten">Lighten</option>
                      <option value="color-dodge">Color Dodge</option>
                      <option value="color-burn">Color Burn</option>
                    </select>
                  </div>
                </>
              )}
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
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-secondary uppercase">Alignment</label>
                      <div className="flex bg-surface-container rounded border border-outline-variant p-0.5">
                        {['left', 'center', 'right', 'justify'].map(align => (
                          <button
                            key={align}
                            onClick={() => handleUpdateElement(selectedEl.id, { textAlign: align as any })}
                            className={`flex-1 flex items-center justify-center py-1 rounded text-[14px] ${selectedEl.textAlign === align || (!selectedEl.textAlign && align === 'left') ? 'bg-primary text-on-primary shadow-sm' : 'text-secondary hover:text-on-surface'}`}
                            title={`Align ${align}`}
                          >
                            <span className="material-symbols-outlined text-[14px]">
                              format_align_{align}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-secondary uppercase">Text Wrap</label>
                      <select value={selectedEl.textWrap || "pre-wrap"} onChange={e => handleUpdateElement(selectedEl.id, { textWrap: e.target.value as any })} className="bg-surface border border-outline-variant rounded px-2 py-1 text-xs outline-none focus:border-primary h-[26px]">
                        <option value="pre-wrap">Wrap (Multi-line)</option>
                        <option value="nowrap">No Wrap (Single line)</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-secondary uppercase flex justify-between">
                        <span>Line Height</span>
                        <span className="font-mono text-[9px] lowercase font-normal">{selectedEl.lineHeight ?? 1.2}</span>
                      </label>
                      <input type="range" min="0.5" max="3" step="0.1" value={selectedEl.lineHeight ?? 1.2} onChange={e => handleUpdateElement(selectedEl.id, { lineHeight: Number(e.target.value) })} className="w-full cursor-pointer" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-secondary uppercase flex justify-between">
                        <span>Letter Space</span>
                        <span className="font-mono text-[9px] lowercase font-normal">{selectedEl.letterSpacing ?? 0}px</span>
                      </label>
                      <input type="range" min="-5" max="20" step="1" value={selectedEl.letterSpacing ?? 0} onChange={e => handleUpdateElement(selectedEl.id, { letterSpacing: Number(e.target.value) })} className="w-full cursor-pointer" />
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
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-secondary uppercase flex justify-between">
                        <span>Pos X</span>
                        <span className="font-mono text-[9px] lowercase font-normal">{selectedEl.objectPositionX ?? 50}%</span>
                      </label>
                      <input type="range" min="0" max="100" value={selectedEl.objectPositionX ?? 50} onChange={e => handleUpdateElement(selectedEl.id, { objectPositionX: Number(e.target.value) })} className="w-full cursor-pointer" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-secondary uppercase flex justify-between">
                        <span>Pos Y</span>
                        <span className="font-mono text-[9px] lowercase font-normal">{selectedEl.objectPositionY ?? 50}%</span>
                      </label>
                      <input type="range" min="0" max="100" value={selectedEl.objectPositionY ?? 50} onChange={e => handleUpdateElement(selectedEl.id, { objectPositionY: Number(e.target.value) })} className="w-full cursor-pointer" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold text-secondary uppercase">Opacity</label>
                      <span className="text-[10px] font-mono text-secondary">{Math.round((selectedEl.opacity ?? 1) * 100)}%</span>
                    </div>
                    <input type="range" min="0" max="1" step="0.01" value={selectedEl.opacity ?? 1} onChange={e => handleUpdateElement(selectedEl.id, { opacity: Number(e.target.value) })} className="w-full cursor-pointer" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-secondary uppercase">Blend Mode</label>
                    <select value={selectedEl.blendMode || "normal"} onChange={e => handleUpdateElement(selectedEl.id, { blendMode: e.target.value })} className="bg-surface border border-outline-variant rounded px-2 py-1.5 text-xs outline-none focus:border-primary">
                      <option value="normal">Normal</option>
                      <option value="multiply">Multiply (Darken)</option>
                      <option value="screen">Screen (Lighten)</option>
                      <option value="overlay">Overlay (Contrast)</option>
                      <option value="darken">Darken</option>
                      <option value="lighten">Lighten</option>
                      <option value="color-dodge">Color Dodge</option>
                      <option value="color-burn">Color Burn</option>
                    </select>
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
