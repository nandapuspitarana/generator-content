# Feature Specification: ChatTTS Generative Speech Microservice & Studio

**Feature Branch**: `003-chattts-service`  
**Created**: 2026-09-09  
**Status**: Ready / Implemented  
**Input**: User description: "Implementasi ChatTTS (https://github.com/2noise/ChatTTS) sebagai separated service terisolasi dalam Docker container, Next.js API bridge aman di /api/tts, skema validasi Zod, rate limiting, dan antarmuka Audio Player Studio pada AsikReview Editorial Studio."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Sintesis Suara Percakapan dari Naskah Podcast (Priority: P1) 🎯 MVP

Sebagai seorang podcaster atau kreator konten buku di AsikReview, saya ingin mengonversi naskah podcast (atau teks artikel ulasan) menjadi rekaman suara alami (.wav) secara langsung dari studio editor menggunakan model AI **ChatTTS**, sehingga saya tidak perlu repot menyalin teks ke software pihak ketiga atau merekam suara secara manual.

**Why this priority**: Menutup alur produksi konten menyeluruh (End-to-End Content Pipeline) dari ideasi, penulisan artikel, generasi script podcast SSML, hingga audio suara siap dengar.

**Independent Test**: Buka artikel atau naskah podcast di studio editor, klik tombol "Synthesize with ChatTTS", tunggu proses inferensi selesai (~10-25s), dan dengarkan audio yang terputar otomatis di player browser.

**Acceptance Scenarios**:
1. **Given** Naskah podcast tersedia di editor dengan panjang 100–3000 karakter, **When** Pengguna mengklik tombol "Synthesize with ChatTTS", **Then** Modal studio terbuka dengan teks yang terisi otomatis, request dikirim ke `/api/tts`, dan setelah inferensi selesai audio player memutar file `.wav` berkualitas 24.000 Hz.
2. **Given** Naskah mengandung tag jeda SSML seperti `<break time="1s"/>`, **When** Diproses oleh ChatTTS microservice, **Then** Tag jeda diterjemahkan menjadi token jeda natural ChatTTS `[break_4]` tanpa suara desis atau error sintaks.

---

### User Story 2 - Kustomisasi Karakter Suara & Unduh File WAV (Priority: P2)

Sebagai seorang audio producer, saya ingin memilih preset pembicara (Speaker Voice Seed) dan mengatur kecepatan pembacaan (*speed rate*), serta mengunduh hasil audio WAV langsung ke perangkat saya untuk kebutuhan editing lanjutan atau distribusi platform podcast.

**Why this priority**: Menghindari suara yang monoton dengan memberikan opsi persona host (Host Natural, Host Energik, Host Kalem, Host Storyteller) dan fleksibilitas kecepatan berbicara.

**Independent Test**: Pilih preset seed suara berbeda (misal: "Host Storyteller" - Seed 8888), ubah slider kecepatan ke 1.2x, tekan synthesize, lalu klik tombol "Download .WAV" untuk memverifikasi file terunduh dengan benar.

**Acceptance Scenarios**:
1. **Given** Pengguna memilih preset speaker seed dan speed multiplier (0.7x - 1.4x), **When** Tombol sintesis ditekan, **Then** Payload request menyertakan `voice_seed` dan `speed`, menghasilkan karakter suara dan tempo yang konsisten sesuai pilihan.
2. **Given** File audio telah berhasil disintesis, **When** Pengguna mengklik tombol "Download .WAV", **Then** Browser mengunduh file biner audio WAV dengan nama file `chattts-podcast.wav`.

---

### User Story 3 - Health Check & Resilient Graceful Degradation (Priority: P3)

Sebagai pengelola sistem (Admin/Developer), saya ingin Next.js app tetap berjalan stabil dan memberikan pesan error ramah jika container ChatTTS sedang offline atau tidak aktif, tanpa membekukan halaman editor atau memicu unhandled rejection.

**Why this priority**: Menjamin ketahanan sistem (high availability) karena inferensi AI lokal berbasis model PyTorch memerlukan resource memori dan GPU/CPU yang intensif.

**Independent Test**: Matikan container ChatTTS (`docker compose stop chattts`), buka studio audio dan klik synthesize, verifikasi pesan status error 503 muncul dengan jelas di layar pengguna.

**Acceptance Scenarios**:
1. **Given** Service ChatTTS dimatikan, **When** Client memanggil `GET /api/tts`, **Then** Endpoint mengembalikan HTTP 503 dengan status `"unreachable"` dan pesan informatif.
2. **Given** Feature flag `CHATTTS_ENABLED=false` diatur di konfigurasi lingkungan, **When** Request sintesis dikirim ke `/api/tts`, **Then** Server langsung mengembalikan HTTP 503 "ChatTTS service is currently disabled in system settings" tanpa membuang waktu koneksi socket.

