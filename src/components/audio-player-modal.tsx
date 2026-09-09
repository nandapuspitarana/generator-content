"use client";

import React, { useState, useRef } from "react";

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
  title = "ChatTTS Speech Studio",
}: AudioPlayerModalProps) {
  const [text, setText] = useState(initialText || "");
  const [voiceSeed, setVoiceSeed] = useState<number>(2222);
  const [speed, setSpeed] = useState<number>(1.0);
  const [isLoading, setIsLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Sync text when modal opens
  React.useEffect(() => {
    if (initialText) {
      // Clean SSML tags for user reading or preview
      setText(initialText.slice(0, 3000));
    }
  }, [initialText]);

  // Clean up object URL when component unmounts or audio changes
  React.useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  if (!isOpen) return null;

  const handleSynthesize = async () => {
    if (!text.trim()) {
      setErrorMessage("Teks tidak boleh kosong.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: text.trim(),
          voice_seed: Number(voiceSeed),
          speed: Number(speed),
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(
          errData.error || `Sintesis gagal dengan status ${res.status}`
        );
      }

      const blob = await res.blob();
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      const newUrl = URL.createObjectURL(blob);
      setAudioUrl(newUrl);
    } catch (err: any) {
      setErrorMessage(err.message || "Gagal menghubungi service ChatTTS.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl border border-[#e8e7e0] flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-[#e8e7e0] flex justify-between items-center bg-[#faf9f6]">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-[#c8102e]/10 text-[#c8102e] flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-[18px]">volume_up</span>
            </span>
            <div>
              <h3 className="text-sm font-bold text-[#191919] font-mono uppercase tracking-wider">
                {title}
              </h3>
              <p className="text-[11px] text-[#777777]">
                Generative Dialogue Speech powered by ChatTTS Microservice
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-[#888888] hover:text-[#191919] p-1 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {errorMessage && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg border border-red-200 text-xs flex items-start gap-2">
              <span className="material-symbols-outlined text-sm mt-0.5">error</span>
              <div className="flex-1">{errorMessage}</div>
            </div>
          )}

          {/* Voice Presets */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#191919]">
                Speaker Voice Seed
              </label>
              <select
                value={voiceSeed}
                onChange={(e) => setVoiceSeed(Number(e.target.value))}
                disabled={isLoading}
                className="w-full h-9 px-3 rounded-lg bg-[#faf9f6] border border-[#e8e7e0] text-xs font-medium text-[#191919] outline-none focus:border-[#191919]"
              >
                <option value={2222}>Host Natural (Seed 2222)</option>
                <option value={4444}>Host Energik (Seed 4444)</option>
                <option value={6666}>Host Kalem (Seed 6666)</option>
                <option value={8888}>Host Storyteller (Seed 8888)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#191919]">
                Kecepatan (Speed): {speed}x
              </label>
              <input
                type="range"
                min="0.7"
                max="1.4"
                step="0.1"
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
                disabled={isLoading}
                className="w-full mt-2 accent-[#191919] cursor-pointer"
              />
            </div>
          </div>

          {/* Input Textarea */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#191919]">
                Teks Naskah untuk Disintesis
              </label>
              <span className="text-[10px] text-[#888888] font-mono">
                {text.length}/3000 chars
              </span>
            </div>
            <textarea
              rows={6}
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={isLoading}
              placeholder="Masukkan teks naskah podcast atau ulasan..."
              className="w-full p-3 rounded-lg bg-[#faf9f6] border border-[#e8e7e0] text-xs text-[#191919] outline-none focus:border-[#191919] font-sans resize-y leading-relaxed"
            />
            <p className="text-[10px] text-[#888888]">
              Tips: ChatTTS membaca tag jeda seperti SSML break atau token percakapan lisan secara ekspresif.
            </p>
          </div>

          {/* Audio Player Card (if generated) */}
          {audioUrl && (
            <div className="p-4 bg-[#f0eee6] rounded-xl border border-[#e8e7e0] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#191919] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-[#1a8917]">
                    play_circle
                  </span>
                  Audio Synthesized Ready
                </span>
                <a
                  href={audioUrl}
                  download="chattts-podcast.wav"
                  className="text-xs font-semibold text-[#191919] hover:text-[#c8102e] flex items-center gap-1 underline font-mono"
                >
                  <span className="material-symbols-outlined text-[14px]">download</span>
                  Download .WAV
                </a>
              </div>
              <audio
                ref={audioRef}
                controls
                src={audioUrl}
                className="w-full h-10 rounded-lg outline-none"
                autoPlay
              />
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-[#e8e7e0] bg-[#faf9f6] flex justify-end gap-2.5">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg border border-[#d1d0c9] text-xs font-semibold text-[#555555] hover:bg-white transition-colors"
          >
            Tutup
          </button>
          <button
            onClick={handleSynthesize}
            disabled={isLoading || !text.trim()}
            className="px-5 py-2 rounded-lg bg-[#191919] hover:bg-[#333333] text-white text-xs font-semibold transition-colors flex items-center gap-2 disabled:opacity-50 shadow-xs"
          >
            {isLoading ? (
              <>
                <span className="material-symbols-outlined animate-spin text-[16px]">
                  progress_activity
                </span>
                <span>Synthesizing Audio (~10-25s)...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[16px]">
                  graphic_eq
                </span>
                <span>Synthesize with ChatTTS</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
