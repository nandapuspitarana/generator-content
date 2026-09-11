# 📖 AsikReview Editorial Studio - Documentation Hub

Selamat datang di pusat dokumentasi teknis dan arsitektur sistem **AsikReview Generator Content**.

---

## 📚 Modul & Panduan Dokumentasi

| Dokumen | Topik Pembahasan | Target Pembaca |
|---|---|---|
| **[Fish-Speech Multilingual & Indonesian TTS](fish-speech-service.md)** | Panduan lengkap microservice suara generatif Fish-Speech v1.5, 34 Tag Ekspresi Vokal, 8 Karakter Suara Studio, dukungan naskah buku Bahasa Inggris (*code-switching*), dan panduan operasional. | Developer, Audio Producer, Konten Kreator |
| **[Canvas Editor Studio](canvas-editor.md)** | Arsitektur state editor visual cover banner (Medium 16:9 & Instagram 1:1), mekanisme undo/redo, multi-drag, grouping elemen, dan ekspor instan. | Frontend Developer, UI/UX Designer |
| **[Spesifikasi Proyek (Spec Kit)](../specs/README.md)** | Indeks spesifikasi fitur resmi Spec Kit (`001-book-review-generator`, `002-asikreview-web-app`, `003-fish-speech-service`). | Product Manager, Engineer |

---

## 🚀 Quick Command Reference

```bash
# Menjalankan seluruh stack (Web 3300 + Fish-Speech 8765):
npm run dev:all

# Cek kesehatan service:
npm run status

# Hentikan semua service & bersihkan port:
npm run stop

# Jalankan automated test suite:
npm run test
```
