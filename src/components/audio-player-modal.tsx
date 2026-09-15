"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Volume2,
  Play,
  Pause,
  Download,
  X,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  RotateCcw,
  RefreshCw,
  Dices,
  Mic,
  Cpu,
  Clock,
  Sliders,
  Wand2,
  Eraser,
  FileAudio,
} from "lucide-react";
import { VOCAL_EXPRESSION_TAGS } from "@/lib/utils/promptBuilder";

interface AudioPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialText: string;
  title?: string;
}

interface ModelCheckpointOption {
  id: string;
  name: string;
  description: string;
  is_ready?: boolean;
  recommended?: boolean;
}

interface VoiceOption {
  seed: number;
  name: string;
  gender: "male" | "female";
  language?: "id" | "en-multi";
  group?: "gemini" | "ardi" | "gadis" | "nusantara" | "multilingual";
  style: string;
  description?: string;
  default_speed?: number;
}

const DEFAULT_MODELS: ModelCheckpointOption[] = [
  {
    id: "gemini-tts",
    name: "✨ Google Gemini Speech (Native Vocal Tags & Human Emotion)",
    description: "Multimodal audio generator langsung dari Google dengan ekspresi vokal asli ([laughs], [whispers], [sighs], [excited]).",
    is_ready: true,
    recommended: true,
  },
  {
    id: "indonesia-lora",
    name: "🇮🇩 Indonesia Fine-Tuned (X-Lord Dataset LoRA)",
    description: "Model terlatih pada 16.4 jam audio Bahasa Indonesia untuk intonasi lokal alami.",
    is_ready: true,
    recommended: false,
  },
  {
    id: "standby-neural",
    name: "⚡ High-Definition Neural Engine (Studio)",
    description: "Mesin vokal studio berkualitas tinggi untuk podcast dan narasi buku (ID & EN Multilingual).",
    is_ready: true,
    recommended: false,
  },
  {
    id: "default",
    name: "🌐 Base Model (Fish-Speech openaudio-s1-mini)",
    description: "Model dasar multibahasa dengan dukungan zero-shot voice cloning.",
    is_ready: false,
    recommended: false,
  },
];

