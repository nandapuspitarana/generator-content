"use client"

import * as React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { LiveBanner } from "@/components/live-banner"
import { GenerateWorkflowButton } from "@/components/generate-workflow-button"

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

  React.useEffect(() => {
    fetch("/api/knowledge/tags")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setAvailableTags(data)
      })
      .catch(console.error)
  }, [])
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [isRegeneratingBanner, setIsRegeneratingBanner] = useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Ukuran gambar terlalu besar! Maksimal 2MB.");
      return;
    }

    setIsUploadingImage(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Str = event.target?.result as string;
      setImageUrl(base64Str);
      setIsUploadingImage(false);
    };
    reader.onerror = () => {
      alert("Gagal membaca file gambar.");
      setIsUploadingImage(false);
    };
    reader.readAsDataURL(file);
  };

  // Simple auto-expand for textarea
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

      if (!res.ok) throw new Error("Gagal menyimpan artikel")
      
      const savedArticle = await res.json()
      if (!isEditMode) {
        router.push(`/dashboard/article/${savedArticle.id}`)
      } else {
        router.refresh()
        alert("Berhasil disimpan!")
      }
    } catch (error) {
      alert(error)
    } finally {
      setIsSaving(false)
    }
  }

  const handlePublishToMedium = async () => {
    if (!initialArticle?.id) {
      alert("Simpan artikel terlebih dahulu!");
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch("/api/medium/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleId: initialArticle.id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal publish ke Medium");
      alert("Berhasil dipublish ke Medium sebagai Draft!\n" + data.url);
      router.refresh();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative bg-surface">
      {/* Writing Environment */}
      <div className="flex-1 overflow-y-auto px-6 md:px-12 py-12 flex justify-center relative">
        <div className="w-full max-w-[720px] flex flex-col gap-8">
          
          {/* Status Indicator */}
          <div className="flex items-center gap-3 text-secondary text-sm font-medium">
            <span className="material-symbols-outlined text-[16px]">
              {initialArticle?.contentType === 'PODCAST' ? 'mic' : 'edit_document'}
            </span>
            <span>{initialArticle?.status || "DRAFT"}</span>
            <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
            <span className="uppercase tracking-wider text-xs bg-surface-container-high px-2 py-0.5 rounded">
              {initialArticle?.contentType || "ARTICLE"}
            </span>
          </div>

          {/* Title Input */}
          <div className="relative group">
            <textarea
              className="w-full bg-transparent border-none p-0 focus:ring-0 text-3xl md:text-4xl font-semibold text-on-surface placeholder-outline-variant outline-none transition-colors resize-none overflow-hidden"
              placeholder="Title..."
              value={title}
              onChange={(e) => handleTextareaChange(e, setTitle)}
              rows={1}
            />
          </div>

          {/* Meta Information Block */}
          <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8 pb-8 border-b border-surface-variant">
            <div className="flex-1 group relative">
              <label className="block text-xs font-semibold text-secondary mb-1">Author</label>
              <input
                className="w-full bg-transparent border-b border-transparent hover:border-outline-variant focus:border-primary px-0 py-1 text-sm text-on-surface focus:ring-0 transition-colors placeholder-outline-variant outline-none"
                type="text"
                value={author}
                onChange={e => setAuthor(e.target.value)}
                placeholder="Author Name"
              />
            </div>
            <div className="flex-1 group relative">
              <label className="block text-xs font-semibold text-secondary mb-1">Knowledge Base Ref.</label>
              <select
                className="w-full bg-transparent border-b border-transparent hover:border-outline-variant focus:border-primary px-0 py-1 text-sm text-on-surface focus:ring-0 transition-colors outline-none cursor-pointer"
                value={knowledgeTagSlug}
                onChange={e => setKnowledgeTagSlug(e.target.value)}
              >
                <option value="">-- Tidak ada --</option>
                {availableTags.map(t => (
                  <option key={t.slug} value={t.slug}>{t.title}</option>
                ))}
              </select>
            </div>
            <div className="flex-1 group relative hidden md:block">
              <label className="block text-xs font-semibold text-secondary mb-1">Publication Date</label>
              <input
                className="w-full bg-transparent border-b border-transparent hover:border-outline-variant focus:border-primary px-0 py-1 text-sm text-on-surface focus:ring-0 transition-colors outline-none"
                type="datetime-local"
                value={scheduledAt}
                onChange={e => setScheduledAt(e.target.value)}
              />
            </div>
          </div>

          {/* Main Body Editor */}
          <div className="relative min-h-[400px]">
            <textarea
              className="w-full h-full min-h-[400px] bg-transparent border-none p-0 focus:ring-0 text-base text-on-surface leading-relaxed placeholder-outline-variant outline-none resize-none"
              placeholder="Start writing here..."
              value={markdownContent}
              onChange={(e) => handleTextareaChange(e, setMarkdownContent)}
            />
          </div>

          {/* Additional Notes Area */}
          <div className="mt-12 p-6 bg-surface-container-lowest rounded-xl border border-surface-variant">
            <label className="flex items-center gap-2 text-sm font-semibold text-on-surface mb-3">
              <span className="material-symbols-outlined text-[18px]">speaker_notes</span>
              Editorial Notes / AI Prompts
            </label>
            <textarea
              className="w-full bg-surface border border-outline-variant rounded-lg p-4 text-sm text-on-surface-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all min-h-[100px] resize-y"
              placeholder="Add internal notes or instructions for AI Generator..."
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
                    if (!title) return alert("Mohon isi judul terlebih dahulu!");
                    setIsSaving(true);
                    try {
                      // 1. Simpan draf dulu
                      const payload = { title, author, notes, imageUrl, knowledgeTagSlug: knowledgeTagSlug || null, contentType: 'ARTICLE', status: 'IDEATION' };
                      const res = await fetch(`/api/articles`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(payload)
                      });
                      if (!res.ok) throw new Error("Gagal menyimpan draf");
                      const savedArticle = await res.json();
                      
                      // 2. Jalankan AI Generator
                      const aiRes = await fetch(`/api/articles/${savedArticle.id}/generate`, { method: "POST" });
                      if (!aiRes.ok) throw new Error("Gagal menjalankan AI");
                      
                      // 3. Redirect ke halaman detail
                      router.push(`/dashboard/article/${savedArticle.id}`);
                    } catch (error) {
                      alert(error);
                      setIsSaving(false);
                    }
                  }}
                  disabled={isSaving || !title}
                  className="bg-primary text-on-primary px-4 py-2 rounded text-sm font-semibold hover:bg-primary-container disabled:opacity-50 flex items-center gap-2"
                >
                  {isSaving ? (
                    <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                  ) : (
                    <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                  )}
                  {isSaving ? "AI sedang bekerja (Bisa butuh 30-60 detik)..." : "Generate Content with AI"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Media & Assets Sidebar (Right) */}
      <aside className="w-full md:w-80 lg:w-[400px] bg-surface-container-lowest border-l border-outline-variant flex flex-col h-full overflow-y-auto">
        <div className="p-6 flex flex-col gap-8">
          
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider">Asset Management</h3>
          </div>

          {/* Podcast Version Generation */}
          {initialArticle && initialArticle.contentType !== 'PODCAST' && initialArticle.markdownContent && (
            <section className="flex flex-col gap-3 p-4 bg-primary/5 rounded-xl border border-primary/20">
              <label className="text-xs font-semibold text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">mic</span>
                Podcast Version
              </label>
              <p className="text-xs text-on-surface-variant">
                Generate an audio script version of this article using AI.
              </p>
              <button 
                onClick={() => router.push(`/dashboard/podcast?articleId=${initialArticle.id}`)}
                className="mt-1 w-full bg-primary text-on-primary text-xs font-semibold py-2 rounded hover:bg-primary-container transition-colors flex justify-center items-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px]">smart_toy</span>
                Write Podcast Script
              </button>
            </section>
          )}

          {/* Banner Medium — Live Template (no AI cost) */}
          <section className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-secondary flex justify-between items-center">
              Medium Banner (16:9)
              <span className="text-[10px] bg-surface-variant px-2 py-0.5 rounded text-on-surface-variant font-bold">Live Preview</span>
            </label>
            <LiveBanner title={title} author={author} imageUrl={imageUrl || undefined} format="MEDIUM" />
          </section>

          {/* Banner Instagram — Live Template (no AI cost) */}
          <section className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-secondary flex justify-between items-center">
              Instagram Post (1:1)
              <span className="text-[10px] bg-surface-variant px-2 py-0.5 rounded text-on-surface-variant font-bold">Live Preview</span>
            </label>
            <LiveBanner title={title} author={author} imageUrl={imageUrl || undefined} format="INSTAGRAM" />
          </section>

          <hr className="border-outline-variant" />

          {/* Affiliate Links Section */}
          <section className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-secondary">Associated Links</label>
            </div>
            
            <div className="bg-surface p-3 rounded-lg border border-outline-variant flex gap-3 items-start group">
              <div className="mt-1 text-secondary">
                <span className="material-symbols-outlined text-[20px]">link</span>
              </div>
              <div className="flex-1 flex flex-col gap-1">
                <input
                  className="bg-transparent border-none p-0 h-6 text-sm font-medium text-on-surface focus:ring-0 outline-none w-full"
                  placeholder="Link Title (e.g. Tokopedia)"
                  type="text"
                  value="Affiliate Link"
                  readOnly
                />
                <input
                  className="bg-transparent border-none p-0 h-5 text-xs text-secondary focus:ring-0 outline-none w-full"
                  placeholder="https://..."
                  type="text"
                  value={affiliateLink}
                  onChange={e => setAffiliateLink(e.target.value)}
                />
              </div>
            </div>
            
            <div className="bg-surface p-3 rounded-lg border border-outline-variant flex gap-3 items-start group relative">
              <div className="mt-1 text-secondary">
                {isUploadingImage ? (
                  <span className="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>
                ) : (
                  <span className="material-symbols-outlined text-[20px]">image</span>
                )}
              </div>
              <div className="flex-1 flex flex-col gap-1">
                <div className="flex justify-between items-center w-full">
                  <input
                    className="bg-transparent border-none p-0 h-6 text-sm font-medium text-on-surface focus:ring-0 outline-none flex-1"
                    placeholder="Cover Image URL"
                    type="text"
                    value="Book Cover Image"
                    readOnly
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingImage}
                    className="text-xs text-primary hover:bg-primary/10 px-2 py-1 rounded transition-colors flex items-center gap-1 font-medium disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[14px]">upload</span>
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
                  className="bg-transparent border-none p-0 h-5 text-xs text-secondary focus:ring-0 outline-none w-full"
                  placeholder="Atau paste link URL gambar (https://...)"
                  type="text"
                  value={imageUrl}
                  onChange={e => setImageUrl(e.target.value)}
                />
              </div>
            </div>
          </section>

          {/* Evaluator Output */}
          {initialArticle?.monetizationValue !== undefined && initialArticle.monetizationValue !== null && initialArticle.monetizationValue > 0 && (
            <section className="flex flex-col gap-2 p-4 bg-tertiary/10 rounded-xl border border-tertiary/20">
              <label className="text-xs font-semibold text-tertiary flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">monetization_on</span>
                AI Evaluator Score
              </label>
              <div className="text-xl font-bold text-tertiary">{initialArticle.monetizationValue}/100</div>
            </section>
          )}

        </div>

        {/* Footer Publish Actions */}
        <div className="mt-auto p-6 bg-surface-container-low border-t border-outline-variant flex flex-col gap-3">
          {initialArticle?.mediumUrl && (
            <a href={initialArticle.mediumUrl} target="_blank" rel="noopener noreferrer" className="w-full bg-[#1c1c1c] text-white text-sm font-semibold py-3 rounded-lg hover:bg-black transition-colors flex justify-center items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">open_in_new</span>
              Buka di Medium
            </a>
          )}
          
          {isEditMode && !initialArticle?.mediumUrl && (
            <button
              onClick={handlePublishToMedium}
              disabled={isSaving}
              className="w-full bg-[#1c1c1c] text-white text-sm font-semibold py-3 rounded-lg hover:bg-black transition-colors flex justify-center items-center gap-2 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">post_add</span>
              Publish ke Medium
            </button>
          )}

          <button
            onClick={() => handleSave(true)}
            disabled={isSaving}
            className="w-full bg-primary text-on-primary text-sm font-semibold py-3 rounded-lg hover:bg-primary-container transition-colors flex justify-center items-center gap-2 disabled:opacity-50"
          >
            {isSaving ? (
              <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
            ) : (
              <span className="material-symbols-outlined text-[18px]">publish</span>
            )}
            Mark as Ready / Publish
          </button>
          <button
            onClick={() => handleSave(false)}
            disabled={isSaving}
            className="w-full bg-transparent border border-outline text-on-surface text-sm font-semibold py-3 rounded-lg hover:bg-surface-container transition-colors disabled:opacity-50"
          >
            Save as Draft
          </button>

          {isEditMode && (
            <button
              onClick={async () => {
                if (!initialArticle?.id) return;
                if (!window.confirm("Apakah Anda yakin ingin menghapus konten ini? Tindakan ini tidak dapat dibatalkan.")) return;
                setIsSaving(true);
                try {
                  const res = await fetch(`/api/articles/${initialArticle.id}`, { method: "DELETE" });
                  if (!res.ok) throw new Error("Gagal menghapus konten");
                  alert("Konten berhasil dihapus!");
                  router.push("/dashboard");
                } catch (e: any) {
                  alert(e.message);
                  setIsSaving(false);
                }
              }}
              disabled={isSaving}
              className="w-full mt-2 bg-transparent text-red-500 text-sm font-semibold py-2 rounded-lg hover:bg-red-500/10 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">delete</span>
              Delete
            </button>
          )}
        </div>
      </aside>
    </div>
  )
}
