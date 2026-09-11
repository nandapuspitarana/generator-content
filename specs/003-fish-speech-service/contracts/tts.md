# REST API Contracts: Fish-Speech Multilingual & Indonesian Microservice

Dokumentasi kontrak API untuk microservice **Fish-Speech** (`services/fish-speech/main.py`) dan Next.js API Gateway (`src/app/api/tts/route.ts`).

---

## 1. Backend Microservice API (`http://localhost:8765`)

### A. `GET /v1/health` (Health Check)
Mengembalikan status ketersediaan microservice, perangkat komputasi GPU/CPU, dan checkpoint aktif.

* **Method**: `GET`
* **Response 200 OK**:
  ```json
  {
    "status": "ready",
    "service": "fish-speech-microservice",
    "device": "cuda:0 (NVIDIA GeForce GTX 1650)",
    "active_checkpoint": "standby-neural",
    "vocal_tags_count": 34
  }
  ```

---

### B. `GET /v1/models` (Daftar Checkpoint & Persona Suara)
Mengembalikan daftar checkpoint model yang tersedia, 8 persona suara studio, dan 34 tag ekspresi vokal yang didukung.

* **Method**: `GET`
* **Response 200 OK**:
  ```json
  {
    "active_checkpoint": "standby-neural",
    "device": "cuda:0 (NVIDIA GeForce GTX 1650)",
    "checkpoints": [
      {
        "id": "indonesia-lora",
        "name": "Indonesia Fine-Tuned (X-Lord Dataset LoRA)",
        "is_ready": true,
        "recommended": true
      },
      {
        "id": "standby-neural",
        "name": "High-Definition Neural Engine",
        "is_ready": true,
        "recommended": true
      },
      {
        "id": "default",
        "name": "Base Model (Fish-Speech openaudio-s1-mini)",
        "is_ready": false,
        "recommended": false
      }
    ],
    "voices": [
      {
        "seed": 2222,
        "name": "Ardi Natural (Pria)",
        "language": "id",
        "style": "🇮🇩 Casual, Hangat & Percakapan",
        "voice_id": "id-ID-ArdiNeural"
      },
      {
        "seed": 1111,
        "name": "Andrew Multilingual (Pria)",
        "language": "en-multi",
        "style": "🌐 Pelafalan Inggris Fasih & Buku Campuran",
        "voice_id": "en-US-AndrewMultilingualNeural"
      }
    ],
    "supported_vocal_tags": ["[pause]", "[whisper]", "[laughing]", "[excited]", "...(34 tags)"]
  }
  ```

---

### C. `POST /v1/tts` atau `POST /synthesize` (Sintesis Sinkron)
Melakukan sintesis audio instan dari teks percakapan/naskah.

* **Method**: `POST`
* **Headers**: `Content-Type: application/json`
* **Request Body**:
  ```json
  {
    "text": "Halo dunia! [excited] Selamat datang di ulasan buku hari ini. [pause]",
    "voice_seed": 2222,
    "speed": 1.0,
    "paragraph_delay": 1.0,
    "temperature": 0.7,
    "top_p": 0.8,
    "reference_audio": null
  }
  ```
* **Response 200 OK**:
  * `Content-Type`: `audio/wav`
  * `X-TTS-Engine`: `fish-speech`
  * Body: Binary audio WAV 24kHz 16-bit PCM mono.

---

### D. `POST /v1/tts/jobs` (Registrasi Background Job Asinkron)
Mendaftarkan naskah berdurasi panjang ke dalam antrean background worker pool.

* **Method**: `POST`
* **Headers**: `Content-Type: application/json`
* **Request Body**: (Sama dengan payload `TtsRequest`)
* **Response 200 OK**:
  ```json
  {
    "job_id": "8f0a2c91-d8a4-4a25-8e6b-95246a48912c",
    "status": "queued",
    "total_segments": 4,
    "message": "Job successfully queued for background synthesis"
  }
  ```

---

### E. `GET /v1/tts/jobs/{id}` (Polling Status Job)
* **Method**: `GET`
* **Response 200 OK**:
  ```json
  {
    "job_id": "8f0a2c91-d8a4-4a25-8e6b-95246a48912c",
    "status": "processing",
    "progress": {
      "completed_segments": 2,
      "total_segments": 4,
      "percent": 50.0
    }
  }
  ```

---

### F. `GET /v1/tts/jobs/{id}/audio` (Unduh Hasil Audio Job)
* **Method**: `GET`
* **Response 200 OK**: Binary stream `audio/wav` hasil gabungan seluruh segmen naskah.

---

## 2. Next.js Gateway API (`/api/tts`)

Bertindak sebagai reverse proxy yang memvalidasi input via Zod dan memproteksi microservice dari banjir request.

* `GET /api/tts`: Health-check proxy ke microservice
* `GET /api/tts?models=true`: Mengambil daftar model dan 8 karakter suara
* `GET /api/tts?jobId={id}`: Polling status background job
* `GET /api/tts?jobId={id}&audio=true`: Mengambil file WAV hasil background job
* `POST /api/tts`: Mengirim teks untuk disintesis (sinkron atau asinkron)

---

## 3. Kontrak Pending / Roadmap (Future Specification)

### `WS /v1/tts/stream` (WebSocket Audio Streaming) - *[PENDING]*
* **Protocol**: WebSocket (`ws://localhost:8765/v1/tts/stream`)
* **Client Frame**: JSON masukan teks dan voice seed
* **Server Frame**: Binary chunk data WAV PCM per kalimat secara real-time untuk pemutaran audio instan tanpa jeda tunggu.
