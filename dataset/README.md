# 🎙️ Panduan Format & Labeling Dataset Suara (Audio-to-Text / TTS / ASR)

Direktori ini dirancang sebagai template dan lingkungan kerja siap pakai bagi Anda untuk membuat **dataset audio dan teks sendiri (*custom voice labeling*)**, baik untuk fine-tuning model suara (Fish-Speech / Gemini / StyleTTS / VITS) maupun evaluasi model audio ke teks (*speech-to-text / expected text*).

---

## 📁 1. Struktur Direktori Dataset

```text
dataset/
├── README.md                      # Panduan lengkap labeling (file ini)
├── metadata.csv                   # Manifest format standar LJSpeech (id|raw_text|norm_text)
├── metadata.jsonl                 # Manifest format kaya JSONL (durasi, emosi, vocal tags)
├── wavs/                          # Folder klip audio terpotong (.wav) dan teks (.lab)
│   ├── sample_0001.wav            # Klip audio 24kHz Mono 16-bit
│   ├── sample_0001.lab            # Transkrip teks dengan tag ekspresi
│   ├── sample_0002.wav
│   ├── sample_0002.lab
│   └── ...
├── raw_recordings/                # Tempat menyimpan rekaman mentah (file panjang)
└── templates/                     # File contoh template untuk memulai
    ├── template_metadata.csv
    └── template_metadata.jsonl
```

---

## 🎧 2. Standar Teknis Audio

Untuk melatih model AI modern berkualitas tinggi, audio Anda harus memenuhi standar berikut:

| Parameter | Spesifikasi Ideal | Keterangan |
| :--- | :--- | :--- |
| **Format Container** | **WAV** (RIFF) | Bebas kompresi *lossy* |
| **Sample Rate** | **24.000 Hz** (24 kHz) | Standar VQ-GAN / DAC codec suara modern |
| **Audio Channel** | **Mono** (1 Channel) | AI melatih suara vokal dari channel tunggal |
| **Bit Depth** | **16-bit PCM** | Standar industri audio machine learning |
| **Durasi per File** | **2.0 – 15.0 detik** | Potong per 1–2 kalimat, hindari klip > 18 detik |
| **Hening (Padding)** | **0.1 – 0.2 detik** | Beri jeda hening sangat tipis di awal dan akhir audio |

> [!TIP]
> Jika Anda merekam dalam format MP3, 44.1kHz, atau Stereo di ponsel/mikrofon, letakkan file di `dataset/raw_recordings/` lalu jalankan perintah:
> ```bash
> python scripts/dataset_tools.py normalize
> ```
> Script ini akan otomatis mengubah audio menjadi **24.000 Hz Mono 16-bit WAV**.

---

## 📝 3. Format Labeling Transkrip

Ada dua metode yang didukung penuh:

### Metode A: Berdampingan Per-File (`.wav` + `.lab`) — *Paling Direkomendasikan*
Simpan file teks dengan nama yang sama persis seperti file audionya di dalam folder `dataset/wavs/`:
* File audio: `dataset/wavs/sample_0001.wav`
* File label: `dataset/wavs/sample_0001.lab`

Isi file `.lab` (UTF-8 tanpa BOM):
```text
Halo semuanya! [laughing] Selamat datang di sesi podcast perdana saya.
```

### Metode B: Menggunakan File Manifest `metadata.csv` (LJSpeech Standard)
Gunakan pemisah pipa (`|`) tanpa spasi di sekitar pipa:
```csv
sample_0001|Halo semuanya! [laughing] Selamat datang di podcast saya.|Halo semuanya! [laughing] Selamat datang di podcast saya.
sample_0002|Dengarkan rahasia ini [whisper], jangan sampai bocor.|Dengarkan rahasia ini [whisper], jangan sampai bocor.
sample_0003|Fiuh, akhirnya selesai. [sigh] [pause] Sekarang waktunya istirahat.|Fiuh, akhirnya selesai. [sigh] [pause] Sekarang waktunya istirahat.
```
Format kolom: `audio_id|raw_text|normalized_text`

---

## 🏷️ 4. Penggunaan 34 Vocal Expression Tags

Sistem ini mengenali 34 tag akustik vokal alami yang bisa disisipkan ke dalam teks:

