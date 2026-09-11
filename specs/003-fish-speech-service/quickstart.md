# Quickstart Guide: Fish-Speech Multilingual & Indonesian Voice Synthesis Microservice

Panduan langkah-demi-langkah untuk menjalankan, memverifikasi, dan menguji microservice **Fish-Speech** bersama aplikasi editorial Next.js AsikReview.

---

## 1. Prasyarat Sistem

- **Python 3.11 atau 3.12** terinstal di sistem host.
- **Node.js 18+** & **npm** terinstal.
- **NVIDIA GPU dengan CUDA 12.1** *(Opsional, direkomendasikan GTX 1650 4GB atau lebih tinggi untuk akselerasi FP16; sistem otomatis fallback ke CPU/Neural Engine jika GPU tidak tersedia)*.

---

## 2. Cara Menjalankan Aplikasi & Microservice

### Opsi A: All-in-One Service Manager (Sangat Direkomendasikan) 🚀
Jalankan seluruh stack (Frontend Next.js port 3300 + Fish-Speech Backend port 8765) dengan **1 perintah**:

```bash
# Dari root proyek:
npm run dev:all
# Atau via Python:
python run.py
# Atau di Windows CMD:
run.bat
```

* **Auto-Stop**: Tekan `Ctrl + C` kapan saja. Sistem secara otomatis mematikan kedua proses dan membersihkan port 8765 & 3300 tanpa ada port yang tersangkut (*zombie process*).
* **Perintah Kontrol**:
  ```bash
  npm run status   # Cek kesehatan kedua layanan
  npm run stop     # Hentikan paksa semua proses & bebaskan port
  ```

---

### Opsi B: Menjalankan Fish-Speech Backend Saja

```bash
npm run tts:dev
# Atau:
python services/fish-speech/main.py
```
*Service aktif di `http://localhost:8765`.*

---

### Opsi C: Menjalankan via Docker Compose

```bash
docker compose up fish-speech -d
```

---

## 3. Verifikasi & Pengujian API via Terminal (cURL / Python)

### A. Health Check & Status Model
```bash
curl http://localhost:8765/v1/health
```
**Respons:**
```json
{
  "status": "ready",
  "service": "fish-speech-microservice",
  "device": "cuda:0 (NVIDIA GeForce GTX 1650)",
  "active_checkpoint": "openaudio-s1-mini (Base Multilingual)",
  "vocal_tags_count": 34
}
```

### B. Daftar Karakter Suara & Checkpoint (`/v1/models`)
```bash
curl http://localhost:8765/v1/models
```
*Menampilkan 8 karakter suara (4 Indonesia + 4 English & Multilingual).*

### C. Pengujian Sintesis Sinkron (`POST /v1/tts`)
```bash
curl -X POST http://localhost:8765/v1/tts \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Halo! [excited] Selamat datang di podcast AsikReview. [pause] Hari ini kita membahas buku Thinking, Fast and Slow.",
    "voice_seed": 2222,
    "speed": 1.0,
    "paragraph_delay": 1.0
  }' \
  --output test_podcast.wav
```

### D. Pengujian Sintesis Multilingual (English / Code-Switching)
```bash
curl -X POST http://localhost:8765/v1/tts \
  -H "Content-Type: application/json" \
  -d '{
    "text": "In chapter one of Thinking, Fast and Slow, we explore cognitive biases. [pause] Daniel Kahneman membedakan dua sistem berpikir manusia.",
    "voice_seed": 1111,
    "speed": 1.0
  }' \
  --output test_english.wav
```

### E. Pengujian Asinkron Background Job Queue (`POST /v1/tts/jobs`)
```bash
# 1. Daftarkan job:
curl -X POST http://localhost:8765/v1/tts/jobs \
  -H "Content-Type: application/json" \
  -d '{"text": "Paragraf satu naskah panjang. [pause]\n\nParagraf dua naskah panjang.", "voice_seed": 4444}'
# Respons: {"job_id": "abc-123", "status": "queued"}

# 2. Cek status:
curl http://localhost:8765/v1/tts/jobs/abc-123
# Respons: {"status": "completed", "progress_pct": 100}

# 3. Unduh audio WAV hasil:
curl http://localhost:8765/v1/tts/jobs/abc-123/audio --output podcast_job.wav
```

---

## 4. Menjalankan Automated Test Suite

```bash
# 1. Vitest Unit Test Suite (Next.js, Gateway, Rate Limiter, UI):
npm run test

# 2. Comprehensive Fish-Speech Python Test Suite (FastAPI, 34 Tags, Job Queue, Multilingual):
python C:\Users\nanda\.gemini\antigravity-ide\brain\6825d1c3-cb29-4151-9b8e-0bf4174800b3\scratch\test_fish_speech_comprehensive.py

# 3. TypeScript Type-Checking:
npx tsc --noEmit
```

---

## 5. Status Fitur: Sudah Dikerjakan vs Masih Pending

### ✅ Sudah Dikerjakan (Ready to Use)
1. **Engine Fish-Speech v1.5** di port 8765 dengan fallback Standby Neural Engine.
2. **8 Persona Suara**: 4 Indonesia (Ardi Natural, Ardi Energik, Gadis Narasi, Gadis Storyteller) + 4 English & Multilingual (Andrew, Emma, Brian, Ava).
3. **34 Tag Ekspresi Vokal** (`[pause]`, `[whisper]`, `[loud]`, `[excited]`, `[laughing]`, dll.) dengan deteksi prosodi otomatis.
4. **Slider Paragraph Delay** (0.0s - 3.0s) di Audio Studio modal.
5. **Zero-shot Voice Cloning** via upload file referensi 5–15 detik.
6. **Dual API**: Sinkron & Asinkron Background Job Queue dengan worker thread pool.
7. **All-in-One Process Manager**: `npm run dev:all`, `npm run stop`, `npm run status`.
8. **100% Test Coverage**: 146 unit test Vitest + 8 pengujian backend Python.

### 🟡 Masih Pending (Roadmap & Backlog)
1. **[PENDING] Unduh Model Weights Penuh Offline**:
   - Menyediakan unduhan bobot base `openaudio-s1-mini` dan checkpoint `indonesia-tts-merged` (~1.5GB) ke folder `checkpoints/` untuk inferensi 100% offline tanpa cloud.
2. **[PENDING] Google Colab LoRA Fine-Tuning Notebook**:
   - Notebook interaktif untuk melatih dataset suara pengguna sendiri di Google Colab GPU T4 gratis.
3. **[PENDING] Real-Time Streaming Audio**:
   - Output audio chunked streaming via WebSocket/HTTP transfer encoding.
4. **[PENDING] Multi-speaker Auto-Dialogue**:
   - Sintesis otomatis naskah percakapan 2 host secara bergantian dalam 1 file WAV.
