# 📚 Project Specifications Index (Spec Kit)

Indeks dokumentasi spesifikasi fitur proyek **AI Content Generator (AsikReview)** yang dikelola dengan standar Spec Kit.

---

## 🗂️ Daftar Spesifikasi Fitur

| Kode | Fitur | Status | Deskripsi |
|---|---|---|---|
| **[001](001-book-review-generator/spec.md)** | **Book Review Generator CLI** | `Completed` | Generator ringkasan dan ulasan buku berbasis AI untuk platform media sosial dan blog. |
| **[002](002-asikreview-web-app/spec.md)** | **AsikReview Generator Web App** | `Completed` | Aplikasi web editorial modern berbasis Next.js 16 (App Router), React 19, Tailwind CSS v4, Live Canvas Banner Studio, dan RAG Knowledge Base. |
| **[003](003-fish-speech-service/spec.md)** | **Fish-Speech & Multilingual TTS Microservice** *(Upgraded from ChatTTS)* | `Active / Complete (Roadmap Pending)` | Microservice sintesis suara dialog multilingual & Bahasa Indonesia (Port 8765), terintegrasi dengan dataset X-lord Indonesia (16.4 jam), akselerasi NVIDIA GPU GTX 1650, 34 Tag Ekspresi Vokal, dan zero-shot voice cloning. |

---

## 🧭 Struktur Dokumen Spesifikasi per Fitur

Setiap folder spesifikasi fitur berisi dokumen terstandar:
- `spec.md`: Spesifikasi kebutuhan bisnis, user stories, acceptance criteria, dan boundary scope.
- `plan.md`: Rencana teknis arsitektur, dependencies, target platform, dan implementasi.
- `tasks.md`: Daftar rincian tugas pengerjaan yang terurut.
- `research.md`: Catatan riset teknologi, alternatif solusi, dan keputusan teknis.
- `data-model.md`: Skema model data entitas dan relasi.
- `quickstart.md`: Panduan menjalankan dan menguji fitur.
- `contracts/`: Spesifikasi API contract dan payload REST/gRPC.
- `checklists/`: Daftar periksa kelengkapan dan kualitas spesifikasi.
