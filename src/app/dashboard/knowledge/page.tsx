"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { KnowledgeTag } from "@/lib/types/models";

export default function KnowledgeBasePage() {
  const [tags, setTags] = useState<KnowledgeTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newTag, setNewTag] = useState({
    title: "",
    category: "motivasi",
    type: "buku",
    writingStyle: "santai-storytelling",
    slug: ""
  });
  
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStyle, setUploadStyle] = useState('santai-storytelling');
  const [uploading, setUploading] = useState(false);

  const fetchTags = async () => {
    try {
      const res = await fetch("/api/knowledge/tags");
      if (res.ok) {
        const data = await res.json();
        setTags(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTags();
  }, []);

  const handleTitleChange = (title: string) => {
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    setNewTag(prev => ({ ...prev, title, slug: `${prev.category}-${prev.type}-${slug}` }));
  };

  const handleCategoryTypeChange = (key: 'category' | 'type', value: string) => {
    setNewTag(prev => {
      const state = { ...prev, [key]: value };
      const slugTitle = state.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      return { ...state, slug: `${state.category}-${state.type}-${slugTitle}` };
    });
  };

  const createTag = async () => {
    try {
      const res = await fetch("/api/knowledge/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTag)
      });
      if (res.ok) {
        setShowModal(false);
        fetchTags();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to create");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const uploadPdf = async () => {
    if (!selectedFile) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('style', uploadStyle);
      
      const res = await fetch("/api/knowledge/upload-pdf", {
        method: "POST",
        body: formData
      });
      if (res.ok) {
        setShowUploadModal(false);
        setSelectedFile(null);
        fetchTags();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to upload");
      }
    } catch (e) {
      console.error(e);
      alert("Error uploading PDF");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Knowledge Base</h1>
          <p className="text-secondary mt-1 text-sm">Kelola arsip konten dan generate script podcast.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowUploadModal(true)}
            className="border border-outline bg-surface text-on-surface px-4 py-2 rounded-lg text-sm font-medium hover:bg-surface-container flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">upload_file</span> Upload PDF
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="bg-primary text-on-primary px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">add</span> Buat Manual
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10 text-secondary">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tags.map((tag) => (
            <Link
              key={tag.id}
              href={`/dashboard/knowledge/${tag.slug}`}
              className="bg-surface-container-low border border-outline-variant rounded-xl p-5 hover:border-primary/50 transition-colors flex flex-col h-full"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="bg-primary-container text-on-primary-container text-xs px-2 py-1 rounded font-medium capitalize">
                  {tag.category}
                </span>
                <span className="bg-secondary-container text-on-secondary-container text-xs px-2 py-1 rounded font-medium capitalize">
                  {tag.type}
                </span>
              </div>
              <h2 className="font-bold text-lg text-on-surface mb-1 line-clamp-2">{tag.title}</h2>
              <p className="text-xs text-secondary font-mono mb-4">{tag.slug}</p>
              
              <div className="mt-auto pt-4 border-t border-outline-variant flex justify-between items-center text-sm">
                <span className="text-secondary capitalize">{tag.writingStyle.replace(/-/g, ' ')}</span>
                <span className="material-symbols-outlined text-primary text-lg">arrow_forward</span>
              </div>
            </Link>
          ))}
          {tags.length === 0 && (
            <div className="col-span-full text-center py-12 text-secondary border border-dashed border-outline-variant rounded-xl">
              Belum ada Knowledge Base. Klik "Buat Baru" untuk mulai.
            </div>
          )}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-outline-variant">
            <div className="p-6 border-b border-outline-variant flex justify-between items-center">
              <h3 className="text-lg font-bold">Buat Knowledge Base Baru</h3>
              <button onClick={() => setShowModal(false)} className="text-secondary hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-on-surface">Judul Buku/Topik</label>
                <input
                  type="text"
                  value={newTag.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="w-full bg-surface-container border border-outline px-3 py-2 rounded-lg text-sm focus:border-primary focus:outline-none"
                  placeholder="Misal: Zero to Survive"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-on-surface">Kategori</label>
                  <select
                    value={newTag.category}
                    onChange={(e) => handleCategoryTypeChange('category', e.target.value)}
                    className="w-full bg-surface-container border border-outline px-3 py-2 rounded-lg text-sm focus:border-primary focus:outline-none capitalize"
                  >
                    <option value="motivasi">Motivasi</option>
                    <option value="bisnis">Bisnis</option>
                    <option value="sains">Sains</option>
                    <option value="sejarah">Sejarah</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-on-surface">Tipe</label>
                  <select
                    value={newTag.type}
                    onChange={(e) => handleCategoryTypeChange('type', e.target.value)}
                    className="w-full bg-surface-container border border-outline px-3 py-2 rounded-lg text-sm focus:border-primary focus:outline-none capitalize"
                  >
                    <option value="buku">Buku</option>
                    <option value="artikel">Artikel</option>
                    <option value="jurnal">Jurnal</option>
                    <option value="video">Video</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-on-surface">Gaya Bahasa</label>
                <select
                  value={newTag.writingStyle}
                  onChange={(e) => setNewTag({ ...newTag, writingStyle: e.target.value })}
                  className="w-full bg-surface-container border border-outline px-3 py-2 rounded-lg text-sm focus:border-primary focus:outline-none"
                >
                  <option value="santai-storytelling">Santai Storytelling</option>
                  <option value="semi-formal-edukatif">Semi-Formal Edukatif</option>
                  <option value="narasi-investigatif">Narasi Investigatif</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-on-surface">Slug</label>
                <input
                  type="text"
                  value={newTag.slug}
                  onChange={(e) => setNewTag({ ...newTag, slug: e.target.value })}
                  className="w-full bg-surface-container border border-outline px-3 py-2 rounded-lg text-sm focus:border-primary focus:outline-none font-mono"
                />
              </div>
            </div>
            <div className="p-6 border-t border-outline-variant bg-surface-container-low flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-secondary hover:text-on-surface hover:bg-surface-container-high transition-colors"
              >
                Batal
              </button>
              <button
                onClick={createTag}
                disabled={!newTag.title || !newTag.slug}
                className="bg-primary text-on-primary px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-outline-variant">
            <div className="p-6 border-b border-outline-variant flex justify-between items-center">
              <h3 className="text-lg font-bold">Upload Buku PDF</h3>
              <button onClick={() => !uploading && setShowUploadModal(false)} className="text-secondary hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <div className="border-2 border-dashed border-outline-variant rounded-xl p-6 text-center flex flex-col items-center justify-center bg-surface-container-lowest">
                <span className="material-symbols-outlined text-4xl text-secondary mb-2">picture_as_pdf</span>
                <input 
                  type="file" 
                  accept=".pdf" 
                  onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                  className="hidden" 
                  id="pdf-upload"
                  disabled={uploading}
                />
                <label htmlFor="pdf-upload" className="cursor-pointer bg-secondary-container text-on-secondary-container px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 mb-2">
                  Pilih File PDF
                </label>
                <p className="text-xs text-secondary">{selectedFile ? selectedFile.name : 'Belum ada file yang dipilih'}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1 text-on-surface">Gaya Bahasa untuk Cerita</label>
                <select
                  value={uploadStyle}
                  onChange={(e) => setUploadStyle(e.target.value)}
                  disabled={uploading}
                  className="w-full bg-surface-container border border-outline px-3 py-2 rounded-lg text-sm focus:border-primary focus:outline-none"
                >
                  <option value="santai-storytelling">Santai Storytelling</option>
                  <option value="semi-formal-edukatif">Semi-Formal Edukatif</option>
                  <option value="narasi-investigatif">Narasi Investigatif</option>
                </select>
              </div>
              
              {uploading && (
                <div className="flex flex-col items-center gap-2 py-4">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-sm text-secondary text-center">Sedang memproses PDF dan memotong teks (auto-chunking)...</p>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-outline-variant bg-surface-container-low flex justify-end gap-3">
              <button
                onClick={() => setShowUploadModal(false)}
                disabled={uploading}
                className="px-4 py-2 rounded-lg text-sm font-medium text-secondary hover:text-on-surface hover:bg-surface-container-high transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={uploadPdf}
                disabled={!selectedFile || uploading}
                className="bg-primary text-on-primary px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center gap-2"
              >
                {uploading ? 'Memproses...' : 'Upload & Ekstrak'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