const DEFAULT_VOICES: VoiceOption[] = [
  // ✨ Google Gemini Speech Voices (Native Human Emotion & Vocal Tags)
  {
    seed: 9001,
    name: "Kore (Wanita - Tenang & Edukatif)",
    gender: "female",
    language: "id",
    group: "gemini",
    style: "Kalem, Menawan & Edukasi",
    description: "Artikulasi jernih dan santun dari Gemini, ekspresi vokal hidup dan intonasi alami.",
    default_speed: 1.0,
  },
  {
    seed: 9002,
    name: "Aoede (Wanita - Hangat & Storytelling)",
    gender: "female",
    language: "id",
    group: "gemini",
    style: "Dramatis, Hangat & Penuh Emosi",
    description: "Penuh emosi dan ekspresi mendalam untuk cerita fiksi, podcast, dan narasi personal.",
    default_speed: 1.0,
  },
  {
    seed: 9003,
    name: "Puck (Pria - Ceria & Upbeat)",
    gender: "male",
    language: "id",
    group: "gemini",
    style: "Dinamis, Ramah & Upbeat",
    description: "Host muda energik, tawa lepas, dan sangat engaging untuk obrolan santai.",
    default_speed: 1.0,
  },
  {
    seed: 9004,
    name: "Charon (Pria - Berat & Karismatik)",
    gender: "male",
    language: "id",
    group: "gemini",
    style: "Suara Berat, Karismatik & Berwibawa",
    description: "Resonansi nada rendah yang berwibawa untuk ulasan mendalam dan dokumenter.",
    default_speed: 1.0,
  },
  {
    seed: 9005,
    name: "Fenrir (Pria - Tegas & Mantap)",
    gender: "male",
    language: "id",
    group: "gemini",
    style: "Percaya Diri, Kuat & Lugas",
    description: "Karakter pria tegas dan percaya diri untuk materi kepemimpinan dan bisnis.",
    default_speed: 1.0,
  },

  // 🎙️ Varian Andi / Ardi (Pria - Host Favorit, Sangat Nyaman & Multi-Bahasa)
  {
    seed: 2222,
    name: "Andi Natural (Pria)",
    gender: "male",
    language: "id",
    group: "ardi",
    style: "Casual, Hangat & Percakapan Nyaman",
    description: "Sangat nyaman di telinga orang Indonesia, artikulasi fasih untuk istilah lokal & internasional.",
    default_speed: 1.0,
  },
  {
    seed: 4444,
    name: "Andi Energik (Pria)",
    gender: "male",
    language: "id",
    group: "ardi",
    style: "Dinamis, Upbeat & Review Buku",
    description: "Penuh semangat untuk topik produktivitas, inovasi, dan review buku self-improvement.",
    default_speed: 1.05,
  },
  {
    seed: 2210,
    name: "Andi Podcaster Santai (Pria)",
    gender: "male",
    language: "id",
    group: "ardi",
    style: "Hangat, Intim & Diskusi Santai",
    description: "Gaya ngobrol santai seperti berbicara langsung dengan pendengar di ruang santai.",
    default_speed: 0.98,
  },
  {
    seed: 2220,
    name: "Andi Narator Formal (Pria)",
    gender: "male",
    language: "id",
    group: "ardi",
    style: "Berwibawa, Rapi & Dokumenter",
    description: "Intonasi mantap dan profesional untuk ringkasan eksekutif dan materi edukatif.",
    default_speed: 0.96,
  },
  {
    seed: 2230,
    name: "Andi Deep Bass (Pria)",
    gender: "male",
    language: "id",
    group: "ardi",
    style: "Suara Berat, Maskulin & Karismatik",
    description: "Resonansi nada rendah yang berkarakter kuat, tenang, dan memikat.",
    default_speed: 0.95,
  },

  // 🌸 Varian Gadis (Wanita - Jernih, Kalem, Storyteller)
  {
    seed: 6666,
    name: "Gadis Narasi (Wanita)",
    gender: "female",
    language: "id",
    group: "gadis",
    style: "Kalem, Jelas & Edukasi",
    description: "Artikulasi jernih dan tenang, standar emas untuk edukasi dan narasi artikel.",
    default_speed: 1.0,
  },
  {
    seed: 8888,
    name: "Gadis Storyteller (Wanita)",
    gender: "female",
    language: "id",
    group: "gadis",
    style: "Dramatis & Storytelling Mendalam",
    description: "Penjiwaan emosional mendalam untuk cerita fiksi, memoar, dan narasi puitis.",
    default_speed: 0.95,
  },
  {
    seed: 6610,
    name: "Gadis Ceria & Fresh (Wanita)",
    gender: "female",
    language: "id",
    group: "gadis",
    style: "Fresh, Ramah & Upbeat",
    description: "Ceria dan bersahabat, cocok untuk podcast gaya muda dan konten kreatif.",
    default_speed: 1.04,
  },
  {
    seed: 6620,
    name: "Gadis Lembut (Wanita)",
    gender: "female",
    language: "id",
    group: "gadis",
    style: "Menenangkan, Halus & Bedtime Story",
    description: "Suara lembut menenangkan, cocok untuk renungan, self-care, dan konten malam.",
    default_speed: 0.92,
  },

  // 🇮🇩 Suara Nusantara (Khas, Teduh & Sangat Familiar di Telinga Indonesia)
  {
    seed: 2500,
    name: "Dimas Nusantara (Pria)",
    gender: "male",
    language: "id",
    group: "nusantara",
    style: "Teduh, Bersahabat & Santun",
    description: "Karakter pria Jawa yang santun, adem, dan sangat bersahaja di telinga pendengar.",
    default_speed: 0.98,
  },
  {
    seed: 6500,
    name: "Siti Ayu (Wanita)",
    gender: "female",
    language: "id",
    group: "nusantara",
    style: "Anggun, Lembut & Tenang",
    description: "Karakter wanita Jawa yang santun, halus budi, dan sangat menenangkan.",
    default_speed: 0.96,
  },
  {
    seed: 2600,
    name: "Jajang Akrab (Pria)",
    gender: "male",
    language: "id",
    group: "nusantara",
    style: "Ramah, Renyah & Humoris",
    description: "Karakter Sunda yang ramah, hangat, dan asik didengar untuk obrolan santai.",
    default_speed: 1.02,
  },
  {
    seed: 6600,
    name: "Ibu Tuti (Wanita)",
    gender: "female",
    language: "id",
    group: "nusantara",
    style: "Hangat, Keibuan & Welas Asih",
    description: "Sentuhan keibuan yang hangat dan penuh perhatian untuk narasi keluarga & moral.",
    default_speed: 0.96,
  },
  {
    seed: 2700,
    name: "Osman Elegan (Pria)",
    gender: "male",
    language: "id",
    group: "nusantara",
    style: "Jernih, Rapi & Elegan Serumpun",
    description: "Diksi sangat rapi dan formal dengan nuansa Melayu serumpun yang akrab.",
    default_speed: 1.0,
  },
  {
    seed: 6700,
    name: "Yasmin Melati (Wanita)",
    gender: "female",
    language: "id",
    group: "nusantara",
    style: "Manis, Sopan & Jernih",
    description: "Artikulasi jernih dan manis, enak didengar untuk audio artikel berdurasi panjang.",
    default_speed: 0.98,
  },

  // 🌐 Multilingual Masters (Bilingual ID-EN, Istilah Asing & Global)
  {
    seed: 1111,
    name: "Andi Multilingual Pro (Pria)",
    gender: "male",
    language: "en-multi",
    group: "multilingual",
    style: "Bilingual Luwes (ID & EN), Sangat Nyaman",
    description: "Mampu melafalkan istilah Inggris dan buku asing secara fasih tanpa kehilangan kenyamanan telinga Indonesia.",
    default_speed: 1.0,
  },
  {
    seed: 5555,
    name: "Brian Tech Reviewer (Pria)",
    gender: "male",
    language: "en-multi",
    group: "multilingual",
    style: "Cerdas, Karismatik & Diskusi Tech",
    description: "Sangat cocok untuk buku teknologi, sains, bisnis modern, dan istilah asing intensif.",
    default_speed: 1.0,
  },
  {
    seed: 1120,
    name: "William Audiobook (Pria)",
    gender: "male",
    language: "en-multi",
    group: "multilingual",
    style: "Internasional, Elegan & Audio Drama",
    description: "Standar audiobook internasional dengan vokal bersih dan nada karismatik.",
    default_speed: 0.98,
  },
  {
    seed: 7777,
    name: "Ava Storyteller (Wanita)",
    gender: "female",
    language: "en-multi",
    group: "multilingual",
    style: "Ekspresif, Cerita Fiksi & Bilingual",
    description: "Ekspresif dan fleksibel untuk buku fiksi, literatur dunia, dan podcast dwibahasa.",
    default_speed: 0.96,
  },
  {
    seed: 3333,
    name: "Emma Narator Dunia (Wanita)",
    gender: "female",
    language: "en-multi",
    group: "multilingual",
    style: "Mewah, Berwibawa & Elegan",
    description: "Vokal premium untuk buku biografi tokoh dunia dan narasi kelas atas.",
    default_speed: 0.95,
  },
];

