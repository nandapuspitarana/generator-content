# Tasks: Fish-Speech Multilingual & Indonesian Voice Synthesis Microservice

**Branch**: `003-fish-speech-service`  
**Spec**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md)  
**Input**: Design documents from `/specs/003-fish-speech-service/`

---

## 🟢 SUDAH DIKERJAKAN (COMPLETED)

### Phase 1: Foundational Microservice Architecture & API Design
- [X] T001 [P] Inisialisasi struktur microservice terisolasi di `services/fish-speech/` (`requirements.txt`, `setup.py`, `Dockerfile`, `.dockerignore`)
- [X] T002 Implementasi FastAPI server di `services/fish-speech/main.py` dengan endpoint `/v1/health` dan `/v1/models`
- [X] T003 Implementasi parser naskah cerdas (`sanitize_and_parse_script`) dengan proteksi sanitasi XSS dan ekstraksi SSML `<break time="..."/>`
- [X] T004 Implementasi generator seed deterministik dan buffer audio in-memory WAV (24.000 Hz, 16-bit PCM mono)

### Phase 2: Gateway Integration & API Security (Next.js)
- [X] T005 [P] Definisi skema validasi Zod `TtsSynthesizeSchema` di `src/lib/validation/schemas.ts`
- [X] T006 Implementasi Next.js API route bridge di `src/app/api/tts/route.ts` dengan dukungan query model, polling status job, dan unduhan file audio
- [X] T007 Proteksi timeout (90s AbortController) dan penanganan graceful degradation (HTTP 503 / 504)
- [X] T008 Penerapan sliding-window rate limit (20 req/menit per IP) di `src/middleware.ts`
- [X] T009 Konfigurasi environment variables `FISH_SPEECH_ENABLED` dan `FISH_SPEECH_SERVICE_URL` di `.env.example`

### Phase 3: Fish-Speech Upgrade & Fine-Tuning Pipeline
- [X] T010 Migrasi penuh arsitektur dari ChatTTS ke **Fish-Speech v1.5** (Dual-autoregressive multilingual foundation transformer)
- [X] T011 Integrasi pipeline dataset **X-lord/Dataset-Text-To-Speech-Indonesia** (4.531 file, 16.4 jam audio narasi Bahasa Indonesia 24kHz) di `services/fish-speech/training/`
- [X] T012 Konfigurasi akselerasi native NVIDIA CUDA 12.1 (PyTorch FP16) untuk GPU GeForce GTX 1650 (4GB VRAM)
- [X] T013 Implementasi arsitektur dual-mode:
  - **Sinkron** (`POST /v1/tts` / `POST /synthesize`) untuk teks pendek-menengah
  - **Asinkron Background Job Queue** (`POST /v1/tts/jobs`, `GET /v1/tts/jobs/{id}`, `GET /v1/tts/jobs/{id}/audio`) dengan worker thread pool
- [X] T014 Zero-shot voice cloning handler via audio referensi (5–15 detik) untuk menirukan timbre suara kustom

### Phase 4: 34 Vocal Tags & Multilingual Spoken Personas
- [X] T015 Integrasi **34 Tag Ekspresi Vokal & Efek Akustik**:
  - *Jeda & Napas (8)*: `[pause]`, `[short pause]`, `[inhale]`, `[exhale]`, `[sigh]`, `[clearing throat]`, `[panting]`, `[tsk]`
  - *Tawa & Ceria (6)*: `[laughing]`, `[chuckle]`, `[chuckling]`, `[laughing tone]`, `[delight]`, `[audience laughter]`
  - *Dinamika Suara (9)*: `[whisper]`, `[low voice]`, `[low volume]`, `[volume down]`, `[loud]`, `[volume up]`, `[screaming]`, `[shouting]`, `[emphasis]`
  - *Emosi & Mood (11)*: `[excited]`, `[excited tone]`, `[surprised]`, `[shocked]`, `[angry]`, `[sad]`, `[singing]`, `[echo]`, `[interrupting]`, `[moaning]`, `[with strong accent]`