---

### Edge Cases

- **Teks Kosong atau Spasi Saja**: Jika pengguna mengirimkan teks kosong, Zod schema memvalidasi dan mengembalikan HTTP 400 "Teks untuk disintesis wajib diisi".
- **Teks Terlalu Panjang (>5000 karakter)**: Ditolak dengan HTTP 400 untuk mencegah Out-Of-Memory (OOM) pada inferensi PyTorch CPU.
- **Inferensi Timeout (>90 detik)**: `AbortController` di level Next.js bridge membatalkan koneksi dan mengembalikan HTTP 504 Gateway Timeout secara elegan.
- **Model HuggingFace Belum Terunduh**: Container menyediakan fallback sinyal nada diagnostik sehingga proses pengujian lingkungan development tidak crash.
- **Banjir Request (DDoS/Spam)**: Sliding-window rate limiter di `src/middleware.ts` membatasi request ke `/api/tts` maksimal 20 req/menit per IP, mengembalikan HTTP 429 dengan header `Retry-After`.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Sistem MUST menyediakan **Python 3.11 FastAPI microservice** mandiri di direktori `services/chattts/` yang terisolasi dari runtime Node.js.
- **FR-002**: Microservice ChatTTS MUST mengekspos endpoint `POST /synthesize` yang menerima JSON (`text`, `voice_seed`, `speed`, `temperature`, `top_P`, `top_K`) dan mengembalikan biner `audio/wav` 24.000 Hz 16-bit PCM.
- **FR-003**: Microservice ChatTTS MUST mengekspos endpoint `GET /health` untuk pemantauan ketersediaan container dan status model weights.
- **FR-004**: Sistem MUST menyertakan konfigurasi Docker Compose untuk menjalankan service `chattts` di port 8765 bersama volume persistent `chattts_cache` untuk model weights.
- **FR-005**: Next.js App MUST menyediakan bridge API route di `src/app/api/tts/route.ts` yang memverifikasi input via Zod schema `TtsSynthesizeSchema`.
- **FR-006**: Next.js App MUST menerapkan rate limiting di `src/middleware.ts` untuk membatasi pemanggilan API TTS maksimal 20 req/menit per IP.
- **FR-007**: Microservice MUST melakukan pembersihan teks otomatis (preprocessing) untuk mengonversi tag SSML seperti `<break time="..."/>` menjadi pause token lisan ChatTTS `[break_4]`.
- **FR-008**: Editor artikel dan podcast MUST menyediakan komponen UI modal `AudioPlayerModal` yang interaktif dengan pilihan preset seed suara, slider kecepatan, audio player browser, dan tombol download WAV.

### Key Entities

- **Synthesize Request**: Objek payload masukan (`text`, `voice_seed`, `speed`, `temperature`, `top_P`, `top_K`).
- **Audio Sample Buffer**: Biner stream format WAV 24kHz dengan header standard RIFF PCM 16-bit.
- **Voice Preset**: Konfigurasi seed suara integer (misal: 2222 untuk Host Natural, 8888 untuk Storyteller) yang menghasilkan embedding pembicara konsisten pada ChatTTS.
- **TTS Service Health**: Objek status operasional (`status`, `service`, `model_loaded`).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Waktu respon health-check `GET /api/tts` berada di bawah 100ms ketika container aktif.
- **SC-002**: Sintesis naskah 500 kata menghasilkan stream audio WAV yang valid dan dapat langsung diputar di browser web tanpa artefak audio terpotong.
- **SC-003**: 100% skenario pengujian unit otomatis pada `tests/unit/tts-api.test.ts` (14 pengujian) lulus verifikasi tanpa error.
- **SC-004**: Tidak ada kebocoran memori pada container ChatTTS berkat arsitektur pemanggilan model in-memory tanpa persistensi file sementara di disk.
- **SC-005**: Sistem Next.js tetap 100% beroperasi normal meskipun container ChatTTS dimatikan atau mengalami gangguan koneksi.

## Assumptions

- **A-001**: Penggunaan model 2noise/ChatTTS ditujukan untuk kepentingan riset dan edukasi sesuai lisensi `CC BY-NC 4.0`.
- **A-002**: Lingkungan host menyediakan minimal RAM 4GB untuk inferensi CPU model ChatTTS.
- **A-003**: Model weights otomatis di-cache di volume Docker `chattts_cache` sehingga pengunduhan dari HuggingFace hanya terjadi satu kali di awal.
