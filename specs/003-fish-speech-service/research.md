# Research & Technical Decisions: Fish-Speech Multilingual & Indonesian Microservice

Dokumentasi analisis komparasi teknologi, arsitektur Fish-Speech v1.5, pipeline dataset Indonesia, dan pertimbangan desain sistem.

---

## 1. Alasan & Rasionalisasi Migrasi dari ChatTTS ke Fish-Speech

| Aspek | ChatTTS (Lama) | Fish-Speech v1.5 (Baru) |
|---|---|---|
| **Arsitektur Model** | Autoregressive Transformer tunggal | Dual-Autoregressive Transformer + VQ Codec 24kHz |
| **Dukungan Bahasa Indonesia** | Terbatas (sering terdengar asing / intonasi datar) | Sangat Alami (Didukung dataset lokal X-lord 16.4 jam) |
| **Multilingual & English Books** | Terbatas pada teks pendek | Native BPE Tokenizer (fasih membaca buku full English & campuran) |
| **Zero-Shot Voice Cloning** | Tidak didukung secara native (hanya random speaker seed) | Didukung penuh via audio referensi 5–15 detik |
| **Kontrol Prosodi & Emosi** | Hanya token dasar `[laughter]`, `[break]` | Mendukung 34 Tag Ekspresi Vokal (bisikan, tawa, teriakan, antusias, dll.) |
| **Stabilitas Inferensi** | Rentan desis dan *audio hallucination* pada teks panjang | Stabil berkat sentence boundary chunking & silence stitching |

---

## 2. Dataset Text-to-Speech Indonesia (X-lord)

Untuk menghasilkan intonasi suara Indonesia yang alami, proyek ini mengintegrasikan dataset:
* **Repository**: [X-lord/Dataset-Text-To-Speech-Indonesia](https://huggingface.co/datasets/X-lord/Dataset-Text-To-Speech-Indonesia)
* **Spesifikasi Data**:
  * 4.531 file rekaman audio WAV berdurasi total 16,4 jam.
  * Sample rate 24.000 Hz, mono PCM 16-bit.
  * Transkripsi teks bahasa Indonesia terverifikasi.
* **Pipeline Pemrosesan Data (`services/fish-speech/training/`)**:
  1. `01_download_dataset.py`: Mengunduh dan mengekstrak audio dari HuggingFace.
  2. `02_extract_vq.py`: Mengekstrak representasi Vector Quantization (VQ) tokens.
  3. `03_build_proto.py`: Mengemas token ke dalam format binary Protobuf untuk pelatihan cepat.
  4. `04_train_lora.py` & `05_merge_and_test.py`: Melatih adaptor LoRA dan menggabungkan bobot ke checkpoint model.

---

## 3. Komputasi & Akselerasi Perangkat Keras

* **Host GPU**: NVIDIA GeForce GTX 1650 (4GB GDDR6 VRAM, Turing Architecture).
* **Setup PyTorch**: PyTorch 2.5.1 + CUDA 12.1 (`torch>=2.5.1+cu121`).
* **Optimasi FP16**: Inferensi FP16 menghemat alokasi memori VRAM sehingga model transformer muat dalam kapasitas 4GB VRAM tanpa memicu *Out-of-Memory (OOM)*.
* **Standby Neural Engine Fallback**:
  * Jika bobot lokal belum diunduh penuh ke disk atau GPU sedang sibuk, microservice secara mulus mengalihkan inferensi ke mesin *Standby High-Definition Neural Engine* (Edge-TTS) dengan latensi rendah dan kejernihan audio studio 24kHz.

---

## 4. Analisis Persona Suara Multilingual & Code-Switching

Kreator konten sering me-review buku impor berbahasa Inggris atau buku Indonesia dengan kutipan asing (misalnya *"Thinking, Fast and Slow"*, *"Atomic Habits"*, *"System 1 & System 2"*).

* **Temuan**: Suara model lokal Indonesia terkadang membaca kosakata bahasa Inggris dengan aksen kaku (*medok*).
* **Solusi**: Menambahkan 4 persona suara **Multilingual Neural**:
  * `Andrew Multilingual (Seed 1111)`: Pelafalan Inggris fasih kelas radio/podcast, sangat luwes membaca naskah campuran Indo-Inggris.
  * `Emma Audiobook (Seed 3333)`: Narator buku internasional elegan.
  * `Brian Conversational (Seed 5555)`: Santai & dialogis.
  * `Ava Storyteller (Seed 7777)`: Cerita fiksi ekspresif.

---

## 5. Pertimbangan Fitur Pending / Masa Depan

1. **Unduh Bobot Model Lokal Penuh**:
   * Bobot base model `openaudio-s1-mini` berukuran ~1.5GB. Menyediakan script auto-download ber-resume agar proses download tidak gagal di koneksi tidak stabil.
2. **WebSocket Audio Streaming**:
   * Daripada menunggu seluruh paragraf disintesis (butuh 5–15 detik), chunking audio real-time via WebSocket memungkinkan audio mulai bersuara dalam < 2 detik pertama.
3. **Multi-Speaker Auto-Dialogue**:
   * Menambahkan parser tag pembicara (`[Speaker: Ardi]`, `[Speaker: Gadis]`) untuk merender percakapan podcast dua arah secara otomatis.
