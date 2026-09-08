"use client"

import * as React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { LiveBanner } from "@/components/live-banner"
import { GenerateWorkflowButton } from "@/components/generate-workflow-button"
import Link from "next/link"

interface ArticleAsset {
  id: string
  platform: string
  content: string
}

interface Article {
  id: string
  title: string
  author: string | null
  notes: string | null
  status: string
  markdownContent: string | null
  affiliateLink: string | null
  contentType: string
  imageUrl: string | null
  mediumUrl?: string | null
  scheduledAt: Date | null
  assets: ArticleAsset[]
  monetizationValue?: number | null
  knowledgeTagSlug?: string | null
}

export function ArticleEditor({ initialArticle }: { initialArticle?: Article }) {
  const router = useRouter()
  const isEditMode = !!initialArticle

  const [title, setTitle] = useState(initialArticle?.title || "")
  const [author, setAuthor] = useState(initialArticle?.author || "")
  const [markdownContent, setMarkdownContent] = useState(initialArticle?.markdownContent || "")
  const [notes, setNotes] = useState(initialArticle?.notes || "")
  const [affiliateLink, setAffiliateLink] = useState(initialArticle?.affiliateLink || "")
  const [imageUrl, setImageUrl] = useState(initialArticle?.imageUrl || "")
  const [scheduledAt, setScheduledAt] = useState<string>(
    initialArticle?.scheduledAt 
      ? new Date(initialArticle.scheduledAt).toISOString().slice(0, 16) 
      : ""
  )
  const [knowledgeTagSlug, setKnowledgeTagSlug] = useState(initialArticle?.knowledgeTagSlug || "")
  const [availableTags, setAvailableTags] = useState<any[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [notification, setNotification] = useState<{ type: "success" | "error", message: string } | null>(null)
  const [showMediumModal, setShowMediumModal] = useState(false)
  const [mediumPublishStatus, setMediumPublishStatus] = useState<"draft" | "public">("draft")
  const [mediumTags, setMediumTags] = useState("book-review, asikreview, reading")
  const [isSyncingMedium, setIsSyncingMedium] = useState(false)
  const [currentMediumUrl, setCurrentMediumUrl] = useState<string | null>(initialArticle?.mediumUrl || null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    fetch("/api/knowledge/tags")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setAvailableTags(data)
      })
      .catch(console.error)
  }, [])

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 4000)
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showNotification("error", "Ukuran gambar terlalu besar! Maksimal 2MB.")
      return;
    }

    setIsUploadingImage(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Str = event.target?.result as string;
      setImageUrl(base64Str);
      setIsUploadingImage(false);
      showNotification("success", "Cover gambar berhasil dimuat!")
    };
    reader.onerror = () => {
      showNotification("error", "Gagal membaca file gambar.")
      setIsUploadingImage(false);
    };
    reader.readAsDataURL(file);
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>, setter: (val: string) => void) => {
    setter(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = e.target.scrollHeight + 'px'
  }

  const handleSave = async (publish: boolean = false) => {
    setIsSaving(true)
    const payload = {
      title,
      author,
      markdownContent,
      notes,
      affiliateLink,
      imageUrl,
      knowledgeTagSlug: knowledgeTagSlug || null,
      scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null,
      status: publish ? 'READY' : (initialArticle?.status || 'IDEATION')
    }

    try {
      let res;
      if (isEditMode) {
        res = await fetch(`/api/articles/${initialArticle.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        })
      } else {
        res = await fetch(`/api/articles`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        })
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Gagal menyimpan artikel")
      }
      
      const savedArticle = await res.json()
      if (!isEditMode) {
        router.push(`/dashboard/article/${savedArticle.id}`)
      } else {
        showNotification("success", publish ? "Artikel ditandai Siap Publikasi (READY)!" : "Draft berhasil disimpan.")
        router.refresh()
      }
    } catch (error: any) {
      showNotification("error", error.message || "Terjadi kesalahan saat menyimpan.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleExecuteMediumSync = async () => {
    if (!initialArticle?.id) {
      showNotification("error", "Simpan artikel terlebih dahulu!");
      return;
    }
    setIsSyncingMedium(true);
    try {
      const cleanTags = mediumTags.split(",").map(t => t.trim()).filter(Boolean);
      const res = await fetch("/api/medium/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          articleId: initialArticle.id,
          publishStatus: mediumPublishStatus,
          tags: cleanTags
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal sinkronisasi ke Medium");
      setCurrentMediumUrl(data.url);
      showNotification("success", `Berhasil disinkronkan ke Medium sebagai ${mediumPublishStatus.toUpperCase()}!`);
      setShowMediumModal(false);
      router.refresh();
    } catch (e: any) {
      showNotification("error", e.message || "Gagal publish ke Medium.");
    } finally {
      setIsSyncingMedium(false);
    }
  }

  return (
    <div className="flex-1 flex flex-col xl:flex-row overflow-hidden relative bg-[#faf9f6]">
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-lg shadow-lg border text-xs font-semibold flex items-center gap-2 transition-all ${
          notification.type === "success" 
            ? "bg-[#191919] text-white border-[#191919]" 
            : "bg-[#ba1a1a] text-white border-[#ba1a1a]"
        }`}>
          <span className="material-symbols-outlined text-[16px]">
            {notification.type === "success" ? "check_circle" : "error"}
          </span>
          <span>{notification.message}</span>
        </div>
      )}

      {/* Main Editorial Canvas (Medium-like Reading & Writing Area) */}
      <div className="flex-1 overflow-y-auto px-6 md:px-16 py-10 flex justify-center custom-scrollbar">
        <div className="w-full max-w-[740px] flex flex-col gap-6">
          
          {/* Top Breadcrumb & Status */}
          <div className="flex items-center justify-between border-b border-[#e8e7e0] pb-4">
            <div className="flex items-center gap-2.5 text-xs text-[#777777] font-mono">
              <Link href="/dashboard/articles" className="hover:text-[#191919] flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px]">arrow_back</span>
                Stories
              </Link>
              <span>/</span>
              <span className="uppercase font-bold text-[#191919]">
                {initialArticle?.contentType || "ARTICLE"}
              </span>
              <span>/</span>
              <span className={`px-2 py-0.5 rounded font-bold ${
                initialArticle?.status === 'PUBLISHED' ? 'bg-[#1a8917]/10 text-[#1a8917]' :
                initialArticle?.status === 'READY' ? 'bg-[#191919] text-white' : 'bg-[#edece7] text-[#666666]'
              }`}>
                {initialArticle?.status || "DRAFT"}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleSave(false)}
                disabled={isSaving}
                className="text-xs font-semibold px-3 py-1.5 rounded border border-[#d1d0c9] hover:bg-[#191919] hover:text-white transition-colors disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save Draft"}
              </button>
            </div>
          </div>

          {/* Title Area */}
          <div className="pt-2">
            <textarea
              className="w-full bg-transparent border-none p-0 focus:ring-0 text-3xl md:text-5xl font-bold text-[#191919] placeholder-[#bbbbbb] outline-none resize-none tracking-tight leading-[1.15] font-sans"
              placeholder="Title..."
              value={title}
              onChange={(e) => handleTextareaChange(e, setTitle)}
              rows={1}
            />
          </div>

          {/* Byline / Metadata Strip */}
          <div className="flex flex-wrap items-center gap-4 py-3 border-y border-[#e8e7e0] text-xs text-[#666666]">
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <span className="font-semibold text-[#888888] uppercase tracking-wider text-[10px]">Author:</span>
              <input
                className="bg-transparent border-b border-transparent hover:border-[#cccccc] focus:border-[#191919] px-1 py-0.5 text-xs text-[#191919] font-medium outline-none flex-1"
                type="text"
                value={author}
                onChange={e => setAuthor(e.target.value)}
                placeholder="Author Name"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#888888] uppercase tracking-wider text-[10px]">Knowledge Base:</span>
              <select
                className="bg-transparent border-b border-transparent hover:border-[#cccccc] focus:border-[#191919] px-1 py-0.5 text-xs text-[#191919] font-medium outline-none cursor-pointer"
                value={knowledgeTagSlug}
                onChange={e => setKnowledgeTagSlug(e.target.value)}
              >
                <option value="">None</option>
                {availableTags.map(t => (
                  <option key={t.slug} value={t.slug}>{t.title}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#888888] uppercase tracking-wider text-[10px]">Schedule:</span>
              <input
                className="bg-transparent border-b border-transparent hover:border-[#cccccc] focus:border-[#191919] px-1 py-0.5 text-xs text-[#191919] font-mono outline-none"
                type="datetime-local"
                value={scheduledAt}
                onChange={e => setScheduledAt(e.target.value)}
              />
            </div>
          </div>

          {/* Body Markdown Content (Distraction-Free) */}
          <div className="py-4">
            <textarea
              className="w-full min-h-[500px] bg-transparent border-none p-0 focus:ring-0 font-editorial-serif text-lg md:text-xl text-[#242424] leading-[1.8] placeholder-[#bbbbbb] outline-none resize-none"
              placeholder="Tell your story or enter prompt in notes below to generate..."
              value={markdownContent}
              onChange={(e) => handleTextareaChange(e, setMarkdownContent)}
            />
          </div>

          {/* AI Workflow Trigger & Notes Box */}
          <div className="mt-8 p-6 bg-white rounded-xl border border-[#e8e7e0] shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-mono font-bold text-[#191919] uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-[#c8102e]">psychology</span>
                Editorial Instructions & AI Prompts
              </label>
              <span className="text-[11px] text-[#888888]">5-Agent Pipeline</span>
            </div>
            
            <textarea
              className="w-full bg-[#faf9f6] border border-[#e8e7e0] rounded-lg p-3 text-xs text-[#191919] focus:border-[#191919] outline-none transition-all min-h-[80px] resize-y font-sans"
              placeholder="Masukkan poin khusus, fokus bab, atau pesan utama untuk diproses AI Writer..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />

            {initialArticle ? (
              <div className="mt-4 flex justify-end">
                <GenerateWorkflowButton articleId={initialArticle.id} status={initialArticle.status} />
              </div>
            ) : (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={async () => {
                    if (!title) return showNotification("error", "Mohon isi judul terlebih dahulu!");
                    setIsSaving(true);
                    try {
                      const payload = { title, author, notes, imageUrl, knowledgeTagSlug: knowledgeTagSlug || null, contentType: 'ARTICLE', status: 'IDEATION' };
                      const res = await fetch(`/api/articles`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(payload)
                      });
                      if (!res.ok) throw new Error("Gagal menyimpan draf");
                      const savedArticle = await res.json();
                      
                      const aiRes = await fetch(`/api/articles/${savedArticle.id}/generate`, { method: "POST" });
                      if (!aiRes.ok) throw new Error("Gagal menjalankan AI");
                      
                      router.push(`/dashboard/article/${savedArticle.id}`);
                    } catch (error: any) {
                      showNotification("error", error.message || "Gagal menjalankan workflow AI");
                      setIsSaving(false);
                    }
                  }}
                  disabled={isSaving || !title}
                  className="bg-[#191919] hover:bg-[#333333] text-white px-4 py-2 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-xs"
                >
                  <span className="material-symbols-outlined text-[15px]">auto_awesome</span>
                  {isSaving ? "AI Processing (~30-60s)..." : "Generate Story with AI"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Studio Sidebar (Media & Publishing) */}
      <aside className="w-full xl:w-[380px] bg-white border-t xl:border-t-0 xl:border-l border-[#e8e7e0] flex flex-col h-auto xl:h-full overflow-y-auto custom-scrollbar">
        <div className="p-6 flex flex-col gap-6">
          <div className="flex items-center justify-between border-b border-[#e8e7e0] pb-3">
            <h3 className="text-xs font-mono font-bold text-[#191919] uppercase tracking-wider">
              Publishing & Assets
            </h3>
            {initialArticle?.monetizationValue ? (
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#f0eee6] text-[#191919]">
                Score: {initialArticle.monetizationValue}/100
              </span>
            ) : null}
          </div>

          {/* Podcast Script Version Card */}
          {initialArticle && initialArticle.contentType !== 'PODCAST' && initialArticle.markdownContent && (
            <div className="p-4 bg-[#faf9f6] rounded-xl border border-[#e8e7e0] flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#191919] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-[#c8102e]">mic</span>
                  Podcast Audio Script
                </span>
                <span className="text-[9px] font-mono uppercase bg-[#e8e7e0] px-1.5 py-0.5 rounded font-bold text-[#555555]">
                  ElevenLabs Ready
                </span>
              </div>
              <p className="text-xs text-[#666666] leading-relaxed">
                Ubah naskah ulasan buku ini menjadi format audio podcast storytelling dengan jeda SSML.
              </p>
              <button 
                onClick={() => router.push(`/dashboard/podcast?articleId=${initialArticle.id}`)}
                className="mt-1 w-full bg-[#191919] text-white text-xs font-semibold py-2 rounded-lg hover:bg-[#333333] transition-colors flex justify-center items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[14px]">smart_toy</span>
                Generate Podcast Script
              </button>
            </div>
          )}

          {/* Live Banner Medium (16:9) */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs font-bold text-[#191919]">
              <span>Medium Banner (16:9)</span>
              <span className="text-[10px] font-mono font-medium text-[#777777]">Live Preview</span>
            </div>
            <div className="border border-[#e8e7e0] rounded-lg overflow-hidden bg-[#f0eee6]">
              <LiveBanner title={title} author={author} imageUrl={imageUrl || undefined} format="MEDIUM" />
            </div>
          </div>

          {/* Live Banner Instagram (1:1) */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs font-bold text-[#191919]">
              <span>Instagram Post (1:1)</span>
              <span className="text-[10px] font-mono font-medium text-[#777777]">Live Preview</span>
            </div>
            <div className="border border-[#e8e7e0] rounded-lg overflow-hidden bg-[#f0eee6]">
              <LiveBanner title={title} author={author} imageUrl={imageUrl || undefined} format="INSTAGRAM" />
            </div>
          </div>

          {/* Cover & Affiliate Links */}
          <div className="flex flex-col gap-3 pt-2 border-t border-[#e8e7e0]">
            <label className="text-xs font-mono font-bold text-[#191919] uppercase tracking-wider">
              Cover & Affiliate Link
            </label>

            {/* Book Cover Image Input */}
            <div className="p-3 bg-[#faf9f6] rounded-lg border border-[#e8e7e0] flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#191919] flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px]">image</span>
                  Book Cover Image
                </span>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingImage}
                  className="text-xs font-semibold text-[#1a8917] hover:underline flex items-center gap-0.5 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[13px]">upload</span>
                  Upload
                </button>
                <input 
                  type="file" 
                  accept="image/*" 
                  ref={fileInputRef} 
                  className="hidden" 
                  onChange={handleImageUpload}
                />
              </div>
              <input
                className="bg-white border border-[#e8e7e0] rounded px-2.5 py-1.5 text-xs text-[#191919] placeholder-[#999999] outline-none focus:border-[#191919]"
                placeholder="Atau paste URL gambar..."
                type="text"
                value={imageUrl}
                onChange={e => setImageUrl(e.target.value)}
              />
            </div>

            {/* Affiliate Link Input */}
            <div className="p-3 bg-[#faf9f6] rounded-lg border border-[#e8e7e0] flex flex-col gap-2">
              <span className="text-xs font-semibold text-[#191919] flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px]">link</span>
                Affiliate Purchase Link
              </span>
              <input
                className="bg-white border border-[#e8e7e0] rounded px-2.5 py-1.5 text-xs text-[#191919] placeholder-[#999999] outline-none focus:border-[#191919]"
                placeholder="https://gramedia.com/... atau tokopedia.com/..."
                type="text"
                value={affiliateLink}
                onChange={e => setAffiliateLink(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Publish Action Footer */}
        <div className="mt-auto p-6 bg-[#faf9f6] border-t border-[#e8e7e0] flex flex-col gap-2.5">
          {currentMediumUrl ? (
            <div className="flex flex-col gap-1.5">
              <a 
                href={currentMediumUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-full bg-[#191919] text-white text-xs font-semibold py-2.5 rounded-lg hover:bg-[#333333] transition-colors flex justify-center items-center gap-2 shadow-xs"
              >
                <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                View Live on Medium
              </a>
              <button
                onClick={() => setShowMediumModal(true)}
                disabled={isSaving || isSyncingMedium}
                className="w-full bg-[#faf9f6] border border-[#d1d0c9] hover:border-[#191919] text-[#191919] text-xs font-semibold py-2 rounded-lg transition-colors flex justify-center items-center gap-1.5 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[15px]">sync</span>
                Re-sync to Medium
              </button>
            </div>
          ) : isEditMode && (
            <button
              onClick={() => setShowMediumModal(true)}
              disabled={isSaving || isSyncingMedium}
              className="w-full bg-[#191919] text-white text-xs font-semibold py-2.5 rounded-lg hover:bg-[#333333] transition-colors flex justify-center items-center gap-2 disabled:opacity-50 shadow-xs"
            >
              <span className="material-symbols-outlined text-[16px]">sync_alt</span>
              Sync Story to Medium
            </button>
          )}

          <button
            onClick={() => handleSave(true)}
            disabled={isSaving}
            className="w-full bg-[#1a8917] hover:bg-[#156d12] text-white text-xs font-semibold py-2.5 rounded-lg transition-colors flex justify-center items-center gap-1.5 shadow-xs disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[16px]">check_circle</span>
            Mark as Ready / Scheduled
          </button>

          {isEditMode && (
            <button
              onClick={async () => {
                if (!initialArticle?.id) return;
                if (!window.confirm("Hapus artikel ini secara permanen?")) return;
                setIsSaving(true);
                try {
                  const res = await fetch(`/api/articles/${initialArticle.id}`, { method: "DELETE" });
                  if (!res.ok) throw new Error("Gagal menghapus konten");
                  router.push("/dashboard/articles");
                } catch (e: any) {
                  showNotification("error", e.message);
                  setIsSaving(false);
                }
              }}
              disabled={isSaving}
              className="w-full text-xs text-[#ba1a1a] hover:bg-[#ffdad6]/40 py-2 rounded-lg transition-colors flex items-center justify-center gap-1 mt-1 font-medium disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[14px]">delete</span>
              Delete Story
            </button>
          )}
        </div>
      </aside>

      {/* Medium Sync Options Modal */}
      {showMediumModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md overflow-hidden shadow-2xl border border-[#e8e7e0]">
            <div className="p-5 border-b border-[#e8e7e0] flex justify-between items-center bg-[#faf9f6]">
              <div>
                <h3 className="text-sm font-bold text-[#191919] font-mono uppercase tracking-wider">
                  Sync Story to Medium
                </h3>
                <p className="text-[11px] text-[#777777] mt-0.5 truncate max-w-[320px]">
                  {title || "Untitled Story"}
                </p>
              </div>
              <button onClick={() => !isSyncingMedium && setShowMediumModal(false)} className="text-[#888888] hover:text-[#191919]">
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
                    onClick={() => setMediumPublishStatus("draft")}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all text-left ${
                      mediumPublishStatus === "draft"
                        ? "bg-[#191919] text-white border-[#191919]"
                        : "bg-[#faf9f6] text-[#555555] border-[#e8e7e0] hover:border-[#191919]"
                    }`}
                  >
                    Draft (Disarankan)
                    <span className="block text-[10px] opacity-75 font-normal">Review sebelum tayang</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMediumPublishStatus("public")}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all text-left ${
                      mediumPublishStatus === "public"
                        ? "bg-[#1a8917] text-white border-[#1a8917]"
                        : "bg-[#faf9f6] text-[#555555] border-[#e8e7e0] hover:border-[#1a8917]"
                    }`}
                  >
                    Public Langsung
                    <span className="block text-[10px] opacity-75 font-normal">Langsung tayang publik</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#191919] mb-1">
                  Medium Tags (Maksimal 5, pisahkan koma)
                </label>
                <input
                  type="text"
                  value={mediumTags}
                  onChange={(e) => setMediumTags(e.target.value)}
                  placeholder="book-review, nonfiction, self-improvement"
                  className="w-full bg-[#faf9f6] border border-[#e8e7e0] px-3 py-2 rounded-lg text-xs font-medium text-[#191919] focus:border-[#191919] outline-none"
                />
              </div>

              {isSyncingMedium && (
                <div className="flex items-center justify-center gap-2 py-3 text-xs text-[#666666]">
                  <span className="material-symbols-outlined animate-spin text-base text-[#191919]">progress_activity</span>
                  <span>Mengunggah artikel ke Medium API...</span>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-[#e8e7e0] bg-[#faf9f6] flex justify-end gap-2">
              <button
                onClick={() => setShowMediumModal(false)}
                disabled={isSyncingMedium}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-[#666666] hover:bg-[#e8e7e0] disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={handleExecuteMediumSync}
                disabled={isSyncingMedium}
                className="bg-[#1a8917] hover:bg-[#156d12] text-white px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-xs"
              >
                {isSyncingMedium ? "Menyinkronkan..." : "Kirim ke Medium"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
