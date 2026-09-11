# Implementation Plan: Fish-Speech Multilingual & Indonesian Voice Synthesis Microservice

**Branch**: `003-fish-speech-service` | **Date**: 2026-09-11 | **Spec**: [spec.md](spec.md)  
**Input**: Feature specification from `spec.md`

---

## 📌 Summary

Mengintegrasikan layanan sintesis suara dialog berbasis **Fish-Speech v1.5** (`services/fish-speech/`) sebagai microservice mandiri yang berkomunikasi dengan aplikasi Next.js via port `8765`.

### Arsitektur yang Diimplementasikan:
1. **Fish-Speech Microservice (FastAPI)**:
   - Akselerasi native NVIDIA CUDA 12.1 (FP16) untuk GPU GeForce GTX 1650 (4GB VRAM) dengan CPU fallback.
   - Dual-mode endpoints: Sinkron (`/v1/tts`) dan Asinkron Background Job Queue (`/v1/tts/jobs`).
   - Standby High-Definition Neural Engine (Edge-TTS) dengan 8 persona suara studio:
     - 🇮🇩 **Indonesia**: Ardi Natural (`2222`), Ardi Energik (`4444`), Gadis Narasi (`6666`), Gadis Storyteller (`8888`).
     - 🌐 **English & Multilingual**: Andrew Multilingual (`1111`), Emma Audiobook (`3333`), Brian Conversational (`5555`), Ava Storyteller (`7777`).
   - Integrasi 34 Tag Ekspresi Vokal (`[pause]`, `[whisper]`, `[loud]`, `[excited]`, `[laughing]`, dll.) dengan deteksi prosodi otomatis.
   - Zero-shot voice cloning via audio sampel referensi (5–15 detik).
2. **Next.js Gateway Bridge (`/api/tts`)**:
   - Proxy komunikasi dua arah dengan validasi Zod (`TtsSynthesizeSchema`), timeout protection (90s `AbortController`), dan rate limiting 20 req/menit per IP.
3. **Audio Player Studio UI (`AudioPlayerModal`)**:
   - Toolbar 34 tag vokal, slider jeda antar paragraf (0.0s - 3.0s), selector speaker multi-bahasa, live duration counter, dan pemutar audio HTML5.
4. **All-in-One Process Manager (`run.py`, `run.bat`, `run.ps1`)**:
   - Auto-run Next.js web app (3300) dan Fish-Speech backend (8765) secara serentak serta auto-stop bersih saat `Ctrl + C`.

---

## 🏗️ Technical Context

- **Bahasa & Runtime**: Python 3.11/3.12 (Service) + TypeScript 5 / Node.js 18+ (Next.js Gateway)
- **Primary Dependencies Backend**:
  - `fastapi>=0.115.0`, `uvicorn>=0.32.0`, `torch>=2.5.1+cu121`, `torchaudio>=2.5.1`, `soundfile>=0.12.1`, `edge-tts>=6.1.12`, `pydub>=0.25.1`, `numpy>=1.26.0`
- **Primary Dependencies Frontend**:
  - Next.js 16 (App Router), React 19, Tailwind CSS v4, Lucide React, Zod
- **Audio Output Standard**: In-memory WAV 24.000 Hz, 16-bit PCM mono, header standar RIFF/WAVE.
- **Port Layanan**:
  - `8765`: Fish-Speech FastAPI Microservice
  - `3300`: Next.js Web App
- **Testing**:
  - 146 Unit Tests Vitest (`npm run test`)
  - 8 Python Comprehensive Tests (`test_fish_speech_comprehensive.py`)

---

## 🗂️ Project Structure

