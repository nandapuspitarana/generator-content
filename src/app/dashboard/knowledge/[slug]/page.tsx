"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { KnowledgeTag, KnowledgeChapter } from "@/lib/types/models";
import ReactMarkdown from "react-markdown";
import { buildPrompt, PromptType, Platform } from "@/lib/utils/promptBuilder";
import ChatSidebar from "@/components/knowledge/ChatSidebar";

export default function KnowledgeBaseDetail() {
  const { slug } = useParams();
  const router = useRouter();
  const [tag, setTag] = useState<KnowledgeTag | null>(null);
  const [chapters, setChapters] = useState<KnowledgeChapter[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'asli' | 'cerita' | 'script'>('asli');
  
  const [showPromptDrawer, setShowPromptDrawer] = useState(false);
  const [showChatSidebar, setShowChatSidebar] = useState(false);
  const [activePromptType, setActivePromptType] = useState<PromptType>('banner');
  const [activePlatform, setActivePlatform] = useState<Platform>('gpt');
  const [copied, setCopied] = useState(false);
  
  const generatedPromptText = tag ? buildPrompt(activePromptType, tag, chapters, activePlatform) : '';

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(generatedPromptText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [isGeneratingPodcast, setIsGeneratingPodcast] = useState(false);
  
  const [newChapterContent, setNewChapterContent] = useState('');
  const [newChapterTitle, setNewChapterTitle] = useState('');
  
  const fetchTagDetail = async () => {
    try {
      const res = await fetch(`/api/knowledge/tags/${slug}`);
      if (res.ok) {
        const data = await res.json();
        setTag(data.tag);
        setChapters(data.chapters || []);
        if (data.chapters && data.chapters.length > 0 && !activeChapterId) {
          setActiveChapterId(data.chapters[0].id);
        }
      } else {
        router.push("/dashboard/knowledge");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTagDetail();
  }, [slug]);

  const addChapter = async () => {
    if (!newChapterTitle || !newChapterContent) return;
    try {
      const res = await fetch("/api/knowledge/chapters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tagSlug: slug,
          chapterNumber: chapters.length + 1,
          chapterTitle: newChapterTitle,
          originalContent: newChapterContent
        })
      });
      if (res.ok) {
        const doc = await res.json();
        setNewChapterTitle('');
        setNewChapterContent('');
        setChapters([...chapters, doc]);
        setActiveChapterId(doc.id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleGenerate = async (action: string, chapterId?: string) => {
    try {
      if (action === 'summarize') setIsGeneratingSummary(true);
      if (action === 'podcast-full') setIsGeneratingPodcast(true);
      
      const res = await fetch("/api/knowledge/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, tagSlug: slug, chapterId })
      });
      if (res.ok) {
        fetchTagDetail();
      }
    } catch(e) {
      console.error(e);
    } finally {
      if (action === 'summarize') setIsGeneratingSummary(false);
      if (action === 'podcast-full') setIsGeneratingPodcast(false);
    }
  };

  const activeChapter = chapters.find(c => c.id === activeChapterId);

  if (loading) return <div className="p-8">Loading...</div>;
  if (!tag) return <div className="p-8">Not found</div>;

  return (
    <div className="flex flex-col h-screen max-h-screen bg-surface overflow-hidden">
      <div className="border-b border-outline-variant p-6 bg-surface-container-low flex justify-between items-start shrink-0">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <button onClick={() => router.push("/dashboard/knowledge")} className="text-secondary hover:text-on-surface">
              <span className="material-symbols-outlined text-xl">arrow_back</span>
            </button>
            <h1 className="text-2xl font-bold">{tag.title}</h1>
            <span className="bg-primary-container text-on-primary-container text-xs px-2 py-1 rounded font-medium capitalize">
              {tag.writingStyle.replace(/-/g, ' ')}
            </span>
          </div>
          <p className="text-secondary text-sm max-w-3xl">
            {tag.summary || "Belum ada summary. Generate summary untuk merangkum seluruh bab."}
          </p>
        </div>
        <div className="flex gap-3 shrink-0">
          <button 
            onClick={() => setShowChatSidebar(!showChatSidebar)}
            className={`border border-outline px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${showChatSidebar ? 'bg-primary text-on-primary border-primary' : 'bg-surface text-on-surface hover:bg-surface-container'}`}
          >
            <span className="material-symbols-outlined text-sm">smart_toy</span>
            Tanya AI
          </button>
          <button 
            onClick={() => setShowPromptDrawer(true)}
            className="border border-outline bg-surface text-on-surface px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-surface-container"
          >
            <span className="material-symbols-outlined text-sm">palette</span>
            Generate Prompt
          </button>
          <button 
            onClick={() => handleGenerate('summarize')}
            disabled={isGeneratingSummary || chapters.length === 0}
            className="border border-outline bg-surface text-on-surface px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-surface-container disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-sm">summarize</span>
            {isGeneratingSummary ? "Generating..." : "Generate Summary"}
          </button>
          <button 
            onClick={() => handleGenerate('podcast-full')}
            disabled={isGeneratingPodcast || chapters.length === 0}
            className="bg-primary text-on-primary px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:opacity-90 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-sm">mic</span>
            {isGeneratingPodcast ? "Generating..." : "Generate Full Podcast"}
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-64 border-r border-outline-variant bg-surface-container-lowest p-4 overflow-y-auto flex flex-col gap-2">
          <h3 className="font-semibold text-sm text-secondary uppercase tracking-wider mb-2">Daftar Bab</h3>
          
          {chapters.map(c => (
            <button
              key={c.id}
              onClick={() => setActiveChapterId(c.id)}
              className={`text-left p-3 rounded-lg text-sm transition-colors ${activeChapterId === c.id ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-surface-container text-on-surface'}`}
            >
              Bab {c.chapterNumber}: {c.chapterTitle}
            </button>
          ))}
          
          <div className="mt-6 border-t border-outline-variant pt-4 flex flex-col gap-2">
            <h4 className="text-xs font-semibold text-secondary">Tambah Bab Baru</h4>
            <input 
              type="text" 
              value={newChapterTitle}
              onChange={e => setNewChapterTitle(e.target.value)}
              placeholder="Judul Bab (cth: Titik Nol)"
              className="w-full bg-surface-container border border-outline px-3 py-2 rounded text-sm focus:border-primary focus:outline-none"
            />
            <textarea
              value={newChapterContent}
              onChange={e => setNewChapterContent(e.target.value)}
              placeholder="Paste catatan buku di sini..."
              className="w-full bg-surface-container border border-outline px-3 py-2 rounded text-sm min-h-[100px] focus:border-primary focus:outline-none"
            />
            <button 
              onClick={addChapter}
              disabled={!newChapterTitle || !newChapterContent}
              className="bg-secondary-container text-on-secondary-container px-3 py-2 rounded text-sm font-medium hover:opacity-90 disabled:opacity-50"
            >
              + Tambah Bab
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-surface">
          {activeChapter ? (
            <div className="max-w-4xl mx-auto bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden flex flex-col h-full">
              <div className="flex border-b border-outline-variant bg-surface-container-low">
                <button 
                  onClick={() => setActiveTab('asli')}
                  className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'asli' ? 'border-primary text-primary' : 'border-transparent text-secondary hover:text-on-surface'}`}
                >
                  Catatan Asli
                </button>
                <button 
                  onClick={() => setActiveTab('cerita')}
                  className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'cerita' ? 'border-primary text-primary' : 'border-transparent text-secondary hover:text-on-surface'}`}
                >
                  Cerita Saya
                </button>
                <button 
                  onClick={() => setActiveTab('script')}
                  className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'script' ? 'border-primary text-primary' : 'border-transparent text-secondary hover:text-on-surface'}`}
                >
                  Script Podcast
                </button>
              </div>
              
              <div className="flex-1 p-6 overflow-y-auto">
                {activeTab === 'asli' && (
                  <div className="whitespace-pre-wrap font-mono text-sm text-on-surface">
                    {activeChapter.originalContent}
                  </div>
                )}
                
                {activeTab === 'cerita' && (
                  <div className="flex flex-col h-full">
                    {!activeChapter.storyVersion ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-secondary gap-4">
                        <span className="material-symbols-outlined text-4xl">auto_awesome</span>
                        <p>Belum ada cerita versi gaya bahasa Anda.</p>
                        <button 
                          onClick={() => handleGenerate('story', activeChapter.id)}
                          className="bg-primary text-on-primary px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90"
                        >
                          ✨ Generate Cerita
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="prose prose-sm dark:prose-invert max-w-none flex-1">
                          <ReactMarkdown>{activeChapter.storyVersion}</ReactMarkdown>
                        </div>
                        <div className="mt-4 pt-4 border-t border-outline-variant flex justify-end">
                          <button 
                            onClick={() => handleGenerate('story', activeChapter.id)}
                            className="text-primary text-sm font-medium hover:underline flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-sm">refresh</span> Regenerate
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
                
                {activeTab === 'script' && (
                  <div className="flex flex-col h-full">
                    {!activeChapter.podcastScript ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-secondary gap-4">
                        <span className="material-symbols-outlined text-4xl">mic</span>
                        <p>Belum ada script podcast untuk bab ini.</p>
                        <button 
                          onClick={() => handleGenerate('podcast-chapter', activeChapter.id)}
                          className="bg-primary text-on-primary px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90"
                        >
                          🎙️ Generate Script
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="prose prose-sm dark:prose-invert max-w-none flex-1">
                          <ReactMarkdown>{activeChapter.podcastScript}</ReactMarkdown>
                        </div>
                        <div className="mt-4 pt-4 border-t border-outline-variant flex justify-end">
                          <button 
                            onClick={() => handleGenerate('podcast-chapter', activeChapter.id)}
                            className="text-primary text-sm font-medium hover:underline flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-sm">refresh</span> Regenerate
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-secondary border border-dashed border-outline-variant rounded-xl max-w-4xl mx-auto">
              Pilih bab di sidebar atau tambah bab baru untuk melihat detail.
            </div>
          )}
        </div>
        
        {showChatSidebar && (
          <ChatSidebar tagSlug={slug as string} onClose={() => setShowChatSidebar(false)} />
        )}
      </div>

      {showPromptDrawer && tag && (
        <>
          <div className="fixed inset-0 z-40 bg-black/20" onClick={() => setShowPromptDrawer(false)}></div>
          <div className="fixed right-0 top-0 bottom-0 w-96 bg-surface border-l border-outline-variant z-50 shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out">
            <div className="p-5 border-b border-outline-variant flex justify-between items-center bg-surface-container-low">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">palette</span>
                Generate Prompt
              </h3>
              <button onClick={() => setShowPromptDrawer(false)} className="text-secondary hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="p-5 flex-1 overflow-y-auto flex flex-col gap-5">
              <div>
                <label className="block text-sm font-semibold mb-2 text-on-surface">Tipe Prompt</label>
                <div className="flex flex-col gap-2">
                  <button 
                    onClick={() => setActivePromptType('banner')}
                    className={`text-left px-3 py-2 rounded-lg text-sm transition-colors border ${activePromptType === 'banner' ? 'border-primary bg-primary/10 text-primary font-medium' : 'border-outline-variant hover:bg-surface-container text-on-surface'}`}
                  >
                    Banner Review
                  </button>
                  <button 
                    onClick={() => setActivePromptType('ig-caption')}
                    className={`text-left px-3 py-2 rounded-lg text-sm transition-colors border ${activePromptType === 'ig-caption' ? 'border-primary bg-primary/10 text-primary font-medium' : 'border-outline-variant hover:bg-surface-container text-on-surface'}`}
                  >
                    IG Caption
                  </button>
                  <button 
                    onClick={() => setActivePromptType('ig-carousel')}
                    className={`text-left px-3 py-2 rounded-lg text-sm transition-colors border ${activePromptType === 'ig-carousel' ? 'border-primary bg-primary/10 text-primary font-medium' : 'border-outline-variant hover:bg-surface-container text-on-surface'}`}
                  >
                    IG Carousel
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-on-surface">Target Platform</label>
                <div className="flex rounded-lg border border-outline-variant overflow-hidden">
                  <button 
                    onClick={() => setActivePlatform('gpt')}
                    className={`flex-1 py-2 text-sm font-medium transition-colors ${activePlatform === 'gpt' ? 'bg-primary text-on-primary' : 'bg-surface hover:bg-surface-container text-on-surface'}`}
                  >
                    ChatGPT
                  </button>
                  <button 
                    onClick={() => setActivePlatform('gemini')}
                    className={`flex-1 py-2 text-sm font-medium transition-colors border-l border-outline-variant ${activePlatform === 'gemini' ? 'bg-primary text-on-primary' : 'bg-surface hover:bg-surface-container text-on-surface'}`}
                  >
                    Gemini
                  </button>
                </div>
              </div>

              <div className="flex-1 flex flex-col">
                <label className="block text-sm font-semibold mb-2 text-on-surface">Hasil Prompt (Siap Copy)</label>
                <textarea 
                  readOnly 
                  value={generatedPromptText}
                  className="flex-1 w-full bg-surface-container border border-outline px-3 py-3 rounded-lg text-sm font-mono focus:outline-none resize-none"
                />
              </div>
            </div>

            <div className="p-5 border-t border-outline-variant bg-surface-container-low flex justify-end gap-3">
              <button 
                onClick={handleCopyPrompt}
                className="flex-1 bg-primary text-on-primary px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 flex items-center justify-center gap-2 transition-all"
              >
                <span className="material-symbols-outlined text-sm">{copied ? 'check' : 'content_copy'}</span>
                {copied ? 'Copied!' : 'Copy to Clipboard'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
