# AI Content Generator (AsikReview Web App)

Proyek ini adalah aplikasi web berbasis **Next.js** yang dilengkapi dengan generator gambar/banner (Canvas API) dan integrasi **Prisma ORM**.

## 📋 Prasyarat Sistem

Sebelum menginstal proyek ini, pastikan sistem Anda memiliki:
- **Node.js** (versi 18.x atau lebih baru)
- **npm**, **yarn**, **pnpm**, atau **bun** (pilih salah satu)
- **SQLite** (digunakan sebagai database default melalui Prisma, tidak perlu install server terpisah)

---

## 🚀 Instalasi dari Awal hingga Berjalan

Ikuti langkah-langkah di bawah ini untuk menginstal, mengatur database, hingga menjalankan aplikasi di komputer lokal Anda.

### 1. Kloning Repositori & Masuk ke Folder Proyek
```bash
git clone <url-repositori-anda>
cd ai-content-generator
```

### 2. Instalasi Dependensi
Jalankan perintah berikut untuk menginstal semua library yang dibutuhkan (React, Next.js, Prisma, dll).
```bash
npm install
# atau jika menggunakan yarn/pnpm:
# yarn install
# pnpm install
```

### 3. Konfigurasi Environment Variables
Buat file `.env` di root direktori proyek (jika belum ada) dan sesuaikan konfigurasi database. Untuk SQLite, Anda cukup menambahkan baris berikut:

**`.env`**
```env
DATABASE_URL="file:./dev.db"
```
*(Catatan: Anda juga bisa menyalin `.env.example` ke `.env` jika tersedia).*

### 4. Menjalankan Migrasi Database (Prisma)
Agar struktur tabel database sesuai dengan skema yang ada di `prisma/schema.prisma`, jalankan perintah migrasi. Ini juga akan meng-generate Prisma Client.
```bash
npx prisma migrate dev --name init
```
*Perintah ini akan membuat file database SQLite baru di folder `prisma/dev.db` (jika belum ada) dan menyinkronkan skemanya.*

### 5. Menjalankan Seeder Database
Untuk mengisi database dengan data awal (seperti template banner default), jalankan perintah seed:
```bash
npx prisma db seed
# atau
npm run seed
```
*Script seeder (`prisma/seed.ts`) akan memasukkan data-data contoh seperti template banner "Review Buku", "Kutipan", dan "Promosi Podcast" ke dalam database.*

### 6. Menjalankan Server Development
Sekarang aplikasi sudah siap digunakan! Jalankan server pengembangan (development server):
```bash
npm run dev
# atau
yarn dev
# atau
pnpm dev
```

Buka [http://localhost:3300](http://localhost:3300) (atau port yang tertera pada terminal Anda) di browser web untuk melihat hasilnya.

---

## 🛠️ Perintah Berguna (Scripts)

Berikut adalah beberapa perintah tambahan yang sering digunakan selama masa pengembangan:

- `npm run dev` : Menjalankan aplikasi dalam mode *development* (biasanya berjalan di port 3300).
- `npm run build` : Mem-build aplikasi untuk *production*.
- `npm run start` : Menjalankan aplikasi versi *production* (pastikan sudah dibuild sebelumnya).
- `npm run lint` : Menjalankan linter untuk mengecek penulisan kode (ESLint).
- `npx prisma studio` : Membuka antarmuka grafis di browser untuk melihat dan mengelola isi database.

## 🗂️ Struktur Penting Proyek
- `src/app/` : Berisi sistem *routing* (halaman dan API) bawaan Next.js App Router.
- `src/components/` : Komponen antarmuka pengguna (UI) React yang dapat digunakan ulang.
- `prisma/` : Konfigurasi database, migrasi, dan script seeder (`schema.prisma` dan `seed.ts`).
- `public/` : Berisi aset statis (gambar, favicon, dll).
