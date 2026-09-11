# Feature Specification: Fish-Speech Multilingual & Indonesian Voice Synthesis Microservice & Studio

**Feature Branch**: `003-fish-speech-service`  
**Created**: 2026-09-09 | **Updated**: 2026-09-11  
**Status**: Active / Core Implemented (Pending: Offline Local Weights, Streaming & Multi-speaker)  
**Input**: Integrasi sistem suara generatif percakapan multi-bahasa & Bahasa Indonesia menggunakan **Fish-Speech v1.5** (`services/fish-speech/`) yang menggantikan ChatTTS, didukung dataset X-lord Indonesia (16.4 jam), akselerasi NVIDIA GTX 1650 FP16, 34 Tag Ekspresi Vokal, Standby Multilingual Neural Engine, dan Audio Player Studio.

---

## 🎯 Ringkasan & Status Implementasi

| Area Fitur | Status | Realisasi Saat Ini |
|---|---|---|
| **Engine Arsitektur** | ✅ Selesai | Fish-Speech v1.5 berbasis Dual-Autoregressive Transformer + Standby Neural Engine di port 8765 |
| **Dukungan Bahasa** | ✅ Selesai | Bahasa Indonesia (Native ID) + English & Multilingual (Buku Asing & *Code-Switching*) |
| **Persona Suara** | ✅ Selesai | 8 Karakter Suara Studio (4 Indonesia: Ardi/Gadis + 4 Multilingual: Andrew/Emma/Brian/Ava) |
| **Ekspresi Vokal & Tag** | ✅ Selesai | 34 Tag Ekspresi Vokal (`[pause]`, `[whisper]`, `[laughing]`, `[excited]`, dll.) terintegrasi end-to-end |
| **API Endpoints** | ✅ Selesai | Sinkron (`POST /v1/tts`) & Asinkron Background Job Queue (`POST /v1/tts/jobs`, polling status, download) |
| **Hardware Acceleration**| ✅ Selesai | Deteksi otomatis NVIDIA GPU CUDA 12.1 FP16 (GeForce GTX 1650 4GB VRAM) / CPU fallback |
| **Dataset Fine-Tuning** | ✅ Selesai | Pipeline dataset X-lord Indonesia (4.531 file WAV, 16.4 jam audio) di `services/fish-speech/training/` |
| **Process Manager** | ✅ Selesai | Script all-in-one auto-run & auto-stop (`python run.py`, `npm run dev:all`, `npm run stop`) |
| **Offline Local Weights** | 🟡 Pending | Unduh bobot checkpoint lokal (`openaudio-s1-mini` & `indonesia-tts-merged`) ke folder `checkpoints/` |
| **Realtime Streaming** | 🟡 Pending | Streaming audio via WebSocket / HTTP Chunked Transfer Encoding untuk preview instan |
| **Multi-Speaker Dialogue** | 🟡 Pending | Sintesis percakapan 2 host bergantian otomatis dalam 1 file audio utuh |

---

## 👥 User Scenarios & Acceptance Criteria

### User Story 1 - Sintesis Suara Percakapan & Narasi Buku (Priority: P1) 🎯 MVP
Sebagai kreator konten podcast dan ulasan buku di AsikReview, saya ingin mengonversi naskah podcast (atau teks artikel ulasan) menjadi rekaman suara alami (.wav) secara langsung dari studio editor menggunakan model AI **Fish-Speech**, baik untuk naskah Bahasa Indonesia murni, naskah campuran istilah Inggris, maupun buku full Bahasa Inggris.

**Acceptance Scenarios**:
1. **Given** Naskah podcast tersedia di editor dengan panjang 100–5000 karakter, **When** Pengguna membuka Audio Studio dan menekan tombol sintesis, **Then** Request dikirim ke `/api/tts`, dan setelah inferensi selesai audio player memutar file `.wav` berkualitas 24.000 Hz.
2. **Given** Naskah mengandung istilah bahasa Inggris (*"Thinking, Fast and Slow"*, *"System 1 & 2"*), **When** Pengguna memilih persona Multilingual (Andrew atau Emma), **Then** Pelafalan istilah Inggris terdengar fasih dengan artikulasi native tanpa aksen kaku.

---

### User Story 2 - Kontrol Ekspresi Vokal 34 Tags & Jeda Paragraf (Priority: P2)
Sebagai audio producer, saya ingin menyisipkan tag ekspresi vokal (tawa, bisikan, nada antusias, jeda napas) dan mengatur delay jeda antar paragraf agar intonasi audio terdengar hidup seperti pembicara manusia asli.

**Acceptance Scenarios**:
1. **Given** Naskah memiliki tag `[whisper]`, `[excited]`, atau `[pause]`, **When** Diproses oleh backend Fish-Speech, **Then** Backend memodulasi volume (`-30%`), pitch, dan tempo bicara secara otomatis, serta membersihkan teks tanda kurung siku `[tag]` agar tidak dieja kaku.
2. **Given** Pengguna mengatur slider *Paragraph Delay* ke `1.5s`, **When** Sintesis dijalankan, **Then** Terdapat jeda hening alami 1.5 detik di antara setiap pergantian paragraf.

---

