# AI Content Generator (AsikReview Editorial Studio)

Aplikasi web editorial berbasis **Next.js 16 (App Router)**, **React 19**, **Tailwind CSS v4 (Swiss Editorial Design)**, **Prisma ORM (SQLite)**, dan **Elasticsearch (RAG Knowledge Base)** yang dilengkapi dengan:
- **5-Agent AI Pipeline**: Ideator → Writer → Editor → Evaluator → Designer
- **Live Canvas Banner Studio**: Desain cover Medium (16:9) & Instagram (1:1) dengan ekspor instan
- **Fish-Speech Audio Studio (v1.5)**: Sintesis suara dialog & narasi buku multi-bahasa, 34 Tag Ekspresi Vokal, 8 Persona Suara Studio, akselerasi NVIDIA GPU GTX 1650, dan zero-shot voice cloning
- **AI Podcast Generator**: Multi-segment audio script dengan format SSML & 34 tag vokal siap sintesis
- **RAG Knowledge Base**: Ekstraksi buku PDF & chat tanya-jawab berbasis Elasticsearch

---

## 📖 Dokumentasi Lengkap

* 🐟 **[Panduan Lengkap Fish-Speech Service](docs/fish-speech-service.md)**: Arsitektur microservice suara, 8 Persona Suara Studio, panduan 34 Tag Ekspresi Vokal, pelafalan naskah Bahasa Inggris, dan referensi REST API.
* 🎨 **[Panduan Canvas Editor](docs/canvas-editor.md)**: Arsitektur state visual editor cover banner (Medium 16:9 & Instagram 1:1), grouping, dan multi-drag.
* 📚 **[Indeks Spesifikasi Fitur (Spec Kit)](specs/README.md)**: Dokumen spesifikasi resmi Spec Kit (`001`, `002`, `003-fish-speech-service`).

---

## 📋 Prasyarat Sistem

Sebelum menginstal proyek ini, pastikan sistem Anda memiliki:
- **Node.js** (versi 18.x atau lebih baru)
- **npm**, **yarn**, **pnpm**, atau **bun**
- **Docker Desktop** *(opsional tapi direkomendasikan untuk modul RAG Knowledge Base / Elasticsearch)*

---

## 🏗️ Arsitektur Penyimpanan & Layanan

Aplikasi ini menggunakan pendekatan arsitektur *dual-engine* yang tangguh:

1. **SQLite (Prisma ORM)**: Menyimpan data relasional utama (artikel, metadata ulasan, asset banner HTML, jadwal kalender, dan tren audiens). **Aplikasi dapat langsung berjalan tanpa setup server eksternal**.
2. **Elasticsearch (Docker)**: Digunakan khusus untuk modul **Knowledge Base** (`/dashboard/knowledge`) dalam membedah PDF buku menjadi ratusan bab/bagian serta pencarian konteks RAG yang cepat. Jika Elasticsearch belum aktif, fitur ulasan buku & banner reguler tetap dapat berjalan normal berkat sistem *graceful fallback*.

---

## 🚀 Panduan Instalasi & Menjalankan Aplikasi

### 1. Kloning Repositori
```bash
git clone <url-repositori-anda>
cd generator-content
```

### 2. Instalasi Dependensi
```bash
npm install --legacy-peer-deps
```

### 3. Konfigurasi Environment Variables
Salin file `.env.example` menjadi `.env`:
```bash
cp .env.example .env
```
Isi variabel yang dibutuhkan:
```env
DATABASE_URL="file:./dev.db"
OPENAI_API_KEY="sk-proj-..."
ELASTICSEARCH_URL="http://localhost:9200"
```

### 4. Menjalankan Layanan (Auto-Run & Auto-Stop)
Anda dapat menjalankan seluruh stack (Web Frontend + TTS Backend) hanya dengan **1 perintah**:

```bash
# Jalankan seluruh stack (Web 3300 + Fish-Speech TTS 8765):
npm run dev:all
# Atau:
python run.py
# Atau (di Windows CMD):
run.bat

# Tekan [Ctrl + C] kapan saja: Sistem otomatis mematikan SEMUA proses & membersihkan port.

# Perintah kontrol lainnya:
npm run stop      # Hentikan semua proses & bersihkan port 8765 dan 3300
npm run status    # Cek status kesehatan kedua layanan
python run.py tts # Jalankan hanya service TTS saja
```

#### Mode B: Docker Compose (Isolated Container)
```bash
# Menjalankan Elasticsearch & Kibana:
docker compose up -d

# Menjalankan Fish-Speech microservice via container (port 8765):
docker compose up fish-speech -d
```
*Layanan yang berjalan:*
- **Elasticsearch**: [http://localhost:9200](http://localhost:9200) (Data tersimpan di volume `es_data`)
- **Kibana** *(UI Manajemen Index)*: [http://localhost:5601](http://localhost:5601)
- **Fish-Speech Service**: [http://localhost:8765](http://localhost:8765) (Health check: `http://localhost:8765/v1/health`)



### 5. Menjalankan Migrasi & Seeder Database
Inisialisasi tabel SQLite dan data contoh template banner:
```bash
npx prisma migrate dev --name init
npm run seed
```

### 6. Menjalankan Server Development
```bash
npm run dev
```
Buka [http://localhost:3300](http://localhost:3300) di browser Anda.

---

## 🛠️ Perintah Berguna (Scripts)

| Perintah | Deskripsi |
| :--- | :--- |
| `npm run dev:all` | **All-in-One Service Manager**: Menjalankan Web (3300) + Fish-Speech (8765) serentak |
| `npm run stop` | Menghentikan semua background process & membebaskan port 8765/3300 |
| `npm run status` | Mengecek status kesehatan kedua service (Web & TTS) |
| `npm run tts:dev` | Menjalankan service Fish-Speech backend mandiri di port 8765 |
| `npm run import:pdf` | Mengekstrak buku PDF dan mengindeks bab ke Elasticsearch RAG |
| `npm run dev` | Menjalankan server development Next.js di port 3300 |
| `npm run test` | Menjalankan automated unit test suite (Vitest) |
| `npm run build` | Melakukan compile dan build production Next.js |
| `npm run start` | Menjalankan production server di port 3300 |
| `npm run lint` | Menjalankan pengecekan linter kode ESLint |
| `npx prisma studio` | Membuka antarmuka grafis untuk melihat database SQLite |
| `docker compose up -d` | Menjalankan cluster Elasticsearch & Kibana lokal |

---

## 🗂️ Struktur Direktori Proyek

- `src/app/` : Routing sistem Next.js App Router (Halaman & REST API).
- `src/components/` : Komponen antarmuka pengguna (UI) React bergaya Swiss Editorial.
- `src/lib/` :
  - `services/agents/` : Multi-agent pipeline (Ideator, Writer, Editor, Evaluator, Designer, Podcaster).
  - `validation/` : Skema validasi request berbasis Zod.
  - `security/` : Sanitasi HTML dan proteksi keamanan.
  - `elasticsearch.ts` : Client dan health check Elasticsearch RAG.
- `tests/unit/` : Automated test suite Vitest.
- `prisma/` : Skema database SQLite dan script seeder (`schema.prisma`, `seed.ts`).
- `docker-compose.yml` : Konfigurasi lokal Elasticsearch 8.x dan Kibana.