| Kategori | Tag yang Tersedia | Contoh Penggunaan |
| :--- | :--- | :--- |
| **Tawa & Ceria** | `[laughing]`, `[chuckle]`, `[chuckling]`, `[laughing tone]`, `[delight]` | *"Cerita tadi lucu sekali [laughing], saya sampai terpingkal-pingkal."* |
| **Napas & Jeda** | `[pause]`, `[short pause]`, `[sigh]`, `[inhale]`, `[exhale]`, `[clearing throat]`, `[panting]`, `[tsk]` | *"Fiuh, lega rasanya. [sigh] [pause] Mari kita lanjutkan."* |
| **Dinamika Suara** | `[whisper]`, `[low voice]`, `[low volume]`, `[volume down]`, `[loud]`, `[screaming]`, `[shouting]` | *"Jangan bicara keras-keras [whisper], bayinya sedang tidur."* |
| **Emosi & Mood** | `[excited]`, `[excited tone]`, `[surprised]`, `[shocked]`, `[angry]`, `[sad]`, `[singing]` | *"Wah, kabar baik ini luar biasa! [excited] Kita berhasil menang!"* |

---

## ✍️ 5. Aturan Normalisasi Teks (*Text Normalization*)

Saat melakukan labeling teks yang diharapkan (*expected text*):
1. **Verbatim**: Tulis apa yang benar-benar diucapkan oleh pembicara. Jika pembicara mengucapkan *"nggak"*, tulis *"nggak"*, jangan diubah menjadi *"tidak"*.
2. **Angka Ditulis Huruf**:
   * ❌ *"Saya punya 3 buku seharga Rp 25.000."*
   * ✅ *"Saya punya tiga buku seharga dua puluh lima ribu rupiah."*
3. **Singkatan Dieja**:
   * ❌ *"Prof. Budi dari UI berbicara di TV."*
   * ✅ *"Profesor Budi dari U I berbicara di T V."*
4. **Tanda Baca**: Gunakan tanda baca alami (koma `,`, titik `.`, tanya `?`, seru `!`) karena model suara menggunakan tanda baca untuk menentukan modulasi nada dan intonasi.

---

## 🛠️ 6. Toolkit Otomatis (`scripts/dataset_tools.py`)

Gunakan script pembantu yang telah disediakan di terminal:

### 1. Validasi Kelayakan Dataset
Memeriksa apakah semua audio berpasangan dengan teks, mengecek sample rate, durasi klip, dan tag vokal:
```bash
python scripts/dataset_tools.py validate
```

### 2. Sinkronisasi Otomatis Manifest
Jika Anda baru selesai menambahkan atau mengedit file `.lab` di folder `wavs/`, buat ulang `metadata.csv` dan `metadata.jsonl` secara otomatis:
```bash
python scripts/dataset_tools.py sync
```

### 3. Normalisasi Audio Mentah
Jika Anda memiliki file rekaman panjang di folder `raw_recordings/` dan ingin mengubah formatnya menjadi standar 24kHz Mono 16-bit:
```bash
python scripts/dataset_tools.py normalize --input dataset/raw_recordings --output dataset/wavs
```

---

## 🚀 7. Contoh Alur Kerja Labeling Sendiri (Step-by-Step)

1. **Rekam Suara**: Rekam suara Anda membacakan naskah (menggunakan mikrofon / ponsel di ruangan hening).
2. **Potong Audio**: Buka rekaman di software audio (misalnya **Audacity** - gratis), potong rekaman per kalimat atau per jeda napas (panjang ideal 3–10 detik).
3. **Ekspor**: Simpan file potongan ke `dataset/wavs/` dengan nama berurutan:
   * `voice_0001.wav`
   * `voice_0002.wav`
   * `voice_0003.wav`
4. **Label Teks**: Buat file `.lab` di folder yang sama:
   * `voice_0001.lab` berisi teks yang diucapkan di file `voice_0001.wav` beserta tag emosinya (misal: `[excited]`).
5. **Cek Dataset**: Jalankan di terminal:
   ```bash
   python scripts/dataset_tools.py validate
   ```
6. **Sinkronkan**: Jalankan:
   ```bash
   python scripts/dataset_tools.py sync
   ```
7. Dataset Anda sekarang siap 100% untuk digunakan pada pelatihan model AI atau pengujian audio-to-text!
