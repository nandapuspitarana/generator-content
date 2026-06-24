# Feature Specification: Book Review Content Generator (AsikReview Engine)

**Feature Branch**: `001-book-review-generator`  
**Created**: 2026-06-24  
**Status**: Draft  
**Input**: User description: "Bangun sistem otomatisasi 'Book Review Content Generator' dengan template dan persona 'AsikReview Engine' untuk menghasilkan HTML Banner Preview dan 7-Page Book Review siap pakai di Medium."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Menghasilkan Review Buku Lengkap ala AsikReview Engine (Priority: P1)

Sebagai seorang Medium Writer, saya ingin memasukkan Judul Buku, Nama Penulis, dan Catatan/Poin Penting, lalu mendapatkan output instan berupa kode HTML Banner Cover dan 7 bagian artikel review terstruktur agar saya memiliki ulasan siap publikasi yang estetik dan menarik.

**Why this priority**: Fungsionalitas inti untuk memenuhi permintaan format keluaran ganda (HTML Banner + 7 Bagian Review) dengan persona penulisan yang kasual dan jenaka.

**Independent Test**: Diuji dengan menginput "Atomic Habits" karya "James Clear" dengan catatan poin penting tentang "1% improvement". Verifikasi bahwa sistem menghasilkan:
1. Blok kode HTML banner mandiri dengan rasio 16:9.
2. Artikel review terstruktur dari bagian 1 sampai 7 yang dipisahkan oleh pembatas `---`.

**Acceptance Scenarios**:

1. **Given** Sistem menerima input Buku, Penulis, dan Catatan, **When** Sistem memproses data, **Then** Sistem menghasilkan output dengan format terbagi menjadi Kode HTML Banner dan Review 7 Bagian.
2. **Given** Sistem memproses ulasan, **When** Artikel dihasilkan, **Then** Gaya penulisan harus kasual, menggunakan bahasa Indonesia santai, sapaan akrab seperti "bosque", analogi sehari-hari, dan tanpa istilah akademis kaku.

---

### User Story 2 - Menampilkan HTML Banner Preview yang Estetik & Mandiri (Priority: P2)

Sebagai pembuat konten visual di Medium, saya ingin kode HTML banner cover yang dihasilkan menggunakan Tailwind CSS mandiri (via CDN) dengan desain bersih dan responsif agar saya bisa langsung merendernya di browser untuk diambil tangkapan layarnya (screenshot) sebagai gambar sampul artikel.

**Why this priority**: Nilai estetika utama Medium bergantung pada gambar sampul. Memberikan template banner instan mempermudah branding konten.

**Independent Test**: Salin kode HTML hasil generate ke file `.html` lokal, buka di browser, dan periksa apakah tata letak 16:9, warna pastel/gelap yang estetik, dan detail teks dinamis (Judul, Penulis, "asikreview.medium.com | 7 Min Read") tampil dengan benar.

**Acceptance Scenarios**:

1. **Given** Kode HTML dihasilkan, **When** Dibuka di browser tanpa setup library tambahan, **Then** Banner ter-render dengan rapi menggunakan font yang sesuai dan tata letak minimalis yang estetik.

---

### User Story 3 - Penyuntingan Mandiri Anti-Halusinasi (Priority: P3)

Sebagai pemilik publikasi Medium yang kredibel, saya ingin draf tulisan yang dihasilkan melalui proses penyaringan fakta secara otomatis untuk memastikan tidak ada kesalahan detail buku dan ejaan disesuaikan agar mengalir natural.

**Why this priority**: Mempertahankan reputasi penulis. Pembaca Medium menyukai tulisan kasual tetapi harus tetap akurat dan scannable.

**Independent Test**: Verifikasi artikel akhir tidak memuat plot buatan AI (halusinasi) dan paragraf ditulis ringkas (maksimal 3-4 kalimat per paragraf).

---

### Edge Cases

