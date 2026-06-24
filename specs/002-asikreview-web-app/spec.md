# Feature Specification: AsikReview Generator Web App

**Feature Branch**: `002-asikreview-web-app`  
**Created**: 2026-06-24  
**Status**: Draft  
**Input**: User description: "Bangun aplikasi web single-page bernama 'AsikReview Generator'. Alur Pengguna: 1. Form input minimalis (Judul Buku, Penulis, Catatan). 2. Tombol 'Generate Review 🚀' dengan loading estetik. 3. Integrasi API AI dengan System Prompt khusus ('AsikReview Engine'). 4. Output ditampilkan dalam dua panel bersandingan: 'Banner Preview' (render HTML) dan 'Markdown Editor/Viewer' (7-Page Review)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Mengisi Form & Melihat Loading State (Priority: P1)

Sebagai seorang pengguna, saya ingin melihat antarmuka form yang sangat minimalis dengan tiga input utama (Judul Buku, Penulis, dan Catatan) dan tombol "Generate Review 🚀", sehingga saya bisa meminta sistem untuk membuatkan ulasan buku dengan mudah. Saat proses berjalan, saya ingin melihat animasi *loading* yang estetik.

**Why this priority**: Interaksi awal dari SPA (Single-Page Application). Form adalah pintu gerbang untuk memasukkan data yang dibutuhkan oleh sistem AI.

**Independent Test**: Buka aplikasi di browser, masukkan "Atomic Habits" di input Judul, "James Clear" di Penulis, dan klik tombol Generate. Verifikasi bahwa form dinonaktifkan sementara dan animasi loading (spinner atau *skeleton loader* yang estetik) muncul di layar.

**Acceptance Scenarios**:

1. **Given** Aplikasi dimuat, **When** Pengguna melihat form, **Then** Terdapat input teks untuk "Judul Buku" & "Penulis", dan *textarea* besar untuk "Catatan/Poin Penting".
2. **Given** Pengguna mengisi form dan menekan "Generate Review 🚀", **When** Sistem memanggil service API AI, **Then** UI menampilkan *loading state* yang elegan sebelum hasil muncul.

---

### User Story 2 - Menampilkan Dua Panel Hasil Secara Bersamaan (Priority: P1)

Sebagai seorang penulis Medium, saya ingin hasil dari AI langsung ditampilkan terpisah ke dalam dua panel bersebelahan (Split Screen): Panel kiri untuk melihat langsung hasil *render* "Banner Preview" (HTML), dan Panel kanan untuk "Markdown Editor/Viewer" yang memuat artikel 7 halaman, agar saya bisa meninjau keduanya secara visual tanpa harus berpindah halaman.

**Why this priority**: Membedakan aplikasi ini dari ChatGPT biasa. Pengguna butuh preview langsung dari kode HTML dan teks artikel yang terformat rapi.

**Independent Test**: Gunakan respons mock dari service AI yang mengembalikan gabungan kode HTML dan Markdown. Verifikasi bahwa aplikasi mampu mengekstrak kode HTML dan merendernya di Panel 1, sementara sisa teks Markdown ditampilkan di Panel 2.

**Acceptance Scenarios**:

1. **Given** Sistem menerima respons sukses dari AI, **When** Proses rendering berjalan, **Then** Panel 1 (Banner Preview) menampilkan hasil *render* visual dari kode HTML (aspek rasio 16:9), dan Panel 2 menampilkan teks Markdown lengkap.

---

### User Story 3 - Integrasi Prompt "AsikReview Engine" (Priority: P2)

Sebagai *developer*, saya ingin aplikasi menyertakan *System Prompt* baku di balik layar yang secara ketat menginstruksikan LLM untuk berperan sebagai "AsikReview Engine" dan menghasilkan output spesifik (HTML Banner + 7 Bagian Review dengan nada kasual), agar output yang keluar selalu konsisten dengan format Medium.

**Why this priority**: Prompt *engineering* yang di-*hardcode* di *backend/service layer* adalah inti yang membuat generator ini pintar dan menghasilkan format yang persis seperti yang diinginkan pengguna.

**Independent Test**: Periksa payload yang dikirim ke service (atau *mock service* LLM) saat tombol Generate diklik. Pastikan ada instruksi detail tentang *Role* (witty, kasual), *Output 1* (Kode HTML Banner 16:9), dan *Output 2* (Markdown 7 Bagian).

