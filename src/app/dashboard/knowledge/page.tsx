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
    category: "bisnis",
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
        alert(err.error || "Gagal membuat Knowledge Base");
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
        alert(err.error || "Gagal mengunggah PDF");
      }
    } catch (e) {
      console.error(e);
      alert("Terjadi kesalahan saat memproses file PDF");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-[1300px] mx-auto w-full">
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 border-b border-[#e8e7e0] pb-6">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-mono font-bold tracking-wider text-[#777777] uppercase mb-1">
            <span>RAG & KNOWLEDGE REPOSITORY</span>
            <span>/</span>
            <span className="text-[#c8102e]">ARCHIVE</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-[#191919] tracking-tight font-sans">
            Knowledge Base
          </h1>
          <p className="text-xs text-[#666666] mt-1 font-editorial-serif">
            Arsip materi buku dan dokumen referensi RAG untuk penulisan artikel mendalam dan skrip podcast.
          </p>
        </div>
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={() => setShowUploadModal(true)}
            className="border border-[#d1d0c9] bg-white hover:bg-[#191919] hover:text-white text-[#191919] px-3.5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 shadow-xs"
          >
            <span className="material-symbols-outlined text-[16px]">upload_file</span>
            Upload PDF
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="bg-[#191919] hover:bg-[#333333] text-white px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            New Manual Topic
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-xs font-mono text-[#888888] flex items-center justify-center gap-2">
          <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
          <span>Loading Knowledge Base...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tags.map((tag) => (
            <Link
              key={tag.id}
              href={`/dashboard/knowledge/${tag.slug}`}
              className="bg-white border border-[#e8e7e0] rounded-xl p-5 hover:border-[#191919] transition-all flex flex-col h-full shadow-xs group"
            >
              <div className="flex items-center gap-1.5 mb-3">
                <span className="bg-[#f0eee6] text-[#191919] text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase">
                  {tag.category}
                </span>
                <span className="bg-[#e8e7e1] text-[#555555] text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase">
                  {tag.type}
                </span>
              </div>
              <h2 className="font-bold text-base text-[#191919] mb-1 line-clamp-2 group-hover:text-[#1a8917] transition-colors leading-snug">
                {tag.title}
              </h2>
              <p className="text-[11px] text-[#888888] font-mono mb-4 truncate">{tag.slug}</p>
              
              <div className="mt-auto pt-3 border-t border-[#f0eee6] flex justify-between items-center text-xs">
                <span className="text-[#666666] capitalize font-medium">{tag.writingStyle.replace(/-/g, ' ')}</span>
                <span className="material-symbols-outlined text-[#aaaaaa] group-hover:text-[#191919] text-base transition-colors">
                  arrow_forward
                </span>
              </div>
            </Link>
          ))}

          {tags.length === 0 && (
            <div className="col-span-full text-center py-16 bg-white border border-dashed border-[#d1d0c9] rounded-xl">
              <span className="material-symbols-outlined text-4xl text-[#aaaaaa] mb-2">menu_book</span>
              <p className="text-sm font-bold text-[#191919]">Belum ada data Knowledge Base</p>
              <p className="text-xs text-[#777777] mt-1">Upload PDF buku atau buat topik manual untuk memulai RAG.</p>
            </div>
          )}
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md overflow-hidden shadow-2xl border border-[#e8e7e0]">
            <div className="p-5 border-b border-[#e8e7e0] flex justify-between items-center bg-[#faf9f6]">
              <h3 className="text-sm font-bold text-[#191919] font-mono uppercase tracking-wider">
                Create Knowledge Base Topic
              </h3>
              <button onClick={() => setShowModal(false)} className="text-[#888888] hover:text-[#191919]">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <div className="p-5 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#191919] mb-1">
                  Judul Buku / Topik
                </label>
                <input
                  type="text"
                  value={newTag.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="w-full bg-[#faf9f6] border border-[#e8e7e0] px-3 py-2 rounded-lg text-xs font-medium text-[#191919] focus:border-[#191919] outline-none"
                  placeholder="Misal: The Intelligent Investor"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#191919] mb-1">
                    Kategori
                  </label>
                  <select
                    value={newTag.category}
                    onChange={(e) => handleCategoryTypeChange('category', e.target.value)}
                    className="w-full bg-[#faf9f6] border border-[#e8e7e0] px-3 py-2 rounded-lg text-xs font-medium text-[#191919] focus:border-[#191919] outline-none"
                  >
                    <option value="bisnis">Bisnis</option>
                    <option value="motivasi">Motivasi</option>
                    <option value="sains">Sains</option>
                    <option value="sejarah">Sejarah</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#191919] mb-1">
                    Tipe
                  </label>
                  <select
                    value={newTag.type}
                    onChange={(e) => handleCategoryTypeChange('type', e.target.value)}
                    className="w-full bg-[#faf9f6] border border-[#e8e7e0] px-3 py-2 rounded-lg text-xs font-medium text-[#191919] focus:border-[#191919] outline-none"
                  >
                    <option value="buku">Buku</option>
                    <option value="artikel">Artikel</option>
                    <option value="jurnal">Jurnal</option>
                    <option value="video">Video</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#191919] mb-1">
                  Gaya Bahasa Narasi
                </label>
                <select
                  value={newTag.writingStyle}
                  onChange={(e) => setNewTag({ ...newTag, writingStyle: e.target.value })}
                  className="w-full bg-[#faf9f6] border border-[#e8e7e0] px-3 py-2 rounded-lg text-xs font-medium text-[#191919] focus:border-[#191919] outline-none"
                >
                  <option value="santai-storytelling">Santai Storytelling</option>
                  <option value="semi-formal-edukatif">Semi-Formal Edukatif</option>
                  <option value="narasi-investigatif">Narasi Investigatif</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#191919] mb-1">
                  Slug Index
                </label>
                <input
                  type="text"
                  value={newTag.slug}
                  onChange={(e) => setNewTag({ ...newTag, slug: e.target.value })}
                  className="w-full bg-[#faf9f6] border border-[#e8e7e0] px-3 py-2 rounded-lg text-xs font-mono text-[#555555] focus:border-[#191919] outline-none"
                />
              </div>
            </div>
            <div className="p-4 border-t border-[#e8e7e0] bg-[#faf9f6] flex justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#666666] hover:bg-[#e8e7e0]"
              >
                Batal
              </button>
              <button
                onClick={createTag}
                disabled={!newTag.title || !newTag.slug}
                className="bg-[#191919] text-white px-4 py-1.5 rounded-lg text-xs font-semibold hover:bg-[#333333] disabled:opacity-50"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload PDF Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md overflow-hidden shadow-2xl border border-[#e8e7e0]">
            <div className="p-5 border-b border-[#e8e7e0] flex justify-between items-center bg-[#faf9f6]">
              <h3 className="text-sm font-bold text-[#191919] font-mono uppercase tracking-wider">
                Upload PDF Book
              </h3>
              <button onClick={() => !uploading && setShowUploadModal(false)} className="text-[#888888] hover:text-[#191919]">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <div className="p-5 flex flex-col gap-4">
              <div className="border-2 border-dashed border-[#d1d0c9] rounded-xl p-6 text-center flex flex-col items-center justify-center bg-[#faf9f6]">
                <span className="material-symbols-outlined text-4xl text-[#777777] mb-2">picture_as_pdf</span>
                <input 
                  type="file" 
                  accept=".pdf" 
                  onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                  className="hidden" 
                  id="pdf-upload"
                  disabled={uploading}
                />
                <label htmlFor="pdf-upload" className="cursor-pointer bg-[#191919] text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-[#333333] mb-2 shadow-xs">
                  Pilih File PDF
                </label>
                <p className="text-xs text-[#666666] font-medium">{selectedFile ? selectedFile.name : 'Belum ada file dipilih'}</p>
              </div>
              
              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#191919] mb-1">
                  Gaya Bahasa Narasi
                </label>
                <select
                  value={uploadStyle}
                  onChange={(e) => setUploadStyle(e.target.value)}
                  disabled={uploading}
                  className="w-full bg-[#faf9f6] border border-[#e8e7e0] px-3 py-2 rounded-lg text-xs font-medium text-[#191919] focus:border-[#191919] outline-none"
                >
                  <option value="santai-storytelling">Santai Storytelling</option>
                  <option value="semi-formal-edukatif">Semi-Formal Edukatif</option>
                  <option value="narasi-investigatif">Narasi Investigatif</option>
                </select>
              </div>
              
              {uploading && (
                <div className="flex flex-col items-center gap-2 py-3">
                  <span className="material-symbols-outlined animate-spin text-2xl text-[#191919]">progress_activity</span>
                  <p className="text-xs text-[#666666] text-center">Sedang memproses PDF dan memotong teks (intelligent chunking)...</p>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-[#e8e7e0] bg-[#faf9f6] flex justify-end gap-2">
              <button
                onClick={() => setShowUploadModal(false)}
                disabled={uploading}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#666666] hover:bg-[#e8e7e0] disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={uploadPdf}
                disabled={!selectedFile || uploading}
                className="bg-[#191919] text-white px-4 py-1.5 rounded-lg text-xs font-semibold hover:bg-[#333333] disabled:opacity-50 flex items-center gap-1.5"
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