export function AudioPlayerModal({
  isOpen,
  onClose,
  initialText,
  title = "Fish-Speech Studio (Multilingual & Indonesia)",
}: AudioPlayerModalProps) {
  const [text, setText] = useState(initialText || "");
  const [model, setModel] = useState<string>("gemini-tts");
  const [voiceSeed, setVoiceSeed] = useState<number>(9001);
  const [speed, setSpeed] = useState<number>(1.0);
  const [paragraphDelay, setParagraphDelay] = useState<number>(1.0);
  const [temperature, setTemperature] = useState<number>(0.3);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [activeTagCategory, setActiveTagCategory] = useState<"timing" | "laughter" | "prosody" | "emotion">("timing");

  const [referenceAudioName, setReferenceAudioName] = useState<string | null>(null);
  const [referenceAudioBase64, setReferenceAudioBase64] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isFallbackMode, setIsFallbackMode] = useState<boolean>(false);
  const [jobProgress, setJobProgress] = useState<string | null>(null);

  // Audio Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Sync initial text when modal opens
  useEffect(() => {
    if (initialText) {
      setText(initialText.slice(0, 5000));
    }
  }, [initialText]);

  // Clean up object URL when component unmounts or audio changes
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  if (!isOpen) return null;

  // Insert SSML break tag at current cursor position
  const handleInsertBreak = (seconds: number) => {
    const breakTag = `<break time="${seconds}s"/>`;
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const updated = text.substring(0, start) + ` ${breakTag} ` + text.substring(end);
      setText(updated);
      setTimeout(() => {
        textarea.focus();
        const nextPos = start + breakTag.length + 2;
        textarea.setSelectionRange(nextPos, nextPos);
      }, 0);
    } else {
      setText((prev) => prev + ` ${breakTag} `);
    }
  };

  // Insert any of the 34 vocal expression tags at current cursor position
  const handleInsertTag = (tagStr: string) => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const updated = text.substring(0, start) + ` ${tagStr} ` + text.substring(end);
      setText(updated);
      setTimeout(() => {
        textarea.focus();
        const nextPos = start + tagStr.length + 2;
        textarea.setSelectionRange(nextPos, nextPos);
      }, 0);
    } else {
      setText((prev) => prev + ` ${tagStr} `);
    }
  };

  // Clean Markdown formatting for clean spoken dialogue
  const handleCleanMarkdown = () => {
    const cleaned = text
      .replace(/^#{1,6}\s+/gm, "") // headers
      .replace(/\*\*([^*]+)\*\*/g, "$1") // bold
      .replace(/\*([^*]+)\*/g, "$1") // italic
      .replace(/__([^_]+)__/g, "$1")
      .replace(/_([^_]+)_/g, "$1")
      .replace(/`([^`]+)`/g, "$1") // inline code
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // links
      .replace(/^\s*[-*+]\s+/gm, "") // unordered lists
      .replace(/^\s*\d+\.\s+/gm, "") // ordered lists
      .replace(/^\s*>\s+/gm, "") // blockquotes
      .replace(/\n{3,}/g, "\n\n") // excessive newlines
      .trim();
    setText(cleaned);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage("Audio referensi maksimal 10MB (disarankan sampel 5-15 detik).");
      return;
    }

    setReferenceAudioName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setReferenceAudioBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleClearReferenceAudio = () => {
    setReferenceAudioName(null);
    setReferenceAudioBase64(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSynthesize = async () => {
    if (!text.trim()) {
      setErrorMessage("Teks tidak boleh kosong.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setIsPlaying(false);
    setJobProgress(null);

    try {
      const trimmedText = text.trim();
      const isLongText = trimmedText.length > 350;

      // For long texts: Use background job queue with polling to guarantee zero timeouts
      if (isLongText) {
        setJobProgress("Memulai antrean sintesis Fish-Speech...");
        const initRes = await fetch("/api/tts?mode=async", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: trimmedText,
            model,
            voice_seed: Number(voiceSeed),
            speed: Number(speed),
            paragraph_delay: Number(paragraphDelay),
            temperature: Number(temperature),
            reference_audio: referenceAudioBase64,
          }),
        });

        if (!initRes.ok) {
          const errData = await initRes.json().catch(() => ({}));
          throw new Error(errData.error || `Gagal membuat job sintesis (${initRes.status})`);
        }

        const jobInit = await initRes.json();
        const jobId = jobInit.job_id;

        // Poll job progress
        let isDone = false;
        let attempts = 0;
        const maxAttempts = 800;

        while (!isDone && attempts < maxAttempts) {
          attempts++;
          await new Promise((resolve) => setTimeout(resolve, 1500));

          const pollRes = await fetch(`/api/tts?jobId=${encodeURIComponent(jobId)}`);
          if (!pollRes.ok) continue;

          const pollData = await pollRes.json();
          if (pollData.status === "processing" || pollData.status === "queued") {
            const completed = pollData.completed_segments || 0;
            const total = pollData.total_segments || 1;
            const pct = Math.round((pollData.progress || 0) * 100);
            const remainingSegs = Math.max(0, total - completed);
            const estSec = Math.ceil(remainingSegs * 0.8);
            const estText = estSec > 0 ? ` (~${estSec} detik tersisa)` : "";
            setJobProgress(`Fish-Speech: Segmen ${completed}/${total} (${pct}%)${estText}...`);
          } else if (pollData.status === "completed") {
            isDone = true;
            setJobProgress("Menggabungkan audio hasil sintesis...");
            break;
          } else if (pollData.status === "failed") {
            throw new Error(pollData.error || "Proses sintesis di latar belakang gagal.");
          }
        }

        if (!isDone) {
          throw new Error("Waktu tunggu sintesis latar belakang habis.");
        }

        // Fetch finalized audio WAV
        const audioRes = await fetch(`/api/tts?jobId=${encodeURIComponent(jobId)}&audio=true`);
        if (!audioRes.ok) {
          throw new Error("Gagal mengunduh audio hasil pemrosesan.");
        }

        const modeHeader = audioRes.headers.get("X-Model-Mode") || audioRes.headers.get("X-ChatTTS-Mode");
        setIsFallbackMode(modeHeader === "standby" || modeHeader === "fallback-test");

        const arrayBuffer = await audioRes.arrayBuffer();
        const audioBlob = new Blob([arrayBuffer], { type: "audio/wav" });

        if (audioUrl) {
          URL.revokeObjectURL(audioUrl);
        }
        setAudioUrl(URL.createObjectURL(audioBlob));
        return;
      }

      // Synchronous request for short texts
      setJobProgress("Fish-Speech: Mensintesis suara...");
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: trimmedText,
          model,
          voice_seed: Number(voiceSeed),
          speed: Number(speed),
          paragraph_delay: Number(paragraphDelay),
          temperature: Number(temperature),
          reference_audio: referenceAudioBase64,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(
          errData.error || `Sintesis gagal dengan status ${res.status}`
        );
      }

      const modeHeader = res.headers.get("X-Model-Mode") || res.headers.get("X-ChatTTS-Mode");
      setIsFallbackMode(modeHeader === "standby" || modeHeader === "fallback-test");

      const arrayBuffer = await res.arrayBuffer();
      const audioBlob = new Blob([arrayBuffer], { type: "audio/wav" });

      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }

      const newUrl = URL.createObjectURL(audioBlob);
      setAudioUrl(newUrl);
    } catch (err: any) {
      setErrorMessage(err.message || "Terjadi kesalahan saat memproses audio.");
    } finally {
      setIsLoading(false);
      setJobProgress(null);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.playbackRate = playbackRate;
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((e) => {
          console.error("Playback error:", e);
          setIsPlaying(false);
        });
    }
  };

  const handlePlaybackRateChange = (rate: number) => {
    setPlaybackRate(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration || 0);
      audioRef.current.playbackRate = playbackRate;
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const handleDownload = () => {
    if (!audioUrl) return;
    const link = document.createElement("a");
    link.href = audioUrl;
    link.download = `podcast-${Date.now()}.wav`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs === 0) return "0:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // Live Statistics Calculations
  const wordCount = text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0;
  const breakCount = (text.match(/<break\s+time=/gi) || []).length;
  const vocalMatches = text.match(/\[(pause|emphasis|laughing|inhale|chuckle|tsk|singing|excited|laughing tone|interrupting|chuckling|excited tone|volume up|echo|angry|low volume|sigh|low voice|whisper|screaming|shouting|loud|surprised|short pause|exhale|delight|panting|audience laughter|with strong accent|volume down|clearing throat|sad|moaning|shocked)\]/gi) || [];
  const vocalCount = vocalMatches.length;
  const paragraphCount = text.trim().split(/\n\s*\n/).filter(Boolean).length;
  const estimatedSeconds = Math.max(
    2,
    Math.round((wordCount / (140 * speed)) * 60) +
      breakCount * 1.5 +
      vocalCount * 0.5 +
      (paragraphCount - 1) * paragraphDelay
  );
  const estMin = Math.floor(estimatedSeconds / 60);
  const estSec = estimatedSeconds % 60;
  const estDurationStr = `${estMin > 0 ? `${estMin}m ` : ""}${estSec}s`;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl border border-[#e8e7e0] flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#e8e7e0] flex justify-between items-center bg-[#faf9f6]">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl bg-[#0066cc]/10 text-[#0066cc] flex items-center justify-center font-bold shadow-xs">
              <Volume2 className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#191919] font-mono uppercase tracking-wider">
                  {title}
                </h3>
                <span className="inline-flex items-center px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[10px] font-mono font-bold border border-emerald-200">
                  <Cpu className="w-3 h-3 mr-1" /> GTX 1650 CUDA
                </span>
              </div>
              <p className="text-[11px] text-[#777777]">
                Multilingual Speech Synthesis & Indonesian Neural Engine
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-[#888888] hover:text-[#191919] p-1.5 rounded-lg transition-colors cursor-pointer"
            title="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-5 flex-1">
          {errorMessage && (
            <div className="p-3 bg-red-50 text-red-700 rounded-xl border border-red-200 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <div className="flex-1 leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {isFallbackMode && (
            <div className="p-3.5 bg-blue-50 text-blue-800 rounded-xl border border-blue-200 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-blue-600" />
              <div className="leading-relaxed">
                <strong>Mode Standby Aktif:</strong> Service Fish-Speech aktif. Menggunakan mesin vokal neural Bahasa Indonesia studio-grade.
              </div>
            </div>
          )}

          {/* Grid: Model Checkpoint & Speaker Voice */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Model Checkpoint */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#191919] flex items-center justify-between">
                <span>Model Checkpoint</span>
                <span className="text-[10px] font-normal text-[#0066cc]">
                  {model.startsWith("gemini") ? "✨ Gemini 2.5 Native Audio" : "Fish-Speech v1.5"}
                </span>
              </label>
              <select
                value={model}
                onChange={(e) => {
                  const newModel = e.target.value;
                  setModel(newModel);
                  if (newModel === "gemini-tts" && (!voiceSeed || voiceSeed < 9001 || voiceSeed > 9005)) {
                    setVoiceSeed(9001); // Auto-select Kore for Gemini
                  }
                }}
                disabled={isLoading}
                className="w-full h-10 px-3 rounded-xl bg-[#faf9f6] border border-[#e8e7e0] text-xs font-medium text-[#191919] outline-none focus:border-[#191919] cursor-pointer"
              >
                {DEFAULT_MODELS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Speaker Voice Persona */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#191919]">
                  Karakter Suara (Speaker)
                </label>
                <button
                  type="button"
                  onClick={() => {
                    if (model === "gemini-tts") {
                      const geminiSeeds = [9001, 9002, 9003, 9004, 9005];
                      setVoiceSeed(geminiSeeds[Math.floor(Math.random() * geminiSeeds.length)]);
                    } else {
                      setVoiceSeed(Math.floor(Math.random() * 9000) + 1000);
                    }
                  }}
                  className="text-[10px] text-[#777777] hover:text-[#191919] flex items-center gap-1 cursor-pointer transition-colors"
                  title="Acak Karakter Suara"
                >
                  <Dices className="w-3.5 h-3.5" />
                  <span>Acak ({voiceSeed})</span>
                </button>
              </div>
              <select
                value={DEFAULT_VOICES.some((v) => v.seed === voiceSeed) ? voiceSeed : "custom"}
                onChange={(e) => {
                  if (e.target.value !== "custom") {
                    const newSeed = Number(e.target.value);
                    setVoiceSeed(newSeed);
                    const selected = DEFAULT_VOICES.find((v) => v.seed === newSeed);
                    if (selected?.default_speed) {
                      setSpeed(selected.default_speed);
                    }
                  }
                }}
                disabled={isLoading}
                className="w-full h-10 px-3 rounded-xl bg-[#faf9f6] border border-[#e8e7e0] text-xs font-medium text-[#191919] outline-none focus:border-[#191919] cursor-pointer"
              >
                <optgroup label="✨ Google Gemini Voices (Native Vocal Tags & Human Emotion)">
                  {DEFAULT_VOICES.filter((v) => v.group === "gemini").map((v) => (
                    <option key={v.seed} value={v.seed}>
                      {v.gender === "female" ? "👩" : "👨"} {v.name} — {v.style}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="🎙️ Varian Andi / Ardi (Pria - Host Favorit & Multi-Bahasa)">
                  {DEFAULT_VOICES.filter((v) => v.group === "ardi").map((v) => (
                    <option key={v.seed} value={v.seed}>
                      👨 {v.name} — {v.style}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="🌸 Varian Gadis (Wanita - Edukasi & Storyteller)">
                  {DEFAULT_VOICES.filter((v) => v.group === "gadis").map((v) => (
                    <option key={v.seed} value={v.seed}>
                      👩 {v.name} — {v.style}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="🇮🇩 Suara Nusantara (Teduh, Santun & Ramah)">
                  {DEFAULT_VOICES.filter((v) => v.group === "nusantara").map((v) => (
                    <option key={v.seed} value={v.seed}>
                      {v.gender === "female" ? "👩" : "👨"} {v.name} — {v.style}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="🌐 Multilingual Masters (Bilingual ID-EN & Global)">
                  {DEFAULT_VOICES.filter((v) => v.group === "multilingual").map((v) => (
                    <option key={v.seed} value={v.seed}>
                      {v.gender === "female" ? "👩" : "👨"} {v.name} — {v.style}
                    </option>
                  ))}
                </optgroup>
                {!DEFAULT_VOICES.some((v) => v.seed === voiceSeed) && (
                  <option value="custom">Custom Voice Seed ({voiceSeed})</option>
                )}
              </select>

              {/* Voice Persona Description Badge */}
              {(() => {
                const currentVoice = DEFAULT_VOICES.find((v) => v.seed === voiceSeed);
                if (currentVoice) {
                  return (
                    <div className="p-2 rounded-lg bg-[#f0f4f8] border border-[#d9e2ec] text-[11px] text-[#334e68] leading-tight flex items-start gap-1.5">
                      <span className="font-semibold shrink-0 text-[#102a43]">
                        {currentVoice.gender === "female" ? "👩" : "👨"} {currentVoice.name}:
                      </span>
                      <span>{currentVoice.description || currentVoice.style}</span>
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          </div>

          {/* Fitur Delay & Jeda Antar Paragraf */}
          <div className="p-3.5 bg-[#faf9f6] rounded-xl border border-[#e8e7e0] space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#0066cc]" />
                <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#191919]">
                  Jeda Antar Paragraf (Delay): {paragraphDelay.toFixed(1)}s
                </label>
              </div>
              <span className="text-[10px] text-[#777777] font-mono">
                {paragraphDelay === 0 ? "Tanpa Jeda" : paragraphDelay < 1 ? "Jeda Singkat" : "Jeda Natural"}
              </span>
            </div>
            <input
              type="range"
              min="0.0"
              max="3.0"
              step="0.2"
              value={paragraphDelay}
              onChange={(e) => setParagraphDelay(Number(e.target.value))}
              disabled={isLoading}
              className="w-full accent-[#0066cc] cursor-pointer h-1.5 bg-[#e8e7e0] rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-[#888888]">
              <span>0.0s (Menyatu)</span>
              <span>1.0s (Standar Podcast)</span>
              <span>2.0s (Storytelling)</span>
              <span>3.0s (Dramatis)</span>
            </div>
          </div>

          {/* Zero-Shot Voice Clone Section */}
          <div className="p-3.5 bg-[#faf9f6] rounded-xl border border-[#e8e7e0] space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#191919] flex items-center gap-1.5">
                <Mic className="w-3.5 h-3.5 text-[#0066cc]" />
                Zero-Shot Voice Cloning (Opsional)
              </label>
              {referenceAudioName && (
                <button
                  type="button"
                  onClick={handleClearReferenceAudio}
                  className="text-[10px] text-red-600 hover:underline cursor-pointer"
                >
                  Hapus Sampel
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/wav,audio/mp3,audio/m4a"
                onChange={handleFileUpload}
                disabled={isLoading}
                className="text-xs text-[#666666] file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border file:border-[#d1d0c9] file:text-xs file:font-medium file:bg-white file:text-[#333333] hover:file:bg-[#f0eee6] cursor-pointer"
              />
              <span className="text-[10px] text-[#888888]">
                {referenceAudioName ? `Terpilih: ${referenceAudioName}` : "(WAV/MP3 5-15s untuk meniru warna suara)"}
              </span>
            </div>
          </div>

          {/* Speed & Expressiveness Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Speed Control */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#191919]">
                  Kecepatan (Speed): {speed.toFixed(1)}x
                </label>
                <span className="text-[10px] text-[#777777] font-mono">
                  {speed < 1.0 ? "Lambat" : speed > 1.0 ? "Cepat" : "Normal"}
                </span>
              </div>
              <input
                type="range"
                min="0.7"
                max="1.5"
                step="0.05"
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
                disabled={isLoading}
                className="w-full accent-[#191919] cursor-pointer h-1.5 bg-[#e8e7e0] rounded-lg"
              />
            </div>

            {/* Expressiveness (Temperature) */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#191919]">
                  Ekspresi Vokal: {temperature.toFixed(2)}
                </label>
                <span className="text-[10px] text-[#777777] font-mono">
                  {temperature < 0.3 ? "Stabil / Berita" : temperature > 0.6 ? "Ekspresif" : "Natural"}
                </span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={temperature}
                onChange={(e) => setTemperature(Number(e.target.value))}
                disabled={isLoading}
                className="w-full accent-[#191919] cursor-pointer h-1.5 bg-[#e8e7e0] rounded-lg"
              />
            </div>
          </div>

          {/* Text Editor Toolbar & Textarea */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#191919]">
                Teks Naskah Podcast / Konten
              </label>

              {/* Quick Action Tools */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] text-[#888888] font-mono mr-1">Sisip Jeda:</span>
                <button
                  type="button"
                  onClick={() => handleInsertBreak(0.5)}
                  className="px-2 py-0.5 bg-[#faf9f6] hover:bg-[#e8e7e0] border border-[#d1d0c9] rounded text-[10px] font-mono font-semibold text-[#333333] transition-colors cursor-pointer"
                  title="Sisipkan jeda 0.5 detik"
                >
                  +0.5s
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertBreak(1.0)}
                  className="px-2 py-0.5 bg-[#faf9f6] hover:bg-[#e8e7e0] border border-[#d1d0c9] rounded text-[10px] font-mono font-semibold text-[#333333] transition-colors cursor-pointer"
                  title="Sisipkan jeda 1 detik"
                >
                  +1.0s
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertBreak(1.5)}
                  className="px-2 py-0.5 bg-[#faf9f6] hover:bg-[#e8e7e0] border border-[#d1d0c9] rounded text-[10px] font-mono font-semibold text-[#333333] transition-colors cursor-pointer"
                  title="Sisipkan jeda 1.5 detik"
                >
                  +1.5s
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertBreak(2.0)}
                  className="px-2 py-0.5 bg-[#faf9f6] hover:bg-[#e8e7e0] border border-[#d1d0c9] rounded text-[10px] font-mono font-semibold text-[#333333] transition-colors cursor-pointer"
                  title="Sisipkan jeda 2 detik"
                >
                  +2.0s
                </button>
                <span className="text-[#d1d0c9]">|</span>
                <button
                  type="button"
                  onClick={handleCleanMarkdown}
                  className="px-2 py-0.5 bg-[#faf9f6] hover:bg-amber-50 hover:text-amber-800 hover:border-amber-300 border border-[#d1d0c9] rounded text-[10px] font-medium text-[#555555] transition-colors flex items-center gap-1 cursor-pointer"
                  title="Hapus simbol markdown (#, **, bullet) agar pelafalan halus"
                >
                  <Eraser className="w-3 h-3" />
                  <span>Bersihkan Markdown</span>
                </button>
              </div>
            </div>

            {/* 34 Vocal Expression & Audio Tags Toolbar */}
            <div className="p-2.5 bg-[#faf9f6] rounded-xl border border-[#e8e7e0] space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#0066cc]" />
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#191919]">
                    Ekspresi Vokal & Efek Suara (34 Tags)
                  </span>
                </div>
                <div className="flex items-center gap-1 bg-[#edece6] p-0.5 rounded-lg text-[10px] font-mono">
                  <button
                    type="button"
                    onClick={() => setActiveTagCategory("timing")}
                    className={`px-2 py-0.5 rounded-md font-medium transition-colors cursor-pointer ${
                      activeTagCategory === "timing"
                        ? "bg-white text-[#191919] shadow-xs font-bold"
                        : "text-[#666666] hover:text-[#191919]"
                    }`}
                  >
                    ⏱️ Jeda & Napas (8)
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTagCategory("laughter")}
                    className={`px-2 py-0.5 rounded-md font-medium transition-colors cursor-pointer ${
                      activeTagCategory === "laughter"
                        ? "bg-white text-[#191919] shadow-xs font-bold"
                        : "text-[#666666] hover:text-[#191919]"
                    }`}
                  >
                    😂 Tawa & Ceria (6)
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTagCategory("prosody")}
                    className={`px-2 py-0.5 rounded-md font-medium transition-colors cursor-pointer ${
                      activeTagCategory === "prosody"
                        ? "bg-white text-[#191919] shadow-xs font-bold"
                        : "text-[#666666] hover:text-[#191919]"
                    }`}
                  >
                    📢 Dinamika (9)
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTagCategory("emotion")}
                    className={`px-2 py-0.5 rounded-md font-medium transition-colors cursor-pointer ${
                      activeTagCategory === "emotion"
                        ? "bg-white text-[#191919] shadow-xs font-bold"
                        : "text-[#666666] hover:text-[#191919]"
                    }`}
                  >
                    🔥 Emosi (11)
                  </button>
                </div>
              </div>

              {/* Tag Chips for the active category */}
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                {VOCAL_EXPRESSION_TAGS.filter((t) => t.category === activeTagCategory).map((t) => (
                  <button
                    key={t.tag}
                    type="button"
                    onClick={() => handleInsertTag(t.tag)}
                    title={`${t.label}: ${t.description} (Klik untuk menyisipkan ke naskah)`}
                    className="px-2 py-0.5 bg-white hover:bg-[#0066cc]/10 hover:border-[#0066cc]/40 hover:text-[#0066cc] border border-[#d8d6cc] rounded-md text-[11px] font-mono text-[#2c2c2c] transition-all cursor-pointer flex items-center gap-1 shadow-2xs active:scale-95"
                  >
                    <span className="font-bold text-[#0066cc]">{t.tag}</span>
                    <span className="text-[9px] text-[#777777] font-sans">
                      {t.description.split(" ")[0]}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <textarea
              ref={textareaRef}
              rows={6}
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={isLoading}
              placeholder="Ketik atau tempelkan naskah podcast di sini. Klik tag ekspresi vokal di atas untuk menyisipkan jeda, tawa, atau dinamika suara..."
              className="w-full p-3.5 rounded-xl bg-[#faf9f6] border border-[#e8e7e0] text-xs text-[#191919] outline-none focus:border-[#191919] font-sans resize-y leading-relaxed shadow-inner"
            />

            {/* Live Text & Duration Statistics */}
            <div className="flex flex-wrap items-center justify-between text-[11px] text-[#777777] bg-[#f5f4ef] px-3 py-1.5 rounded-lg border border-[#e8e7e0]">
              <div className="flex items-center gap-2.5">
                <span>
                  <strong>{wordCount}</strong> kata
                </span>
                <span>•</span>
                <span>
                  <strong>{text.length}</strong> / 5000 karakter
                </span>
                <span>•</span>
                <span>
                  <strong>{paragraphCount}</strong> paragraf
                </span>
                {vocalCount > 0 && (
                  <>
                    <span>•</span>
                    <span className="text-[#0066cc] font-semibold flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      <strong>{vocalCount}</strong> ekspresi vokal
                    </span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-[#191919] font-medium">
                <Clock className="w-3.5 h-3.5 text-[#0066cc]" />
                <span>Estimasi Durasi: <strong>~{estDurationStr}</strong></span>
              </div>
            </div>

            {jobProgress && (
              <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2 text-xs text-[#0066cc]">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span className="font-mono font-semibold">{jobProgress}</span>
              </div>
            )}
          </div>

          {/* Audio Player Card */}
          {audioUrl && (
            <div className="p-4 bg-[#f0eee6] rounded-2xl border border-[#e8e7e0] space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#191919] flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#1a8917]" />
                  Hasil Sintesis Audio Siap Diputar
                </span>
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={handleSynthesize}
                    disabled={isLoading}
                    className="text-xs font-semibold text-[#191919] hover:text-[#0066cc] flex items-center gap-1.5 font-mono cursor-pointer transition-colors"
                    title="Sintesis ulang audio"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-[#0066cc]" : ""}`} />
                    Sintesis Ulang
                  </button>
                  <span className="text-[#d1d0c9]">|</span>
                  <button
                    onClick={handleDownload}
                    className="text-xs font-semibold text-[#191919] hover:text-[#0066cc] flex items-center gap-1.5 font-mono cursor-pointer transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Unduh .WAV
                  </button>
                </div>
              </div>

              {/* Hidden HTML5 Audio Element */}
              <audio
                ref={audioRef}
                src={audioUrl}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={() => setIsPlaying(false)}
                onError={() => {
                  setIsPlaying(false);
                  setErrorMessage("Browser gagal memuat audio. Format WAV didukung di semua browser modern.");
                }}
              />

              {/* Interactive Audio Controls */}
              <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-[#e8e7e0] shadow-xs">
                <button
                  onClick={togglePlay}
                  className="w-9 h-9 rounded-full bg-[#191919] text-white flex items-center justify-center hover:bg-[#333333] transition-colors cursor-pointer shrink-0 shadow-xs"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                </button>

                <div className="flex-1 flex flex-col gap-1">
                  <input
                    type="range"
                    min={0}
                    max={duration || 1}
                    step={0.01}
                    value={currentTime}
                    onChange={handleSeek}
                    className="w-full accent-[#191919] cursor-pointer h-1.5 bg-[#e8e7e0] rounded-lg"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-[#777777]">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                {/* Playback Rate Selector */}
                <div className="flex items-center gap-1 bg-[#faf9f6] px-2 py-1 rounded-lg border border-[#e8e7e0] text-[10px] font-mono font-bold text-[#555555]">
                  {[1.0, 1.25, 1.5].map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => handlePlaybackRateChange(rate)}
                      className={`px-1.5 py-0.5 rounded transition-colors cursor-pointer ${
                        playbackRate === rate ? "bg-[#191919] text-white" : "hover:text-[#191919]"
                      }`}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => {
                    if (audioRef.current) {
                      audioRef.current.currentTime = 0;
                      audioRef.current.play();
                      setIsPlaying(true);
                    }
                  }}
                  title="Ulangi dari awal"
                  className="p-1.5 text-[#777777] hover:text-[#191919] transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-[#e8e7e0] bg-[#faf9f6] flex justify-between items-center gap-3">
          <div className="text-[11px] text-[#777777] hidden sm:block">
            Tekan tombol untuk memulai sintesis suara beresolusi 24kHz.
          </div>
          <div className="flex items-center gap-2.5 ml-auto">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 rounded-xl border border-[#d1d0c9] text-xs font-semibold text-[#555555] hover:bg-white transition-colors cursor-pointer"
            >
              Tutup
            </button>
            <button
              onClick={handleSynthesize}
              disabled={isLoading || !text.trim()}
              className="px-5 py-2 rounded-xl bg-[#191919] hover:bg-[#333333] text-white text-xs font-semibold transition-colors flex items-center gap-2 disabled:opacity-50 shadow-xs cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{jobProgress || "Memproses Audio..."}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>{audioUrl ? "Sintesis Ulang Suara" : "Sintesis Suara (Generate)"}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
