# Research & Technical Decisions: ChatTTS Microservice

## 1. Overview of ChatTTS

**Repository**: [https://github.com/2noise/ChatTTS](https://github.com/2noise/ChatTTS)  
**Author**: 2noise  
**License**: 
- Source code: `AGPLv3+`
- Model weights: `CC BY-NC 4.0` (Non-commercial, academic & educational use)

ChatTTS adalah model generatif speech synthesis (Text-to-Speech) yang dioptimasi secara khusus untuk skenario dialog percakapan (*conversational TTS*) seperti asisten LLM dan podcast. Tidak seperti model TTS tradisional yang terdengar kaku seperti membaca buku teks (*robotic narration*), ChatTTS mampu memprediksi dan mengontrol fitur prosodi detail seperti tawa (`[laughter]`), jeda helaan napas, intonasi santai, dan interjeksi lisan.

## 2. Model Architecture & Key Characteristics

1. **Pre-trained Dataset**: Dilatih dengan lebih dari 100.000 jam data audio percakapan (versi open-source HuggingFace adalah base model 40.000 jam tanpa SFT).
2. **Sampling Rate**: Output native 24.000 Hz (24kHz), 16-bit mono/stereo audio.
3. **Speaker Consistency**: Menggunakan representasi vektor embedding pembicara (`spk_emb`). Dengan mengatur `torch.manual_seed(seed_number)` sebelum melakukan `chat.sample_random_speaker()`, kita bisa mendapatkan karakter suara yang identik secara deterministik dan berulang.
4. **Control Tokens**:
   - Pause: `[break_0]` s/d `[break_7]`
   - Conversational Laugh: `[laughter]`, `[laugh]`
   - Oral interjections: `[oral_0]` s/d `[oral_9]`

## 3. Hardware & Runtime Requirements

- **RAM**: Minimal 4GB RAM (dialokasikan untuk PyTorch tensor dan buffer weights model ~2GB).
- **Inference Speed**:
  - **CPU (x86_64/ARM64)**: ~15–30 detik untuk 50–100 kata. Cukup cepat untuk naskah segmen podcast pendek (draft review).
  - **CUDA GPU**: ~1–3 detik per segmen dengan VRAM minimal 4GB.
- **Compilation (`CHATTTS_COMPILE`)**:
  - Diatur default `false` di `docker-compose.yml` untuk menjamin kompatibilitas CPU tanpa error TorchDynamo / C++ compiler.

## 4. Architectural Decisions & Rationale

### Keputusan 1: Arsitektur Microservice Terpisah (Python + Docker)
- **Keputusan**: ChatTTS dijalankan di dalam container terpisah (`services/chattts/Dockerfile`) yang berkomunikasi melalui HTTP REST dengan Next.js.
- **Alasan**:
  - Node.js tidak memiliki runtime native untuk model deep learning PyTorch. Menjalankan child process python langsung dari Node.js rentan terhadap memory leak, zombie process, dan locking CPU event loop.
  - Containerization memudahkan isolasi dependency sistem (`libsndfile1`, `ffmpeg`, `torch`).
  - Next.js tetap ringan (*lightweight*) dan responsif melayani web requests tanpa terbebani inferensi neural network.

### Keputusan 2: Preprocessing SSML ke ChatTTS Tokens
- **Keputusan**: Endpoint `/synthesize` secara otomatis mengubah tag SSML `<break time="..."/>` yang dihasilkan oleh agen AI Writer/Podcaster menjadi token `[break_4]`.
- **Alasan**: ChatTTS tidak mem-parsing XML/SSML secara default dan bisa membacakan tag secara harfiah jika tidak dibersihkan. Dengan konversi ini, naskah podcast ElevenLabs-ready dari database dapat langsung disintesis tanpa modifikasi manual dari pengguna.

### Keputusan 3: Dynamic Fallback Audio untuk Development / CI
- **Keputusan**: Jika model weights belum terunduh atau container sedang dalam mode standby, service menghasilkan file nada placeholder WAV valid dan mengembalikan header `X-ChatTTS-Mode: fallback-test`.
- **Alasan**: Memastikan automated tests dan alur integrasi frontend tidak crash ketika dijalankan di mesin CI/CD tanpa GPU atau koneksi HuggingFace.
