"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { BannerTemplate, TEMPLATES, BannerTemplateId, BannerFormat } from "@/components/banner-template"
import html2canvas from "html2canvas"

interface Banner {
  id: string
  name: string
  format: BannerFormat
  template: BannerTemplateId
  title: string
  author: string
  genre: string
  badgeText: string
  tags: string
  imageUrl: string
  createdAt: string
  updatedAt: string
}

// ────────────────────────────────────────────
//  Mini Preview card (scaled thumbnail)
// ────────────────────────────────────────────
function BannerThumb({ banner }: { banner: Banner }) {
  const W = banner.format === "MEDIUM" ? 1200 : 1080
  const H = banner.format === "MEDIUM" ? 675 : 1080
  const thumbW = 280
  const thumbH = Math.round(H * (thumbW / W))
  const scale = thumbW / W

  return (
    <div style={{ width: thumbW, height: thumbH, overflow: "hidden", position: "relative", borderRadius: 8 }}>
      <div style={{ width: W, height: H, transform: `scale(${scale})`, transformOrigin: "top left", position: "absolute", top: 0, left: 0 }}>
        <BannerTemplate
          title={banner.title}
          author={banner.author}
          genre={banner.genre}
          badgeText={banner.badgeText}
          tags={banner.tags ? banner.tags.split(",").map(t => t.trim()) : []}
          imageUrl={banner.imageUrl || undefined}
          format={banner.format}
          template={banner.template}
        />
      </div>
    </div>
  )
}

