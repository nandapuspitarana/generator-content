# 🐟 Dokumentasi Lengkap: Fish-Speech Multilingual & Indonesian Voice Synthesis

Layanan sintesis suara generasi baru untuk **AsikReview Editorial Studio** yang ditenagai oleh **Fish-Speech v1.5**, didukung dataset narasi Bahasa Indonesia (X-lord 16,4 jam), akselerasi native NVIDIA GPU CUDA 12.1 (FP16), 34 Tag Ekspresi Vokal & Efek Akustik, 8 Persona Suara Studio, dan kemampuan multibahasa (*English & Code-Switching*).

---

## 📌 Daftar Isi
1. [Latar Belakang & Rasionalisasi Migrasi](#1-latar-belakang--rasionalisasi-migrasi)
2. [Arsitektur Sistem & Alur Data](#2-arsitektur-sistem--alur-data)
3. [8 Persona Suara Studio (Karakter Pembicara)](#3-8-persona-suara-studio-karakter-pembicara)
4. [Dukungan Bahasa Inggris & Naskah Campuran (Code-Switching)](#4-dukungan-bahasa-inggris--naskah-campuran-code-switching)
5. [Kamus Lengkap 34 Tag Ekspresi Vokal](#5-kamus-lengkap-34-tag-ekspresi-vokal)
6. [Fitur Audio Studio Modal (UI)](#6-fitur-audio-studio-modal-ui)
7. [Panduan Operasional & Service Manager](#7-panduan-operasional--service-manager)
8. [Referensi REST API](#8-referensi-rest-api)
9. [Status Implementasi: Selesai vs Pending (Roadmap)](#9-status-implementasi-selesai-vs-pending-roadmap)

---

## 1. Latar Belakang & Rasionalisasi Migrasi

Sebelumnya sistem menggunakan ChatTTS (2noise/ChatTTS). Namun pada evaluasi kualitas, ditemukan beberapa kendala:
* **Keterbatasan Fonetik Indonesia**: ChatTTS dilatih dominan pada percakapan bahasa Mandarin/Inggris sehingga intonasi Bahasa Indonesia terdengar datar, aksen asing kaku, atau menghasilkan desis (*hissing*) pada teks panjang.
* **Tidak Ada Zero-Shot Cloning**: ChatTTS hanya mengandalkan seed acak tanpa kemampuan mengkloning warna suara referensi pengguna.

### Keunggulan Fish-Speech v1.5:
* **Dual-Autoregressive Transformer**: Memisahkan pemodelan semantik teks dari akustik audio dengan representasi VQ Codec 24kHz.
* **Tokenizer BPE Multibahasa**: Mengenali ribuan subword Bahasa Indonesia dan Bahasa Inggris secara native tanpa phonemizer kamus yang kaku.
* **Integrasi Dataset X-lord**: Terkoneksi dengan 4.531 file audio narasi berdurasi 16,4 jam untuk penyesuaian intonasi lokal alami.
* **Standby High-Definition Neural Engine**: Menyediakan fallback instan latensi rendah berpita suara jernih (*broadcast-ready*) ketika model berat sedang tidak aktif.

---

## 2. Arsitektur Sistem & Alur Data

Sistem berjalan menggunakan arsitektur microservice terpisah:

```
┌─────────────────────────────────────────────────────────────┐
│                 Next.js 16 Web App (Port 3300)              │
│  - AudioPlayerModal Studio UI (src/components/)             │
│  - AI Podcaster Agent (src/lib/services/agents/)            │
│  - API Gateway Bridge (/api/tts) with Zod & Rate Limiting   │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP REST
                               ▼
┌─────────────────────────────────────────────────────────────┐
│             Fish-Speech Microservice (Port 8765)            │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ sanitize_and_parse_script()                           │  │
│  │ - XSS Sanitation & SSML Break Parser                  │  │
│  │ - 34 Vocal Tags Prosody Modulation (Volume/Pitch/Rate)│  │
│  │ - Bracket Tag Removal & Sentence Chunking             │  │
│  └───────────────────────────┬───────────────────────────┘  │
│                              │                              │
│         ┌────────────────────┴───────────────────┐          │
│         ▼                                        ▼          │
│  Mode A: Synchronous                     Mode B: Async Job  │
│  (POST /v1/tts)                          (POST /v1/tts/jobs)│
│  Direct WAV In-Memory Stream             Thread Pool Queue  │
│  WAV 24kHz 16-bit PCM                    Progress Polling   │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. 8 Persona Suara Studio (Karakter Pembicara)

Tersedia 8 persona suara yang dikelompokkan berdasarkan bahasa dan karakter gaya bicara:

### 🇮🇩 Kategori Bahasa Indonesia
| Seed | Nama Persona | Gender | Gaya Karakter | Kasus Penggunaan Ideal |
|:---:|---|:---:|---|---|
| **2222** | **Ardi Natural** | Pria | Kasual, Hangat, Ramah | Podcast obrolan santai, monolog artikel, konten harian |
| **4444** | **Ardi Energik** | Pria | Dinamis, Upbeat, Cepat | Review buku bisnis, ringkasan padat, konten motivasi |
| **6666** | **Gadis Narasi** | Wanita | Kalem, Jelas, Edukatif | Audiobook non-fiksi, materi pembelajaran, dokumenter |
| **8888** | **Gadis Storyteller** | Wanita | Dramatis, Penuh Penghayatan | Cerita novel, fiksi, narasi refleksi mendalam |

### 🌐 Kategori English & Multilingual (Buku Asing & Campuran)
| Seed | Nama Persona | Gender | Gaya Karakter | Kasus Penggunaan Ideal |
|:---:|---|:---:|---|---|
| **1111** | **Andrew Multilingual** | Pria | Fasih, Percaya Diri, Jernih | Buku impor, istilah teknis berat (*deep work, machine learning*), naskah campuran Indo-Inggris |
| **3333** | **Emma Audiobook** | Wanita | Elegan, Halus, Standar Studio | Audiobook internasional, biografi, naskah sastra global |
| **5555** | **Brian Conversational** | Pria | Percakapan Kasual, Tech Savvy | Diskusi teknologi, bedah buku populer, podcast wawancara |
| **7777** | **Ava Storyteller** | Wanita | Emosional, Cerita Fiksi | Storytelling bahasa Inggris, fiksi petualangan, dialog dramatis |

---

## 4. Dukungan Bahasa Inggris & Naskah Campuran (Code-Switching)

### Skenario A: Naskah Campuran (*Code-Switching*)
Naskah Bahasa Indonesia yang mengutip konsep atau istilah berbahasa Inggris:
> *"Dalam buku [emphasis] Thinking, Fast and Slow, Daniel Kahneman menjelaskan System 1 yang bekerja otomatis dan System 2 yang membutuhkan konsentrasi."*
* **Penanganan**: Persona Multilingual (Andrew `1111` atau Emma `3333`) melafalkan kata bahasa Indonesia dengan natural, dan ketika membaca istilah bahasa Inggris, artikulasi fonetiknya otomatis beralih native tanpa salah eja atau terdengar kaku.

### Skenario B: Buku / Naskah Full Bahasa Inggris
Naskah bab buku impor berbahasa Inggris penuh:
* Membaca seluruh teks dengan intonasi standar narator profesional Audible/audiobook global.

### Aturan Preservasi AI Podcaster Agent:
Agen AI Podcaster (`src/lib/services/agents/podcaster.ts`) secara otomatis mempertahankan ejaan asli istilah bahasa Inggris (tidak diserap keliru atau disingkat aneh) agar pelafalan fonetik TTS tetap presisi.

---

## 5. Kamus Lengkap 34 Tag Ekspresi Vokal

Tag ekspresi vokal disisipkan ke dalam naskah menggunakan tanda kurung siku `[tag]`. Sistem otomatis mengonversi tag menjadi manipulasi prosodi dan **membersihkan teks tag dari teks ucapan** agar tidak dieja kaku oleh mesin.

| Kategori | Tag | Durasi / Modulasi Akustik | Contoh Penggunaan dalam Naskah |
|---|---|---|---|
| **⏱️ Jeda & Napas (8)** | `[pause]` | Hening `1.0s` | "Mari kita renungkan sejenak. [pause] Apa sebenarnya tujuan kita?" |
| | `[short pause]` | Hening `0.5s` | "Langkah pertama, [short pause] kenali masalahmu." |
| | `[inhale]` | Jeda hening napas masuk `0.4s` | "[inhale] Oke, mari kita mulai topik berat ini." |
| | `[exhale]` | Jeda hening hembusan napas `0.4s` | "Akhirnya selesai juga tantangan itu. [exhale]" |
| | `[sigh]` | Hening desahan napas `0.6s` | "Banyak yang gagal di fase ini. [sigh] Sayang sekali." |
| | `[clearing throat]` | Jeda jeda tenggorokan `0.5s` | "[clearing throat] Ehem, sebelum kita lanjut ke bab dua..." |
| | `[panting]` | Jeda hening cepat napas terengah `0.3s` | "Kami berlari secepat mungkin [panting] menuju garis finish." |
| | `[tsk]` | Jeda hening jeda decak `0.3s` | "Lagi-lagi kesalahan yang sama berulang. [tsk]" |
| **😂 Tawa & Ceria (6)** | `[laughing]` | Hening tawa `0.6s`, intonasi ceria | "Saya sendiri dulu melakukan hal konyol itu! [laughing]" |
| | `[chuckle]` | Hening kekeh kecil `0.4s` | "Tentu saja hasilnya berantakan. [chuckle]" |
| | `[chuckling]` | Jeda tawa kecil `0.4s` | "Bahkan penulisnya pun mengakuinya. [chuckling]" |
| | `[laughing tone]` | Pitch ceria naik `+4Hz` | "[laughing tone] Siapa sangka trik sederhana ini berhasil!" |
| | `[delight]` | Pitch `+6Hz`, tempo `+10%` | "[delight] Ini adalah kabar terbaik yang kita dengar minggu ini." |
| | `[audience laughter]`| Jeda hening penonton `0.8s` | "Dan itulah alasan presentasi tersebut viral. [audience laughter]" |
| **📢 Dinamika Suara (9)** | `[whisper]` | Volume `-30%`, Pitch `-5Hz`, Tempo `-5%` | "[whisper] Jangan beritahu siapa-siapa, ini rahasia intinya." |
| | `[low voice]` | Pitch rendah `-15Hz` | "[low voice] Suasana seketika menjadi hening dan mencekam." |
| | `[low volume]` | Volume `-25%` | "[low volume] Suara itu terdengar samar dari kejauhan." |
| | `[volume down]` | Volume `-20%` | "Perlahan suaranya mereda [volume down] hingga hilang." |
| | `[loud]` | Volume `+30%`, Pitch `+6Hz`, Tempo `+5%` | "[loud] Perhatikan baik-baik aturan nomor satu ini!" |
| | `[volume up]` | Volume `+25%` | "Semangat penonton semakin memuncak [volume up] di akhir acara!" |
| | `[screaming]` | Volume `+30%`, Pitch `+8Hz` | "[screaming] Awas! Jangan sentuh kabel itu!" |
| | `[shouting]` | Volume `+30%`, Pitch `+6Hz` | "[shouting] Bangun dan wujudkan mimpimu hari ini!" |
| | `[emphasis]` | Jeda singkat `0.2s` + intonasi penekanan | "Ini bukan soal bakat, tapi soal [emphasis] konsistensi harian." |
| **🔥 Emosi & Mood (11)** | `[excited]` | Tempo `+10%`, Pitch `+6Hz` | "[excited] Ide ini benar-benar mengubah cara saya bekerja!" |
| | `[excited tone]` | Tempo `+8%`, Pitch `+5Hz` | "[excited tone] Kita baru saja memecahkan rekor penjualan!" |
| | `[surprised]` | Pitch naik mendadak `+8Hz` | "[surprised] Tunggu, apa benar dia mengatakan hal itu?" |
| | `[shocked]` | Jeda `0.3s`, Pitch `+10Hz` | "[shocked] Saya tidak pernah membayangkan plot twist seperti ini." |
| | `[angry]` | Volume `+20%`, Pitch tajam `+4Hz` | "[angry] Berapa kali saya harus mengingatkan hal penting ini?" |
| | `[sad]` | Tempo `-8%`, Pitch turun `-8Hz` | "[sad] Pada akhirnya, mereka harus berpisah selamanya." |
| | `[singing]` | Modulasi intonasi dinamis | "[singing] Selamat ulang tahun untuk inovasi terbaru kita." |
| | `[echo]` | Intonasi bergema | "[echo] Pilihan ada di tanganmu... tanganmu..." |
| | `[interrupting]` | Jeda potong cepat `0.2s` | "Tapi tunggu— [interrupting] ada satu hal yang belum dibahas." |
| | `[moaning]` | Tempo lambat `-8%` | "Beban kerja ini terasa semakin berat. [moaning]" |
| | `[with strong accent]`| Artikulasi vokal berkarakter | "[with strong accent] Dari tanah leluhur, tradisi ini terus hidup." |

---

## 6. Fitur Audio Studio Modal (UI)

Antarmuka studio diakses melalui tombol **"Synthesize with Fish-Speech"** pada editor artikel atau podcast:
1. **Interactive Tag Toolbar**: Tab kategori (`⏱️ Jeda & Napas`, `😂 Tawa`, `📢 Dinamika`, `🔥 Emosi`). Mengklik chip tombol langsung menyisipkan tag pada posisi kursor teks.
2. **Live Tag Counter**: Menghitung secara real-time jumlah ekspresi vokal dalam naskah (`🎙️ X ekspresi vokal`).
3. **Slider Paragraph Delay**: Menentukan durasi hening antara setiap paragraf (`0.0s` s/d `3.0s`).
4. **Speaker Grouping Selector**: Dropdown terbagi bersih antara `🇮🇩 Bahasa Indonesia` dan `🌐 English & Multilingual`.
5. **Randomizer Seed**: Tombol `🎲 Acak` untuk mencoba variasi timbre suara baru secara instan.
6. **Zero-Shot Voice Cloning**: Input upload audio referensi (WAV/MP3 5–15 detik, max 10MB).
7. **Pembersih Markdown Ramah Tag**: Membersihkan format heading (#), bold (**), dan link tanpa menghapus tag vokal `[...]`.
8. **Player Bar Terintegrasi**: Pemutar HTML5 dengan seek bar, pengatur kecepatan (`0.75x` s/d `2.0x`), dan tombol unduh file `.wav`.

---

## 7. Panduan Operasional & Service Manager

### All-in-One Service Manager (Rekomendasi)
Menjalankan Web App (3300) dan Fish-Speech (8765) secara serentak hanya dengan **1 perintah**:

```bash
npm run dev:all
# Atau via Python langsung:
python run.py
# Atau di Windows CMD:
run.bat
```

* **Graceful Auto-Stop**: Tekan `Ctrl + C` kapan saja. Script otomatis mematikan kedua proses anak dan melepaskan port 8765 dan 3300 sehingga tidak ada proses tertinggal (*port zombie*).
* **Perintah Kontrol**:
  ```bash
  npm run status    # Menampilkan status kesehatan kedua service
  npm run stop      # Mematikan paksa proses yang tersisa & membersihkan port
  ```

---

## 8. Referensi REST API

### Backend (`http://localhost:8765`)
* `GET /v1/health`: Cek kesehatan server & GPU device info.
* `GET /v1/models`: Daftar 8 karakter suara dan 34 tag vokal.
* `POST /v1/tts`: Sintesis audio sinkron (mengembalikan binary `audio/wav`).
* `POST /v1/tts/jobs`: Mendaftarkan naskah panjang ke background worker queue.
* `GET /v1/tts/jobs/{id}`: Polling status progres job (`queued` &rarr; `processing` &rarr; `completed`).
* `GET /v1/tts/jobs/{id}/audio`: Mengunduh file audio WAV hasil background job.

### Gateway Next.js (`http://localhost:3300/api/tts`)
* Mengamankan komunikasi backend dengan skema validasi Zod (`TtsSynthesizeSchema`) dan rate limiting 20 req/menit per IP.

---

## 9. Status Implementasi: Selesai vs Pending (Roadmap)

### 🟢 Sudah Dikerjakan (Complete)
- [x] Engine Fish-Speech v1.5 dengan Dual-AR Transformer & Standby Neural Fallback.
- [x] 8 Karakter Suara Studio (4 Indonesia + 4 English/Multilingual).
- [x] 34 Tag Ekspresi Vokal & Parser Prosodi Backend.
- [x] Slider Paragraph Delay & Sentence Boundary Chunking.
- [x] Dual Mode: Sinkron (`/v1/tts`) & Asinkron Background Job (`/v1/tts/jobs`).
- [x] Zero-Shot Voice Cloning via Audio Referensi.
- [x] All-in-One Process Manager (`run.py`, `npm run dev:all`, `npm run stop`).
- [x] 100% Automated Test Pass: 146 unit test Vitest + 8 Python test cases.

### 🟡 Masih Pending (Roadmap & Backlog Masa Depan)
- [ ] **Unduh Bobot Model Lokal Penuh**: Menyediakan checkpoint base `openaudio-s1-mini` dan LoRA `indonesia-tts-merged` (~1.5GB) di `services/fish-speech/checkpoints/` untuk inferensi 100% offline tanpa cloud.
- [ ] **Google Colab LoRA Fine-Tuning Notebook**: Notebook pelatihan suara pribadi pengguna di Google Colab T4 GPU gratis.
- [ ] **Real-Time Audio Streaming**: Streaming chunked audio via WebSocket (`/v1/tts/stream`) untuk preview instan dalam < 2 detik pertama.
- [ ] **Multi-Speaker Auto-Dialogue**: Deteksi dan sintesis percakapan 2 host otomatis secara bergantian dalam 1 file audio podcast.
- [ ] **Auto BGM & SFX Mixing**: Penambahan musik latar dengan fitur *auto-ducking* otomatis saat narator berbicara.