```text
specs/003-fish-speech-service/
├── spec.md              # Spesifikasi fitur & user stories (completed vs pending)
├── plan.md              # Dokumen arsitektur teknis & implementasi ini
├── tasks.md             # Rincian task pengerjaan yang sudah selesai & backlog pending
├── research.md          # Riset Fish-Speech, dataset X-lord, dan arsitektur vokal
├── data-model.md        # Struktur data payload, schema Zod, dan entities
├── quickstart.md        # Panduan menjalankan, menguji, dan debugging service
├── contracts/
│   └── tts.md           # Kontrak REST API /v1/tts, /v1/tts/jobs, dan /v1/models
└── checklists/
    └── requirements.md  # Checklist kelengkapan dan kualitas spesifikasi

services/fish-speech/
├── main.py              # Server FastAPI utama: TTS sync, async queue, 34 tags parser
├── requirements.txt     # Dependensi Python
├── setup.py             # Setup environment & CUDA installer
├── Dockerfile           # Konfigurasi container Docker
├── .dockerignore
├── data/                # Dataset manifest & sample speaker audio
└── training/            # Pipeline data X-lord Indonesia (download, VQ extract, proto, train)

src/
├── app/api/tts/route.ts # Next.js API Bridge, polling job, & fallback models
├── components/
│   └── audio-player-modal.tsx # UI Studio Modal: 34 tags, delay slider, 8 voices
└── lib/services/agents/
    └── podcaster.ts     # AI Podcaster Agent pembuat naskah dengan 34 tag vokal
```

---

## 🔄 Data Flow: Synchronous & Asynchronous Synthesis

```
[Kreator Konten (Audio Studio Modal)]
         │
         │  1. Request Sintesis (text, voice_seed, paragraph_delay, speed)
         ▼
[Next.js API Bridge: /api/tts]
         │
         ├─► Validasi Zod (1 <= chars <= 10000)
         ├─► Rate Limiting Middleware (20 req/menit)
         │
         ▼
[Fish-Speech Microservice: Port 8765]
         │
         ├─► sanitize_and_parse_script():
         │     - Bersihkan XSS
         │     - Deteksi 34 Vocal Tags & Modulasi Prosodi (whisper, loud, dll.)
         │     - Chunking per kalimat & penyisipan jeda hening
         │
         ├── Mode A: POST /v1/tts (Sinkron)
         │     └─► Inferensi langsung ──► WAV buffer ──► Player Browser
         │
         └── Mode B: POST /v1/tts/jobs (Asinkron Naskah Panjang)
               ├─► Enqueue Job ke Worker Thread Pool
               ├─► Client Polling: GET /v1/tts/jobs/{id}
               └─► Download: GET /v1/tts/jobs/{id}/audio ──► Player Browser
```

---

## 📊 Status Realisasi: Sudah Dikerjakan vs Masih Pending

### A. Sudah Dikerjakan (Completed)
1. **Engine Fish-Speech v1.5**: Terpasang di `services/fish-speech/main.py`.
2. **Dataset Indonesia**: Pipeline data X-lord 16.4 jam di `services/fish-speech/training/`.
3. **Dual API**: Sinkron (`/v1/tts`) dan Asinkron Job Queue (`/v1/tts/jobs`).
4. **8 Persona Suara**: 4 Indonesia (Ardi/Gadis) + 4 English & Multilingual (Andrew/Emma/Brian/Ava).
5. **34 Tag Vokal**: Integrasi penuh di UI, Backend Parser, dan AI Podcaster Agent.
6. **All-in-One Process Manager**: `python run.py` / `npm run dev:all` dengan port cleanup otomatis.
7. **Test Suite**: 146 Vitest tests (100%) dan 8 Python tests (100%).

### B. Masih Pending (Roadmap & Backlog)
1. **[PENDING] Unduh Model Weights Offline Penuh**:
   - Mengunduh checkpoint base `openaudio-s1-mini` & fine-tuned `indonesia-tts-merged` (~1.5GB) ke `services/fish-speech/checkpoints/` untuk inferensi 100% offline di GPU lokal tanpa koneksi cloud.
2. **[PENDING] Colab LoRA Fine-Tuning Notebook**:
   - Notebook interaktif untuk melatih karakter suara pribadi pengguna.
3. **[PENDING] Real-Time Streaming Audio**:
   - Chunked audio transfer streaming via WebSocket untuk preview audio instan.
4. **[PENDING] Multi-Speaker Auto-Dialogue**:
   - Otomatisasi dua narator dalam percakapan skrip podcast bergantian.