### User Story 3 - Asynchronous Background Jobs untuk Naskah Panjang (Priority: P3)
Sebagai podcaster yang memproduksi naskah episode panjang (di atas 1500 kata), saya ingin proses sintesis berjalan di latar belakang (background queue) sehingga antarmuka tidak membeku dan progres dapat dipantau secara real-time.

**Acceptance Scenarios**:
1. **Given** Naskah berdurasi panjang, **When** Dikirim ke endpoint `/v1/tts/jobs`, **Then** Server segera mengembalikan `job_id` dengan status `"queued"`.
2. **Given** Job sedang diproses worker thread pool, **When** Client melakukan polling ke `GET /v1/tts/jobs/{id}`, **Then** Server mengembalikan status `"processing"` beserta persentase progres segmen, lalu `"completed"` saat selesai.
3. **Given** Job berstatus `"completed"`, **When** Client memanggil `GET /v1/tts/jobs/{id}/audio`, **Then** Audio utuh format WAV berhasil diunduh.

---

### User Story 4 - Zero-Shot Voice Cloning (Priority: P4)
Sebagai pengisi suara, saya ingin mengunggah audio sampel suara referensi (5–15 detik) agar Fish-Speech menirukan timbre suara tersebut untuk membacakan naskah.

**Acceptance Scenarios**:
1. **Given** Pengguna mengunggah rekaman suara WAV/MP3 5–15 detik, **When** Sintesis dieksekusi dengan model Fish-Speech, **Then** Timbre audio output mengadopsi karakteristik suara dari audio referensi.

---

## ⚙️ Functional Requirements

### Core Backend (`services/fish-speech/`)
- **FR-001**: Microservice mandiri berbasis **Python FastAPI** di port 8765 yang mengekspos:
  - `GET /v1/health` & `GET /health` (status server, GPU device info, active checkpoint)
  - `GET /v1/models` & `GET /models` (daftar checkpoint, 8 persona suara, supported tags)
  - `POST /v1/tts` & `POST /synthesize` (sintesis audio sinkron dengan chunking kalimat)
  - `POST /v1/tts/jobs` (pendaftaran task asinkron latar belakang)
  - `GET /v1/tts/jobs/{id}` (polling status progres job)
  - `GET /v1/tts/jobs/{id}/audio` (pengambilan binary stream WAV job)
- **FR-002**: Mendukung 8 Voice Seeds:
  - `2222`: Ardi Natural (Pria, Indonesia)
  - `4444`: Ardi Energik (Pria, Indonesia)
  - `6666`: Gadis Narasi (Wanita, Indonesia)
  - `8888`: Gadis Storyteller Deep (Wanita, Indonesia)
  - `1111`: Andrew Multilingual (Pria, English & Multilingual)
  - `3333`: Emma Audiobook (Wanita, English & Multilingual)
  - `5555`: Brian Conversational (Pria, English & Multilingual)
  - `7777`: Ava Storyteller (Wanita, English & Multilingual)
- **FR-003**: Sanitasi naskah otomatis (`sanitize_and_parse_script`) untuk membuang tag XSS berbahaya, mengonversi jeda ke SSML break, dan menghapus penulisan kurung siku 34 tag vokal sebelum pembacaan.

### Frontend Studio & Gateway (`src/`)
- **FR-004**: Route handler `src/app/api/tts/route.ts` bertindak sebagai reverse proxy yang memvalidasi input via Zod `TtsSynthesizeSchema` dan rate limiting 20 req/menit di `src/middleware.ts`.
- **FR-005**: Komponen `AudioPlayerModal` di `src/components/audio-player-modal.tsx` menyediakan antarmuka studio lengkap: toolbar 34 tag, slider delay, selector model & speaker grouping, randomizer seed, zero-shot upload, audio player bar, dan tombol download WAV.

---

## 📈 Success Criteria & Verifikasi

- **SC-001**: Health check `GET /api/tts` merespons < 100ms.
- **SC-002**: Sintesis audio menghasilkan format WAV 24.000 Hz 16-bit PCM valid dengan header RIFF/WAVE.
- **SC-003**: 100% tes unit Vitest lulus (`146 / 146 tests passed`).
- **SC-004**: 100% tes komprehensif Python backend lulus (`8 / 8 test cases passed`).
- **SC-005**: 0 error pada TypeScript compiler (`npx tsc --noEmit`).
- **SC-006**: Toleransi kegagalan graceful: jika service Python mati, Next.js menampilkan pesan status HTTP 503 informatif tanpa crash.

---

## 🚧 Status Pending & Rencana Lanjutan (Future Work)

1. **[PENDING] Unduh Model Weights Offline**:
   - Skrip downloader otomatis untuk bobot base `openaudio-s1-mini` dan checkpoint `indonesia-tts-merged` ke direktori lokal `services/fish-speech/checkpoints/` untuk inferensi offline tanpa cloud fallback.
2. **[PENDING] Fine-Tuning LoRA Suara Kustom**:
   - Dokumentasi & notebook pelatihan LoRA suara pengguna (dataset pribadi) menggunakan Colab T4 GPU gratis.
3. **[PENDING] Real-time Streaming**:
   - Output audio chunked streaming agar audio dapat didengarkan secara instan tanpa menunggu seluruh file selesai.
4. **[PENDING] Multi-speaker Auto-Dialogue**:
   - Dukungan skrip dua narator/host podcast (Host A dan Host B) secara bergantian dalam satu output audio.
