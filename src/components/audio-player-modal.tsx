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
} from "lucide-react";

interface AudioPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialText: string;
  title?: string;
}

export function AudioPlayerModal({
  isOpen,
  onClose,
  initialText,
  title = "Fish-Speech Studio (Bahasa Indonesia)",
}: AudioPlayerModalProps) {
  const [text, setText] = useState(initialText || "");
  const [model, setModel] = useState<string>("default");
  const [voiceSeed, setVoiceSeed] = useState<number>(2222);
  const [speed, setSpeed] = useState<number>(1.0);
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
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
      const isLongText = trimmedText.length > 400;

      // For long texts: Use background job queue with polling to guarantee zero timeouts
      if (isLongText) {
        setJobProgress("Memulai antrean sintesis Fish-Speech di background...");
        const initRes = await fetch("/api/tts?mode=async", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: trimmedText,
            model,
            voice_seed: Number(voiceSeed),
            speed: Number(speed),
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
          await new Promise((resolve) => setTimeout(resolve, 2000));

          const pollRes = await fetch(`/api/tts?jobId=${encodeURIComponent(jobId)}`);
          if (!pollRes.ok) continue;

          const pollData = await pollRes.json();
          if (pollData.status === "processing" || pollData.status === "queued") {
            const completed = pollData.completed_segments || 0;
            const total = pollData.total_segments || 1;
            const pct = Math.round((pollData.progress || 0) * 100);
            const remainingSegs = Math.max(0, total - completed);
            const estSec = remainingSegs * 5;
            const estText = estSec > 0 ? ` (~${estSec} detik tersisa)` : "";
            setJobProgress(`Fish-Speech: Segmen ${completed}/${total} (${pct}%)${estText}...`);
          } else if (pollData.status === "completed") {
            isDone = true;
            setJobProgress("Menggabungkan audio hasil Fish-Speech...");
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

        const modeHeader = audioRes.headers.get("X-ChatTTS-Mode") || audioRes.headers.get("X-Model-Mode");
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
          reference_audio: referenceAudioBase64,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(
          errData.error || `Sintesis gagal dengan status ${res.status}`
        );
      }

      const modeHeader = res.headers.get("X-ChatTTS-Mode") || res.headers.get("X-Model-Mode");
      setIsFallbackMode(modeHeader === "standby" || modeHeader === "fallback-test");

      const arrayBuffer = await res.arrayBuffer();
      const audioBlob = new Blob([arrayBuffer], { type: "audio/wav" });

      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }

      const newUrl = URL.createObjectURL(audioBlob);
      setAudioUrl(newUrl);
    } catch (err: any) {
      setErrorMessage(err.message || "Gagal menghubungi service Fish-Speech.");
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
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          console.error("Audio playback error:", err);
          setErrorMessage(
            "Browser memblokir pemutaran otomatis atau format audio belum selesai dimuat. Klik tombol Play sekali lagi."
          );
        });
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
    link.download = `fish-speech-${Date.now()}.wav`;
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

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl border border-[#e8e7e0] flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-[#e8e7e0] flex justify-between items-center bg-[#faf9f6]">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-[#0066cc]/10 text-[#0066cc] flex items-center justify-center font-bold">
              <Volume2 className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-[#191919] font-mono uppercase tracking-wider">
                {title}
              </h3>
              <p className="text-[11px] text-[#777777] flex items-center gap-1.5">
                <span>Multilingual & Bahasa Indonesia (Fish-Speech Engine)</span>
                <span className="inline-flex items-center px-1.5 py-0.2 bg-emerald-50 text-emerald-700 rounded text-[9px] font-mono font-bold">
                  <Cpu className="w-2.5 h-2.5 mr-0.5" /> GTX 1650 Ready
                </span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-[#888888] hover:text-[#191919] p-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {errorMessage && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg border border-red-200 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <div className="flex-1">{errorMessage}</div>
            </div>
          )}

          {isFallbackMode && (
            <div className="p-3.5 bg-blue-50 text-blue-800 rounded-lg border border-blue-200 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-blue-600" />
              <div className="leading-relaxed">
                <strong>Mode Standby Aktif:</strong> Service Fish-Speech berjalan normal. Anda dapat mengunduh model base atau fine-tuned via script <code className="bg-blue-100 px-1 py-0.5 rounded font-mono">npm run tts:setup</code>.
              </div>
            </div>
          )}

          {/* Model & Voice Configuration */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#191919]">
                Model Checkpoint
              </label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                disabled={isLoading}
                className="w-full h-9 px-3 rounded-lg bg-[#faf9f6] border border-[#e8e7e0] text-xs font-medium text-[#191919] outline-none focus:border-[#191919] cursor-pointer"
              >
                <option value="default">Base Model (openaudio-s1-mini)</option>
                <option value="indonesia-lora">Indonesia Fine-Tuned (X-Lord Dataset)</option>
              </select>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#191919]">
                  Speaker Voice Seed
                </label>
                <button
                  type="button"
                  onClick={() => setVoiceSeed(Math.floor(Math.random() * 9000) + 1000)}
                  className="text-[10px] text-[#777777] hover:text-[#191919] flex items-center gap-1 cursor-pointer transition-colors"
                  title="Acak Seed Suara"
                >
                  <Dices className="w-3 h-3" />
                  <span>Acak ({voiceSeed})</span>
                </button>
              </div>
              <select
                value={[2222, 4444, 6666, 8888].includes(voiceSeed) ? voiceSeed : "custom"}
                onChange={(e) => {
                  if (e.target.value !== "custom") {
                    setVoiceSeed(Number(e.target.value));
                  }
                }}
                disabled={isLoading}
                className="w-full h-9 px-3 rounded-lg bg-[#faf9f6] border border-[#e8e7e0] text-xs font-medium text-[#191919] outline-none focus:border-[#191919] cursor-pointer"
              >
                <option value={2222}>Host Natural Indonesia (Seed 2222)</option>
                <option value={4444}>Host Energik Podcast (Seed 4444)</option>
                <option value={6666}>Host Narasi Kalem (Seed 6666)</option>
                <option value={8888}>Host Storyteller Deep (Seed 8888)</option>
                {![2222, 4444, 6666, 8888].includes(voiceSeed) && (
                  <option value="custom">Custom Seed ({voiceSeed})</option>
                )}
              </select>
            </div>
          </div>

          {/* Zero-Shot Voice Clone Section */}
          <div className="p-3 bg-[#faf9f6] rounded-lg border border-[#e8e7e0] space-y-2">
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
                  Hapus Suara Referensi
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
                className="text-xs text-[#666666] file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border file:border-[#d1d0c9] file:text-xs file:font-medium file:bg-white file:text-[#333333] hover:file:bg-[#f0eee6] cursor-pointer"
              />
              <span className="text-[10px] text-[#888888]">
                {referenceAudioName ? `Terpilih: ${referenceAudioName}` : "(WAV/MP3 5-15 detik untuk tiru suara)"}
              </span>
            </div>
          </div>

          {/* Speed Control */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#191919]">
                Kecepatan (Speed): {speed}x
              </label>
              <span className="text-[10px] text-[#777777] font-mono">0.7x - 1.4x</span>
            </div>
            <input
              type="range"
              min="0.7"
              max="1.4"
              step="0.1"
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              disabled={isLoading}
              className="w-full accent-[#191919] cursor-pointer"
            />
          </div>

          {/* Input Textarea */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#191919]">
                Teks Naskah untuk Disintesis (Bahasa Indonesia)
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setText(
                      `Halo semua! Selamat datang di episode terbaru podcast kita. Saya Nanda, host kalian hari ini. <break time="1s"/> Kali ini, kita akan menyelami topik yang sangat menarik dan relevan, yaitu "3 Artificial Intelligence: A Modern Approach". <break time="2s"/> \n\n` +
                      `Kecerdasan buatan atau AI telah menjadi bagian penting dalam kehidupan kita sehari-hari. Namun, pernahkah Anda bertanya-tanya bagaimana AI sebenarnya memecahkan masalah? <break time="1s"/> Mari kita mulai dengan memahami konsep Problem-Solving Agents. <break time="1.5s"/> \n\n` +
                      `Problem-Solving Agents adalah entitas yang secara khusus dirancang untuk mengambil keputusan dalam situasi kompleks. Mereka bekerja dengan menjelajahi berbagai kemungkinan dan memilih langkah yang akan membawa mereka lebih dekat ke solusi. Tetapi, tidak semua masalah yang dihadapi AI itu sederhana. <break time="1s"/> Oleh karena itu, strategi pencarian yang efektif sangat diperlukan. <break time="1.5s"/> \n\n` +
                      `Ketika kita membicarakan Search Strategies, kita membahas metode yang digunakan agen untuk menjelajahi ruang masalah. Ada banyak metode seperti pencarian mendalam dan pencarian lebar. Setiap strategi memiliki kelebihan dan kekurangan tergantung pada masalah yang dihadapi. <break time="1s"/> \n\n` +
                      `Heuristic Search adalah salah satu metode yang terkenal. Ia memanfaatkan aturan praktis atau 'heuristik' untuk memperkirakan seberapa dekat suatu langkah menuju solusi. <break time="1s"/> Dengan menggunakan heuristik, agen dapat menghindari jalur yang tidak menjanjikan, fokus pada yang lebih menjanjikan, dan menghemat waktu serta sumber daya. <break time="1.5s"/> \n\n` +
                      `Namun, bagaimana jika kita berhadapan dengan situasi kompetitif? <break time="1s"/> Inilah saatnya Adversarial Search mengambil peran. Dalam konteks ini, agen harus mempertimbangkan tindakan lawan. <break time="1s"/> Seperti dalam permainan catur, agen harus merencanakan langkah mereka dengan cermat untuk bisa mengalahkan lawan. Ini menambah lapisan kompleksitas, karena agen tidak hanya mencari solusi terbaik untuk dirinya sendiri tetapi juga harus memprediksi langkah-langkah lawan. <break time="1.5s"/> \n\n` +
                      `Dengan memahami berbagai strategi pencarian ini, baik yang bersifat heuristik maupun yang melibatkan rivalitas, kita dapat lebih menghargai bagaimana AI menyelesaikan berbagai masalah rumit dalam kehidupan sehari-hari. <break time="1s"/> Dari memecahkan teka-teki kompleks hingga mengalahkan lawan dalam permainan strategi, AI telah menunjukkan kemampuannya yang luar biasa. <break time="2s"/> \n\n` +
                      `Sebagai kesimpulan, AI tidak hanya memecahkan masalah, tetapi juga mengubah cara kita melihat dan menyelesaikan masalah itu sendiri. <break time="1.5s"/> Dengan terus mempelajari dan memahami AI, kita bisa lebih siap menghadapi tantangan masa depan. Jadi, jangan berhenti di sini! Teruslah belajar dan mencari tahu lebih dalam tentang AI dan bagaimana ia dapat berkontribusi dalam hidup kita. <break time="2s"/> \n\n` +
                      `Terima kasih telah mendengarkan! Sampai jumpa di episode berikutnya`
                    );
                  }}
                  className="text-[10px] text-[#0066cc] hover:underline font-mono cursor-pointer"
                  title="Muat naskah podcast AI: A Modern Approach"
                >
                  + Muat Naskah AI Podcast
                </button>
                <span className="text-[10px] text-[#888888] font-mono">
                  {text.length}/5000 chars
                </span>
              </div>
            </div>
            <textarea
              rows={6}
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={isLoading}
              placeholder="Masukkan teks naskah podcast atau ulasan..."
              className="w-full p-3 rounded-lg bg-[#faf9f6] border border-[#e8e7e0] text-xs text-[#191919] outline-none focus:border-[#191919] font-sans resize-y leading-relaxed"
            />
            <div className="flex justify-between text-[10px] text-[#888888]">
              <span>Mendukung jeda &lt;break time="1s"/&gt; dan zero-shot voice cloning.</span>
              {jobProgress && <span className="font-mono text-[#0066cc] font-semibold">{jobProgress}</span>}
            </div>
          </div>

          {/* Audio Player Card */}
          {audioUrl && (
            <div className="p-4 bg-[#f0eee6] rounded-xl border border-[#e8e7e0] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#191919] flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#1a8917]" />
                  Audio Fish-Speech Ready
                </span>
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={handleSynthesize}
                    disabled={isLoading}
                    className="text-xs font-semibold text-[#191919] hover:text-[#0066cc] flex items-center gap-1.5 font-mono cursor-pointer transition-colors"
                    title="Sintesis ulang audio dengan teks atau pengaturan baru"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-[#0066cc]" : ""}`} />
                    Regenerate
                  </button>
                  <span className="text-[#d1d0c9]">|</span>
                  <button
                    onClick={handleDownload}
                    className="text-xs font-semibold text-[#191919] hover:text-[#0066cc] flex items-center gap-1.5 font-mono cursor-pointer transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download .WAV
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
                  setErrorMessage("Browser gagal memuat audio. Format WAV didukung di Chrome, Edge, Safari, dan Firefox.");
                }}
              />

              {/* Interactive Audio Controls */}
              <div className="flex items-center gap-3 bg-white px-3.5 py-2.5 rounded-lg border border-[#e8e7e0]">
                <button
                  onClick={togglePlay}
                  className="w-8 h-8 rounded-full bg-[#191919] text-white flex items-center justify-center hover:bg-[#333333] transition-colors cursor-pointer shrink-0"
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

                <button
                  onClick={() => {
                    if (audioRef.current) {
                      audioRef.current.currentTime = 0;
                      audioRef.current.play();
                      setIsPlaying(true);
                    }
                  }}
                  title="Replay from start"
                  className="p-1.5 text-[#777777] hover:text-[#191919] transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-[#e8e7e0] bg-[#faf9f6] flex justify-end gap-2.5">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg border border-[#d1d0c9] text-xs font-semibold text-[#555555] hover:bg-white transition-colors cursor-pointer"
          >
            Tutup
          </button>
          <button
            onClick={handleSynthesize}
            disabled={isLoading || !text.trim()}
            className="px-5 py-2 rounded-lg bg-[#191919] hover:bg-[#333333] text-white text-xs font-semibold transition-colors flex items-center gap-2 disabled:opacity-50 shadow-xs cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{jobProgress || "Fish-Speech Synthesizing..."}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>{audioUrl ? "Regenerate with Fish-Speech" : "Synthesize with Fish-Speech"}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