// ────────────────────────────────────────────
//  Create Banner Modal
// ────────────────────────────────────────────
function CreateModal({ onClose, onCreate }: { onClose: () => void; onCreate: (b: Banner) => void }) {
  const [step, setStep] = useState<1 | 2>(1)
  const [format, setFormat] = useState<BannerFormat>("MEDIUM")
  const [template, setTemplate] = useState<BannerTemplateId>("classic")
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)

  const templates = TEMPLATES[format]

  async function handleCreate() {
    setLoading(true)
    const res = await fetch("/api/banners", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name || `${format} - ${template}`, format, template }),
    })
    if (res.ok) {
      const b = await res.json()
      onCreate(b)
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-surface-container rounded-2xl shadow-2xl w-full max-w-lg p-6 flex flex-col gap-5 relative" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-secondary hover:text-on-surface">
          <span className="material-symbols-outlined">close</span>
        </button>
        <h2 className="text-lg font-bold text-on-surface">Buat Banner Baru</h2>

        {step === 1 && (
          <>
            <p className="text-sm text-secondary">Pilih format banner:</p>
            <div className="grid grid-cols-2 gap-3">
              {(["MEDIUM", "INSTAGRAM"] as BannerFormat[]).map(f => (
                <button
                  key={f}
                  onClick={() => { setFormat(f); setTemplate("classic") }}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${format === f ? "border-primary bg-primary/5" : "border-outline-variant hover:border-outline"}`}
                >
                  <span className="material-symbols-outlined text-3xl text-primary">
                    {f === "MEDIUM" ? "panorama_wide_angle" : "crop_square"}
                  </span>
                  <span className="text-sm font-semibold text-on-surface">{f === "MEDIUM" ? "Medium (16:9)" : "Instagram (1:1)"}</span>
                  <span className="text-[11px] text-secondary">{f === "MEDIUM" ? "1200 × 675 px" : "1080 × 1080 px"}</span>
                </button>
              ))}
            </div>
            <button onClick={() => setStep(2)} className="w-full bg-primary text-on-primary font-semibold rounded-lg py-3 hover:bg-primary/90 transition-colors">
              Pilih Template →
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <p className="text-sm text-secondary">Pilih template untuk {format === "MEDIUM" ? "Medium (16:9)" : "Instagram (1:1)"}:</p>
            <div className="flex flex-col gap-2">
              {templates.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTemplate(t.id)}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${template === t.id ? "border-primary bg-primary/5" : "border-outline-variant hover:border-outline"}`}
                >
                  <div className="w-8 h-8 rounded-md flex-shrink-0" style={{ background: t.bg }} />
                  <div>
                    <div className="text-sm font-semibold text-on-surface">{t.name}</div>
                    <div className="text-[11px] text-secondary">{t.desc}</div>
                  </div>
                  {template === t.id && <span className="material-symbols-outlined text-primary ml-auto">check_circle</span>}
                </button>
              ))}
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-secondary">Nama Banner</label>
              <input
                className="w-full bg-surface-container-high border border-outline-variant rounded-lg px-3 py-2 text-sm text-on-surface focus:border-primary outline-none transition-all"
                placeholder={`${format} - ${template}`}
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setStep(1)} className="flex-1 border border-outline text-on-surface font-semibold rounded-lg py-3 hover:bg-surface-container transition-colors text-sm">
                ← Kembali
              </button>
              <button onClick={handleCreate} disabled={loading} className="flex-1 bg-primary text-on-primary font-semibold rounded-lg py-3 hover:bg-primary/90 transition-colors disabled:opacity-50 text-sm">
                {loading ? "Membuat..." : "Buat Banner"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ────────────────────────────────────────────
//  Main Canvas Page
// ────────────────────────────────────────────
export default function CanvasPage() {
  const router = useRouter()
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [filterFormat, setFilterFormat] = useState<"ALL" | "MEDIUM" | "INSTAGRAM">("ALL")

  useEffect(() => {
    fetch("/api/banners")
      .then(r => r.json())
      .then(data => { setBanners(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function handleDelete(id: string) {
    await fetch(`/api/banners/${id}`, { method: "DELETE" })
    setBanners(prev => prev.filter(b => b.id !== id))
    setDeleteId(null)
  }

  const filtered = filterFormat === "ALL" ? banners : banners.filter(b => b.format === filterFormat)

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="px-8 py-6 border-b border-outline-variant bg-surface-container-low flex items-center justify-between sticky top-0 z-10">
        <div>
          <h1 className="text-2xl font-bold text-on-surface tracking-tight">Canvas</h1>
          <p className="text-sm text-secondary mt-0.5">Buat dan kelola banner & post Instagram</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-primary text-on-primary font-semibold px-5 py-2.5 rounded-xl hover:bg-primary/90 transition-colors text-sm"
        >
          <span className="material-symbols-outlined text-base">add</span>
          Buat Banner
        </button>
      </header>

      <main className="flex-1 p-8 flex flex-col gap-6">
        {/* Filter Tabs */}
        <div className="flex gap-2">
          {(["ALL", "MEDIUM", "INSTAGRAM"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilterFormat(f)}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
                filterFormat === f
                  ? "bg-primary text-on-primary"
                  : "bg-surface-container text-secondary hover:bg-surface-container-high border border-outline-variant"
              }`}
            >
              {f === "ALL" ? "Semua" : f === "MEDIUM" ? "Medium (16:9)" : "Instagram (1:1)"}
            </button>
          ))}
          <span className="ml-auto text-xs text-secondary self-center">{filtered.length} banner</span>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20 text-secondary">
            <span className="material-symbols-outlined animate-spin mr-2">progress_activity</span>
            Memuat...
          </div>
        )}

        {/* Empty State */}
        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-secondary">
            <span className="material-symbols-outlined text-6xl opacity-30">image_not_supported</span>
            <p className="text-base font-medium">Belum ada banner</p>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 bg-primary text-on-primary font-semibold px-5 py-2.5 rounded-xl hover:bg-primary/90 transition-colors text-sm"
            >
              <span className="material-symbols-outlined text-base">add</span>
              Buat Banner Pertama
            </button>
          </div>
        )}

        {/* Grid */}
        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map(banner => (
              <div key={banner.id} className="group flex flex-col gap-0 bg-surface-container rounded-2xl border border-outline-variant overflow-hidden hover:shadow-lg hover:border-outline transition-all">
                {/* Thumbnail */}
                <div className="relative overflow-hidden bg-surface-container-low">
                  <BannerThumb banner={banner} />
                  {/* Overlay actions */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    <Link
                      href={`/dashboard/canvas/${banner.id}`}
                      className="flex items-center gap-1.5 bg-white text-black text-xs font-bold px-3 py-2 rounded-lg hover:bg-primary hover:text-on-primary transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">edit</span>
                      Edit
                    </Link>
                    <button
                      onClick={() => setDeleteId(banner.id)}
                      className="flex items-center gap-1.5 bg-white text-red-600 text-xs font-bold px-3 py-2 rounded-lg hover:bg-red-600 hover:text-white transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                  </div>
                </div>

                {/* Info */}
                <div className="p-3 flex flex-col gap-1">
                  <p className="text-sm font-semibold text-on-surface truncate">{banner.name}</p>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${banner.format === "MEDIUM" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" : "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300"}`}>
                      {banner.format === "MEDIUM" ? "16:9" : "1:1"}
                    </span>
                    <span className="text-[10px] text-secondary capitalize">{banner.template}</span>
                    <span className="ml-auto text-[10px] text-secondary">{new Date(banner.updatedAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Modal */}
      {showCreate && (
        <CreateModal
          onClose={() => setShowCreate(false)}
          onCreate={(b) => {
            setBanners(prev => [b, ...prev])
            setShowCreate(false)
            router.push(`/dashboard/canvas/${b.id}`)
          }}
        />
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setDeleteId(null)}>
          <div className="bg-surface-container rounded-2xl shadow-2xl p-6 flex flex-col gap-4 max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-on-surface">Hapus Banner?</h3>
            <p className="text-sm text-secondary">Banner yang dihapus tidak bisa dikembalikan.</p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteId(null)} className="flex-1 border border-outline text-on-surface font-semibold rounded-lg py-2.5 hover:bg-surface-container transition-colors text-sm">
                Batal
              </button>
              <button onClick={() => handleDelete(deleteId)} className="flex-1 bg-error text-on-error font-semibold rounded-lg py-2.5 hover:bg-error/90 transition-colors text-sm">
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
