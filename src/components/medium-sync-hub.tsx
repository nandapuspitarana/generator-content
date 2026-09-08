"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { format } from "date-fns"

interface ArticleItem {
  id: string
  title: string
  author: string
  contentType: string
  status: string
  mediumUrl: string | null
  createdAt: string | Date
  publishedAt: string | Date | null
  markdownContent: string | null
}

interface MediumProfile {
  id: string
  username: string
  name: string
  url: string
  imageUrl?: string
}

interface MediumPublication {
  id: string
  name: string
  description?: string
  url: string
  imageUrl?: string
}

export function MediumSyncHub({ initialArticles }: { initialArticles: ArticleItem[] }) {
  const [articles, setArticles] = useState<ArticleItem[]>(initialArticles)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isLoadingStatus, setIsLoadingStatus] = useState(true)
  const [isConnected, setIsConnected] = useState(false)
  const [profile, setProfile] = useState<MediumProfile | null>(null)
  const [publications, setPublications] = useState<MediumPublication[]>([])
  const [tokenInput, setTokenInput] = useState("")
  const [activeToken, setActiveToken] = useState("")
  const [showTokenModal, setShowTokenModal] = useState(false)

  // Single sync modal state
  const [syncModalArticle, setSyncModalArticle] = useState<ArticleItem | null>(null)
  const [publishStatus, setPublishStatus] = useState<"draft" | "public" | "unlisted">("draft")
  const [tagsInput, setTagsInput] = useState("book-review, asikreview, reading")
  const [selectedPublication, setSelectedPublication] = useState("")
  const [isSyncing, setIsSyncing] = useState(false)
  const [notification, setNotification] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null)

  // Batch sync state
  const [isBatchSyncing, setIsBatchSyncing] = useState(false)

  const showNotification = (type: "success" | "error" | "info", message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 5000)
  }

  const checkMediumStatus = async (tokenOverride?: string) => {
    setIsLoadingStatus(true)
    try {
      const url = tokenOverride ? `/api/medium/status?token=${encodeURIComponent(tokenOverride)}` : "/api/medium/status"
      const res = await fetch(url)
      const data = await res.json()

      if (data.configured && data.profile) {
        setIsConnected(true)
        setProfile(data.profile)
        setPublications(data.publications || [])
        if (tokenOverride) {
          setActiveToken(tokenOverride)
          showNotification("success", `Terhubung ke Medium sebagai @${data.profile.username}!`)
        }
      } else {
        setIsConnected(false)
        setProfile(null)
        setPublications([])
        if (tokenOverride) {
          showNotification("error", data.error || "Token tidak valid.")
        }
      }
    } catch (e: any) {
      setIsConnected(false)
      showNotification("error", "Gagal menghubungi Medium API status.")
    } finally {
      setIsLoadingStatus(false)
    }
  }

  useEffect(() => {
    checkMediumStatus()
  }, [])

  const handleSelectAllReady = () => {
    const readyIds = articles.filter(a => a.markdownContent).map(a => a.id)
    if (selectedIds.length === readyIds.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(readyIds)
    }
  }

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id])
  }

  const handleExecuteSingleSync = async () => {
    if (!syncModalArticle) return
    setIsSyncing(true)

    try {
      const cleanTags = tagsInput.split(",").map(t => t.trim()).filter(Boolean)
      const res = await fetch("/api/medium/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          articleId: syncModalArticle.id,
          publishStatus,
          tags: cleanTags,
          publicationId: selectedPublication || null,
          token: activeToken || undefined
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Gagal sinkronisasi ke Medium")

      // Update local state
      setArticles(prev => prev.map(a => a.id === syncModalArticle.id ? { ...a, mediumUrl: data.url, status: publishStatus === "public" ? "PUBLISHED" : "READY" } : a))
      showNotification("success", `Berhasil disinkronkan ke Medium sebagai ${publishStatus.toUpperCase()}!`)
      setSyncModalArticle(null)
    } catch (e: any) {
      showNotification("error", e.message || "Terjadi kesalahan saat sinkronisasi.")
    } finally {
      setIsSyncing(false)
    }
  }

  const handleExecuteBatchSync = async () => {
    if (selectedIds.length === 0) return
    setIsBatchSyncing(true)

    try {
      const res = await fetch("/api/medium/batch-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          articleIds: selectedIds,
          publishStatus: "draft",
          tags: ["book-review", "asikreview", "reading"],
          token: activeToken || undefined
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Gagal batch sync")

      showNotification("success", `Batch sync selesai: ${data.successCount} berhasil, ${data.failedCount} gagal.`)

      // Update local state for success items
      const successMap = new Map<string, string>()
      data.results?.forEach((r: any) => {
        if (r.success && r.url) successMap.set(r.id, r.url)
      })

      setArticles(prev => prev.map(a => {
        if (successMap.has(a.id)) {
          return { ...a, mediumUrl: successMap.get(a.id)!, status: "READY" }
        }
        return a
      }))
      setSelectedIds([])
    } catch (e: any) {
      showNotification("error", e.message || "Gagal batch sync.")
    } finally {
      setIsBatchSyncing(false)
    }
  }

  const syncedCount = articles.filter(a => Boolean(a.mediumUrl)).length
  const readyToSyncCount = articles.filter(a => a.markdownContent && !a.mediumUrl).length

  return (
    <div className="flex-1 p-6 md:p-10 max-w-[1300px] mx-auto w-full">
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg shadow-xl text-xs font-semibold flex items-center gap-2 transition-all ${
          notification.type === "success" ? "bg-[#1a8917] text-white" :
          notification.type === "error" ? "bg-[#c8102e] text-white" : "bg-[#191919] text-white"
        }`}>
          <span className="material-symbols-outlined text-[18px]">
            {notification.type === "success" ? "check_circle" : notification.type === "error" ? "error" : "info"}
          </span>
          <span>{notification.message}</span>
        </div>
      )}

      {/* Editorial Header */}
      <div className="mb-8 border-b border-[#e8e7e0] pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-mono font-bold tracking-wider text-[#777777] uppercase mb-1">
            <span>DISTRIBUTION PIPELINE</span>
            <span>/</span>
            <span className="text-[#c8102e]">MEDIUM SYNC</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-[#191919] tracking-tight font-sans flex items-center gap-3">
            Medium Sync Hub
          </h1>
          <p className="text-xs text-[#666666] mt-1 font-editorial-serif">
            Distribusi otomatis dan sinkronisasi ulasan buku, script naskah, dan materi artikel langsung ke Medium Publishing Platform.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowTokenModal(true)}
            className="px-3.5 py-2 border border-[#d1d0c9] bg-white hover:border-[#191919] text-xs font-semibold text-[#191919] rounded-lg transition-all flex items-center gap-1.5 shadow-xs"
          >
            <span className="material-symbols-outlined text-[16px]">key</span>
            {isConnected ? "Kelola Token" : "Hubungkan Token"}
          </button>
          <button
            onClick={handleExecuteBatchSync}
            disabled={selectedIds.length === 0 || isBatchSyncing || !isConnected}
            className="px-4 py-2 bg-[#1a8917] hover:bg-[#156d12] text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50"
          >
            {isBatchSyncing ? (
              <>
                <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
                <span>Syncing ({selectedIds.length})...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[16px]">sync</span>
                <span>Sync Terpilih ({selectedIds.length})</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Connection & Bento Stats Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Connected Account Card */}
        <div className="bg-white rounded-xl border border-[#e8e7e0] p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#777777]">
              Medium Account Connection
            </span>
            <span className={`inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
              isConnected ? "bg-[#1a8917]/10 text-[#1a8917]" : "bg-[#c8102e]/10 text-[#c8102e]"
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? "bg-[#1a8917]" : "bg-[#c8102e]"}`}></span>
              {isConnected ? "CONNECTED" : "UNCONFIGURED"}
            </span>
          </div>

          {isLoadingStatus ? (
            <div className="py-6 flex items-center justify-center gap-2 text-xs font-mono text-[#888888]">
              <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
              <span>Memeriksa koneksi Medium...</span>
            </div>
          ) : isConnected && profile ? (
            <div className="flex items-center gap-4">
              {profile.imageUrl ? (
                <img src={profile.imageUrl} alt={profile.name} className="w-12 h-12 rounded-full border border-[#e8e7e0] object-cover" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-[#191919] text-white flex items-center justify-center font-bold text-sm">
                  {profile.name.charAt(0)}
                </div>
              )}
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-[#191919] truncate">{profile.name}</h3>
                <p className="text-xs text-[#777777] font-mono truncate">@{profile.username}</p>
                <a
                  href={profile.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-[#1a8917] hover:underline inline-flex items-center gap-0.5 mt-0.5 font-medium"
                >
                  Buka Profil Medium <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                </a>
              </div>
            </div>
          ) : (
            <div className="py-3">
              <p className="text-xs text-[#666666] font-editorial-serif mb-3 leading-relaxed">
                Token Medium belum terhubung. Konfigurasikan <code className="font-mono bg-[#f0eee6] px-1 py-0.5 rounded">MEDIUM_TOKEN</code> di file <code className="font-mono bg-[#f0eee6] px-1 py-0.5 rounded">.env</code> atau masukkan token langsung.
              </p>
              <button
                onClick={() => setShowTokenModal(true)}
                className="text-xs bg-[#191919] text-white px-3 py-1.5 rounded-lg hover:bg-[#333333] transition-colors font-medium shadow-xs"
              >
                Set Token Sekarang
              </button>
            </div>
          )}

          {publications.length > 0 && (
            <div className="mt-4 pt-3 border-t border-[#f0eee6] text-xs text-[#777777]">
              <span className="font-semibold text-[#191919]">{publications.length} Publication(s)</span> tersedia untuk publikasi langsung.
            </div>
          )}
        </div>

        {/* Sync Metric Card 1 */}
        <div className="bg-white rounded-xl border border-[#e8e7e0] p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#777777]">
            <span className="text-[11px] font-mono font-bold tracking-wider uppercase">Synced to Medium</span>
            <span className="material-symbols-outlined text-[18px] text-[#1a8917]">verified</span>
          </div>
          <div className="mt-4">
            <span className="text-4xl md:text-5xl font-black text-[#191919] tracking-tight font-sans">
              {syncedCount}
            </span>
            <span className="text-xs text-[#888888] font-mono ml-2">/ {articles.length} Stories</span>
            <p className="text-xs text-[#777777] mt-1 font-editorial-serif">
              Artikel yang telah memiliki tautan aktif di Medium.
            </p>
          </div>
        </div>

        {/* Sync Metric Card 2 */}
        <div className="bg-white rounded-xl border border-[#e8e7e0] p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#777777]">
            <span className="text-[11px] font-mono font-bold tracking-wider uppercase">Ready for Sync</span>
            <span className="material-symbols-outlined text-[18px] text-[#c8102e]">cloud_upload</span>
          </div>
          <div className="mt-4">
            <span className="text-4xl md:text-5xl font-black text-[#c8102e] tracking-tight font-sans">
              {readyToSyncCount}
            </span>
            <span className="text-xs text-[#888888] font-mono ml-2">Stories</span>
            <p className="text-xs text-[#777777] mt-1 font-editorial-serif">
              Naskah lengkap yang siap disinkronkan ke draft Medium Anda.
            </p>
          </div>
        </div>
      </div>

      {/* Stories Table with Sync Controls */}
      <div className="bg-white rounded-xl border border-[#e8e7e0] overflow-hidden shadow-xs">
        <div className="p-4 border-b border-[#e8e7e0] bg-[#faf9f6] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={handleSelectAllReady}
              className="text-xs font-mono font-bold text-[#191919] hover:underline flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">select_all</span>
              {selectedIds.length === articles.filter(a => a.markdownContent).length ? "Deselect All" : "Pilih Semua Naskah"}
            </button>
            <span className="text-xs text-[#888888]">({selectedIds.length} terpilih)</span>
          </div>

          <div className="text-xs text-[#777777] font-mono">
            {articles.length} total articles recorded
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#e8e7e0] text-[#777777] font-mono font-bold uppercase bg-[#faf9f6]/50">
                <th className="p-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.length > 0 && selectedIds.length === articles.filter(a => a.markdownContent).length}
                    onChange={handleSelectAllReady}
                    className="rounded text-[#191919] focus:ring-[#191919]"
                  />
                </th>
                <th className="px-4 py-3">Story Title</th>
                <th className="px-4 py-3">Local Status</th>
                <th className="px-4 py-3">Medium Status</th>
                <th className="px-4 py-3">Created Date</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0eee6]">
              {articles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-xs text-[#888888] italic">
                    Belum ada artikel ulasan di database. Buat ulasan baru terlebih dahulu di menu Articles.
                  </td>
                </tr>
              ) : articles.map((art) => {
                const isSynced = Boolean(art.mediumUrl)
                const hasContent = Boolean(art.markdownContent)

                return (
                  <tr key={art.id} className="hover:bg-[#faf9f6] transition-colors">
                    <td className="p-4 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(art.id)}
                        disabled={!hasContent}
                        onChange={() => handleToggleSelect(art.id)}
                        className="rounded text-[#191919] focus:ring-[#191919] disabled:opacity-30 cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-4 max-w-[320px]">
                      <Link href={`/dashboard/article/${art.id}`} className="font-bold text-[#191919] hover:text-[#1a8917] transition-colors line-clamp-2">
                        {art.title || "Untitled Story"}
                      </Link>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[#777777]">
                        <span>{art.author || "No author"}</span>
                        <span>·</span>
                        <span className="font-mono uppercase text-[10px]">{art.contentType}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        art.status === "PUBLISHED" ? "bg-[#1a8917]/10 text-[#1a8917]" :
                        art.status === "READY" ? "bg-[#191919] text-white" : "bg-[#f0eee6] text-[#666666]"
                      }`}>
                        {art.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {isSynced ? (
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#1a8917]"></span>
                          <span className="text-[11px] font-bold text-[#1a8917]">Synced on Medium</span>
                        </div>
                      ) : hasContent ? (
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#e67e22]"></span>
                          <span className="text-[11px] text-[#e67e22] font-medium">Ready to Sync</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#aaaaaa]"></span>
                          <span className="text-[11px] text-[#888888]">No markdown content</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-[11px] text-[#888888] font-mono">
                      {format(new Date(art.createdAt), "MMM d, yyyy")}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        {isSynced && art.mediumUrl ? (
                          <a
                            href={art.mediumUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 text-xs text-[#1a8917] hover:bg-[#1a8917]/10 rounded border border-[#1a8917]/30 transition-colors inline-flex items-center gap-1 font-semibold"
                          >
                            <span>View</span>
                            <span className="material-symbols-outlined text-[13px]">open_in_new</span>
                          </a>
                        ) : null}

                        <button
                          onClick={() => {
                            setSyncModalArticle(art)
                            setPublishStatus("draft")
                            setTagsInput("book-review, asikreview, reading")
                          }}
                          disabled={!hasContent || !isConnected}
                          className="px-3 py-1 bg-[#191919] hover:bg-[#333333] text-white rounded text-xs font-semibold transition-colors disabled:opacity-40 inline-flex items-center gap-1 shadow-xs"
                        >
                          <span className="material-symbols-outlined text-[14px]">sync</span>
                          <span>{isSynced ? "Re-sync" : "Sync Now"}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Single Sync Options Modal */}
      {syncModalArticle && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md overflow-hidden shadow-2xl border border-[#e8e7e0]">
            <div className="p-5 border-b border-[#e8e7e0] flex justify-between items-center bg-[#faf9f6]">
              <div>
                <h3 className="text-sm font-bold text-[#191919] font-mono uppercase tracking-wider">
                  Sync Story to Medium
                </h3>
                <p className="text-[11px] text-[#777777] mt-0.5 truncate max-w-[320px]">
                  {syncModalArticle.title}
                </p>
              </div>
              <button onClick={() => !isSyncing && setSyncModalArticle(null)} className="text-[#888888] hover:text-[#191919]">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="p-5 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#191919] mb-1">
                  Status Publikasi di Medium
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPublishStatus("draft")}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all text-left ${
                      publishStatus === "draft"
                        ? "bg-[#191919] text-white border-[#191919]"
                        : "bg-[#faf9f6] text-[#555555] border-[#e8e7e0] hover:border-[#191919]"
                    }`}
                  >
                    Draft (Disarankan)
                    <span className="block text-[10px] opacity-75 font-normal">Review sebelum tayang publik</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPublishStatus("public")}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all text-left ${
                      publishStatus === "public"
                        ? "bg-[#1a8917] text-white border-[#1a8917]"
                        : "bg-[#faf9f6] text-[#555555] border-[#e8e7e0] hover:border-[#1a8917]"
                    }`}
                  >
                    Public Langsung
                    <span className="block text-[10px] opacity-75 font-normal">Langsung tayang di feed</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#191919] mb-1">
                  Medium Tags (Maksimal 5, pisahkan koma)
                </label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="book-review, nonfiction, self-improvement"
                  className="w-full bg-[#faf9f6] border border-[#e8e7e0] px-3 py-2 rounded-lg text-xs font-medium text-[#191919] focus:border-[#191919] outline-none"
                />
              </div>

              {publications.length > 0 && (
                <div>
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#191919] mb-1">
                    Target Publikasi (Opsional)
                  </label>
                  <select
                    value={selectedPublication}
                    onChange={(e) => setSelectedPublication(e.target.value)}
                    className="w-full bg-[#faf9f6] border border-[#e8e7e0] px-3 py-2 rounded-lg text-xs font-medium text-[#191919] focus:border-[#191919] outline-none cursor-pointer"
                  >
                    <option value="">Publikasikan ke Profil Pribadi (@{profile?.username})</option>
                    {publications.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {isSyncing && (
                <div className="flex items-center justify-center gap-2 py-3 text-xs text-[#666666]">
                  <span className="material-symbols-outlined animate-spin text-base text-[#191919]">progress_activity</span>
                  <span>Mengunggah artikel ke Medium API...</span>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-[#e8e7e0] bg-[#faf9f6] flex justify-end gap-2">
              <button
                onClick={() => setSyncModalArticle(null)}
                disabled={isSyncing}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-[#666666] hover:bg-[#e8e7e0] disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={handleExecuteSingleSync}
                disabled={isSyncing}
                className="bg-[#1a8917] hover:bg-[#156d12] text-white px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-xs"
              >
                {isSyncing ? "Menyinkronkan..." : "Kirim ke Medium"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Token Configuration Modal */}
      {showTokenModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md overflow-hidden shadow-2xl border border-[#e8e7e0]">
            <div className="p-5 border-b border-[#e8e7e0] flex justify-between items-center bg-[#faf9f6]">
              <h3 className="text-sm font-bold text-[#191919] font-mono uppercase tracking-wider">
                Medium Integration Token
              </h3>
              <button onClick={() => setShowTokenModal(false)} className="text-[#888888] hover:text-[#191919]">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="p-5 flex flex-col gap-3">
              <p className="text-xs text-[#666666] font-editorial-serif leading-relaxed">
                Dapatkan Integration Token Medium dari akun Anda di: <br />
                <strong className="text-[#191919]">Medium Settings → Security and apps → Integration tokens</strong>.
              </p>

              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#191919] mb-1">
                  Integration Token
                </label>
                <input
                  type="password"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder="2xxxx...xxxx"
                  className="w-full bg-[#faf9f6] border border-[#e8e7e0] px-3 py-2 rounded-lg text-xs font-mono text-[#191919] focus:border-[#191919] outline-none"
                />
              </div>
            </div>

            <div className="p-4 border-t border-[#e8e7e0] bg-[#faf9f6] flex justify-end gap-2">
              <button
                onClick={() => setShowTokenModal(false)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-[#666666] hover:bg-[#e8e7e0]"
              >
                Tutup
              </button>
              <button
                onClick={async () => {
                  if (!tokenInput.trim()) return
                  await checkMediumStatus(tokenInput.trim())
                  setShowTokenModal(false)
                }}
                disabled={!tokenInput.trim()}
                className="bg-[#191919] hover:bg-[#333333] text-white px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 shadow-xs"
              >
                Verifikasi & Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