- **Catatan/Poin Penting Kosong**: Jika pengguna tidak memasukkan Catatan/Poin Penting, sistem harus menyintesis poin penting paling terkenal dari buku tersebut secara otomatis.
- **Judul Buku Terlalu Panjang pada Banner**: Desain HTML Banner harus menangani text-overflow atau scaling ukuran font secara otomatis agar teks tidak keluar dari batas aspek rasio 16:9.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Sistem MUST menerima input parameter: `Judul Buku` (wajib), `Nama Penulis` (wajib), dan `Catatan/Poin Penting` (opsional).
- **FR-002**: Sistem MUST mengadopsi persona **AsikReview Engine**:
  - Karakter: Cerdas, suka membaca, kasual, asik, humoris (*witty*), dan pandai menggunakan analogi sehari-hari.
  - Sapaan akrab: "bosque", "Jujur ya...", "Nah, ini dia...", "Buat kamu yang...".
- **FR-003**: Sistem MUST menyusun output dalam satu kali proses generasi dengan pembagian sebagai berikut:
  - **Bagian 1: HTML Banner Code**: Kode HTML/Tailwind CSS mandiri (menggunakan CDN Tailwind) untuk banner cover Medium dengan aspek rasio 16:9, teks dinamis (Judul, Penulis, "asikreview.medium.com | 7 Min Read ⏱️"), dan desain minimalis. Ketik teks pengantar sebelum kode: *"Pembuka dulu, bosque! Ini kode HTML buat Banner Preview kamu. Tinggal copy-paste ke file .html atau HTML viewer buat di-screenshot:"*
  - **Bagian 2: 7-Page Book Review (Markdown)**: Artikel ulasan yang dibagi menjadi 7 halaman logis yang dipisahkan oleh pembatas horizontal `---` dengan struktur:
    - **Halaman 1**: `📖 [Judul Buku] — [Slogan/Hook Kasual]` | Oleh: `[Penulis]` | Sinopsis Eksekutif | Untuk Siapa Buku Ini? (3 poin target pembaca yang relatable).
    - **Halaman 2**: `💡 Bagian 2: The Big Idea & Geser Paradigma` (Ide radikal, perbandingan cara berpikir lama vs baru, blockquote kutipan kuat).
    - **Halaman 3**: `🔑 Bagian 3: Poin Kunci #1 — [Nama Konsep Pertama]` (Penjelasan konsep kasual, analogi/contoh kasus lucu, **Insight Utama** tebal).
    - **Halaman 4**: `🔑 Bagian 4: Poin Kunci #2 — [Nama Konsep Kedua]` (Penjelasan konsep, analogi/contoh kasus, **Insight Utama** tebal).
    - **Halaman 5**: `🔑 Bagian 5: Poin Kunci #3 — [Nama Konsep Ketiga]` (Solusi/strategi praktis, analogi/contoh kasus, **Insight Utama** tebal).
    - **Halaman 6**: `⚡ Bagian 6: Mitos yang Dipatahkan & Realita Lapangan` (Mitos yang dihancurkan, tantangan nyata saat praktik).
    - **Halaman 7**: `🚀 Bagian 7: Actionable Steps (Mulai Hari Ini!)` (Rangkuman akhir, 3 langkah nyata: Langkah Kecil 24 Jam, Langkah Kebiasaan Minggu Ini, Langkah Jangka Panjang).
- **FR-004**: Sistem MUST melakukan *self-editing* otomatis untuk memvalidasi fakta buku, memotong paragraf yang terlalu panjang (maksimal 3-4 kalimat per paragraf), dan membersihkan typo.
- **FR-005**: Sistem MUST menyimpan seluruh output tersebut ke dalam file Markdown (`.md`) yang bersih.

### Key Entities

- **Book Ulasan**: Data input (Judul, Penulis, Catatan Tambahan).
- **AsikReview Output**: Representasi berkas teks gabungan yang memuat kode banner HTML dan 7 bagian artikel Markdown terformat.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Output akhir dihasilkan dalam berkas `.md` utuh tanpa ada bagian dari 7 bagian review yang terpotong.
- **SC-002**: Kode HTML banner di bagian atas bersifat mandiri, menggunakan Tailwind via CDN, dan langsung tampil rapi dengan aspek rasio 16:9 saat dibuka di web browser.
- **SC-003**: Rata-rata keterbacaan artikel bernada kasual dan berparagraf pendek (maksimal 4 kalimat per paragraf).

## Assumptions

- **A-001**: Output utama berupa berkas Markdown (.md) yang berisi teks dan blok kode HTML banner di bagian atasnya.
- **A-002**: Desain banner HTML menggunakan link CDN Tailwind CSS agar gaya visual Tailwind berfungsi tanpa proses build/kompilasi lokal.