**Acceptance Scenarios**:

1. **Given** Pengguna menekan tombol Generate, **When** Payload dikirim ke API LLM, **Then** Payload mencakup instruksi: persona "AsikReview Engine", 1 HTML block output, dan 7 format bagian review (Judul & Hook, The Big Idea, 3 Poin Kunci, Mitos, Actionable Steps).

---

### Edge Cases

- **Kegagalan API LLM / Timeout**: Bagaimana jika API (OpenAI/Gemini) sedang gangguan atau memakan waktu terlalu lama? (Aplikasi harus menangani *error* dengan baik, menghentikan animasi loading, dan menampilkan pesan *error* "Oops, AI sedang kelelahan. Coba lagi!" dengan opsi *retry*).
- **Format Respons AI Tidak Terprediksi**: Bagaimana jika AI gagal memisahkan kode HTML dengan benar? (Aplikasi harus memiliki fungsi *parser* yang kokoh, misalnya mencari blok \`\`\`html, dan jika tidak ditemukan, menampilkan *fallback* desain banner *default*).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Aplikasi web MUST dibangun sebagai Single-Page Application (SPA) dengan desain antarmuka super minimalis, bersih, dan modern (ala Medium).
- **FR-002**: Aplikasi MUST menyediakan *form* input dengan 3 kolom:
  - Input Teks: "Judul Buku"
  - Input Teks: "Penulis"
  - Textarea: "Catatan/Poin Penting" (opsional)
- **FR-003**: Tombol eksekusi MUST berlabel "Generate Review 🚀" dan memicu *loading state* estetik saat memproses data.
- **FR-004**: Aplikasi MUST memanggil modul *service* LLM (dengan implementasi *mock* awal yang dapat diganti dengan integrasi OpenAI/Gemini sungguhan).
- **FR-005**: *Service layer* MUST menyuntikkan *System Prompt* spesifik ("AsikReview Engine") yang mewajibkan LLM untuk menghasilkan dua *output* sekaligus:
  - Blok kode HTML/Tailwind CDN mandiri (rasio 16:9).
  - Format artikel Markdown (7 bagian spesifik).
- **FR-006**: Antarmuka hasil MUST berupa tata letak 2 Panel (bersandingan/split-screen di *desktop*):
  - **Panel 1 (Banner Preview)**: Menampilkan hasil *render* aman dari kode HTML banner.
  - **Panel 2 (Markdown Editor/Viewer)**: Menampilkan dan me-render hasil ulasan 7 bagian.
- **FR-007**: Aplikasi MUST memiliki penanganan *error* (*error handling*) yang mulus jika pemanggilan API gagal atau *timeout*.

### Key Entities

- **Review Request**: Entitas data yang dikirim pengguna (Judul, Penulis, Catatan).
- **AsikReview Prompt**: String instruksi sistem rahasia yang disisipkan di level aplikasi.
- **AI Response**: Hasil *raw string* dari LLM yang berisi HTML + Markdown.
- **Parsed Result**: Objek hasil pemisahan (*parsing*) dari *AI Response*, memuat atribut `htmlBannerCode` dan `markdownContent`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: UI dirender dengan sempurna di resolusi desktop (2 panel bersebelahan) dan *mobile* (*stacking* atas-bawah).
- **SC-002**: Pengiriman *form* berhasil memicu animasi *loading* dan berujung pada transisi UI ke tampilan layar hasil (2 Panel).
- **SC-003**: *Parser* aplikasi terbukti 100% mampu memisahkan blok kode HTML dari sisa teks Markdown yang diberikan oleh *mock* respons LLM.
- **SC-004**: Tidak ada gangguan (*layout break*) saat me-render kode HTML maupun Markdown di antarmuka aplikasi.

## Assumptions

- **A-001**: *Mock service* API sudah cukup untuk tahap awal pengembangan (*development*) guna memverifikasi alur UI/UX tanpa membuang kuota API berbayar.
- **A-002**: Output HTML banner dari LLM akan dirancang menggunakan CDN Tailwind CSS (*utility classes* standar) sehingga aman di-*render* ke dalam penampung berskala *fluid* (misal: `<div dangerouslySetInnerHTML />` atau `iframe` *sandboxed*).
- **A-003**: Aplikasi akan dibangun dengan React/Next.js sesuai panduan *constitution* proyek yang menekankan *Clean Architecture*.
