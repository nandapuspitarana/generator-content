# Quickstart Guide: ChatTTS Generative Speech Service

Panduan langkah-demi-langkah untuk menjalankan, memverifikasi, dan menguji microservice **ChatTTS** bersama aplikasi AsikReview CMS.

---

## 1. Prasyarat

- **Python 3.11 atau 3.12** terinstal di sistem host (untuk mode direct script).
- **Docker & Docker Compose** (opsional, jika ingin menjalankan via container).
- **Node.js 18+** & **npm** terinstal.
- RAM minimal 4GB tersedia.

---

## 2. Cara Menjalankan ChatTTS

Anda dapat memilih salah satu dari dua cara berikut:

### Opsi A: Menjalankan via Python Script Langsung (Sangat Direkomendasikan untuk Debugging & Dev)

Menjalankan script Python secara langsung memberikan keuntungan:
- **Live console output & breakpoints**: Mudah melihat log proses inferensi dan men-debug error secara instan.
- **Dukungan native GPU host**: Jika laptop/PC Anda memiliki kartu grafis NVIDIA (CUDA), PyTorch akan langsung memanfaatkannya secara otomatis tanpa konfigurasi rumit Docker WSL2.
- **Tanpa overhead RAM container Docker**.

#### Langkah-langkah:
1. Masuk ke direktori service:
   ```bash
   cd services/chattts
   ```
2. Buat virtual environment (opsional tapi disarankan):
   ```bash
   python -m venv venv
   # Di Windows Command Prompt:
   venv\Scripts\activate
   # Atau di PowerShell:
   .\venv\Scripts\Activate.ps1
   ```
3. Instal dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Jalankan service:
   ```bash
   python main.py
   # Atau dari root proyek via npm:
   npm run chattts:dev
   ```
   *Service akan aktif di `http://localhost:8765`.*

---

### Opsi B: Debugging Langsung via CLI (Tanpa Perlu Menjalankan Server)

Jika Anda ingin menguji kualitas audio, parameter seed suara, atau mengetes inferensi kalimat tertentu secara cepat di terminal tanpa membuka browser:

```bash
# Uji teks default:
python services/chattts/cli_debug.py "Halo, ini pengujian suara ChatTTS langsung via CLI debugger."

# Uji dengan seed karakter suara dan output file custom:
python services/chattts/cli_debug.py "Halo kawan! Selamat datang kembali." --seed 8888 --out test_storyteller.wav
```

---

### Opsi C: Menjalankan via Docker Compose (Isolated Container)

Cocok untuk pengujian staging atau environment deployment:

```bash
docker compose up chattts -d
```

Periksa status container:
```bash
docker compose ps chattts
```

Lihat log inisialisasi model:
```bash
docker compose logs -f chattts
```
*Catatan: Pada startup pertama kali, model weights ChatTTS (~2GB) akan diunduh dari HuggingFace dan disimpan di volume persistent `chattts_cache` atau direktori cache host `~/.cache/huggingface`.*


---

## 3. Verifikasi Health Endpoint

Cek apakah microservice sudah siap menerima permintaan:

```bash
curl http://localhost:8765/health
```

Output sukses:
```json
{"status":"healthy","service":"chattts-microservice","model_loaded":true}
```

Cek bridge API Next.js:
```bash
curl http://localhost:3300/api/tts
```

---

## 4. Menguji Sintesis Suara via cURL

Kirim request sintesis langsung ke Next.js API bridge:

```bash
curl -X POST http://localhost:3300/api/tts \
  -H "Content-Type: application/json" \
  -d '{"text": "Halo, ini adalah pengujian suara otomatis menggunakan model ChatTTS di AsikReview.", "voice_seed": 2222, "speed": 1.0}' \
  --output test-speech.wav
```

File `test-speech.wav` akan tersimpan di direktori Anda dan dapat langsung diputar dengan media player (VLC, Windows Media Player, QuickTime).

---

## 5. Menggunakan UI Audio Studio di Editor

1. Jalankan Next.js development server:
   ```bash
   npm run dev
   ```
2. Buka [http://localhost:3300/dashboard/articles](http://localhost:3300/dashboard/articles) dan buka salah satu cerita/artikel yang sudah memiliki isi.
3. Di panel sidebar kanan, perhatikan kartu **"ChatTTS Audio Synthesizer"**.
4. Klik tombol **"Synthesize with ChatTTS"**.
5. Modal studio akan terbuka dengan naskah artikel Anda. Anda dapat memilih preset suara (Natural, Energik, Kalem, Storyteller) dan mengatur kecepatan.
6. Klik **"Synthesize with ChatTTS"** dan dengarkan hasil audio di player browser atau klik **"Download .WAV"**.

---

## 6. Menjalankan Automated Unit Tests

Jalankan pengujian unit otomatis untuk endpoint `/api/tts` dan validasi Zod:

```bash
npm run test -- tests/unit/tts-api.test.ts
```

Output yang diharapkan: **14 passing tests (100%)**.

---

## 7. Troubleshooting

- **Port 8765 Konflik**: Jika port 8765 sudah digunakan oleh aplikasi lain, ubah mapping port di `docker-compose.yml` (misal `"8766:8765"`) dan perbarui `CHATTTS_SERVICE_URL="http://localhost:8766"` di file `.env`.
- **Inferensi Lambat di CPU**: Hal ini wajar untuk inferensi neural network tanpa GPU (~15–25 detik). Batasi panjang kalimat ke 1–2 paragraf untuk respon audio yang cepat.
- **Service Unreachable (503)**: Pastikan container aktif dengan mengetik `docker compose ps`. Jika status *exited*, periksa error log dengan `docker compose logs chattts`.