- [X] T016 Parser prosodi backend: konversi otomatis tag jeda ke silence segmen, penyesuaian volume (`-30%` s/d `+30%`), pitch (`-15Hz` s/d `+6Hz`), dan tempo (`rate_bonus` &plusmn;10%), serta pembersihan teks kurung `[tag]`
- [X] T017 Integrasi **8 Persona Suara Studio**:
  - 🇮🇩 **Bahasa Indonesia**: Ardi Natural (2222), Ardi Energik (4444), Gadis Narasi (6666), Gadis Storyteller Deep (8888)
  - 🌐 **English & Multilingual**: Andrew Multilingual (1111), Emma Audiobook (3333), Brian Conversational (5555), Ava Storyteller (7777)
- [X] T018 Dukungan naskah buku campuran (*code-switching*) dan buku full Bahasa Inggris dengan artikulasi native

### Phase 5: UI Audio Studio & Workflow Integration
- [X] T019 Antarmuka modal studio `AudioPlayerModal` di `src/components/audio-player-modal.tsx`:
  - Toolbar interaktif 34 tag vokal dengan 4 kategori tab dan live tag counter
  - Slider jeda antar paragraf (0.0s – 3.0s delay)
  - Selector checkpoint model & pengelompokan speaker (`🇮🇩 Indonesia` & `🌐 English/Multilingual`)
  - Randomizer voice seed (`🎲 Acak`)
  - Input audio referensi zero-shot cloning
  - Pembersih markdown ramah tag vokal
  - Audio playback bar (play/pause, seek, playback rate 0.75x–2.0x, instant `.wav` download)
- [X] T020 Multi-Agent AI Podcaster (`src/lib/services/agents/podcaster.ts`) & LLM Prompt Builder (`src/lib/utils/promptBuilder.ts`) diperbarui untuk menyisipkan 34 tag vokal secara alami dan menjaga ejaan istilah asing

### Phase 6: All-in-One Process Manager & Automated Testing
- [X] T021 Pembuatan All-in-One Process Manager (`run.py`, `run.bat`, `run.ps1`) untuk manajemen lifecycle auto-run & auto-stop port 8765 dan 3300
- [X] T022 Penambahan npm scripts di `package.json` (`npm run dev:all`, `npm run stop`, `npm run status`, `npm run tts:dev`)
- [X] T023 Penulisan suite pengujian menyeluruh:
  - 146/146 unit tests lulus di Vitest (`npm run test`)
  - 8/8 comprehensive test cases lulus di Python backend (`test_fish_speech_comprehensive.py`)
  - 0 TypeScript compiler errors (`npx tsc --noEmit`)

---

## 🟡 MASIH PENDING (ROADMAP & BACKLOG)

### Phase 7: Local Offline Model Weights & Custom Training
- [ ] T024 **[PENDING] Unduh & Caching Bobot Model Lokal Penuh**:
  - Mengunduh checkpoint base `openaudio-s1-mini` (~1.5GB) dan fine-tuned weights `indonesia-tts-merged` langsung ke folder `services/fish-speech/checkpoints/` agar sintesis neural Fish-Speech dapat berjalan 100% offline di mesin lokal tanpa koneksi internet.
- [ ] T025 **[PENDING] Google Colab & Local Training Workflow**:
  - Menyediakan notebook Google Colab interaktif siap pakai untuk melatih bobot LoRA baru menggunakan sampel suara pribadi pengguna sendiri (10–30 menit audio).

### Phase 8: Real-Time Audio Streaming & Advanced Production
- [ ] T026 **[PENDING] Real-Time Audio Streaming via WebSocket / Chunked Transfer**:
  - Mengimplementasikan streaming audio real-time (`Transfer-Encoding: chunked` atau WebSocket stream) sehingga pemutaran audio di browser dapat dimulai dalam 1–2 detik pertama tanpa harus menunggu seluruh paragraf selesai disintesis.
- [ ] T027 **[PENDING] Multi-Speaker Auto-Dialogue (Dua Host Bergantian)**:
  - Kemampuan otomatis mendeteksi dialog bergantian antara dua pembicara (misal Host A = Ardi, Host B = Gadis) dan merender percakapan dua arah dalam satu file audio podcast utuh.
- [ ] T028 **[PENDING] Auto Background Music (BGM) & Sound Effects (SFX) Mixing**:
  - Fitur opsional di Audio Studio untuk menambahkan musik latar (lo-fi / chill podcast BGM) dengan fitur auto-ducking (volume musik mengecil otomatis saat narator sedang berbicara).
