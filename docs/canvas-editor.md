# Dokumentasi Canvas Editor (AsikReview)

Modul **Canvas Editor** pada AsikReview (`src/app/dashboard/canvas/[id]/page.tsx`) adalah sebuah editor visual *drag-and-drop* berbasis React yang dirancang untuk membuat *banner* atau *cover* artikel secara fleksibel.

Berikut adalah penjelasan fitur utama dan cara kerjanya secara teknis:

## 1. Arsitektur State Management
State utama editor disimpan di dalam komponen menggunakan `useState`:
- `elements`: Menyimpan struktur JSON dari elemen-elemen canvas (teks, gambar, *shape*, grup).
- `selectedIds`: Sebuah array bertipe `string[]` yang melacak ID elemen mana saja yang sedang diklik/dipilih oleh pengguna.
- `past` dan `future`: Digunakan untuk mekanisme *Undo* dan *Redo*.

**Mekanisme Undo/Redo (History):**
Setiap kali terjadi perubahan diskrit (menambah/menghapus elemen, mengelompokkan elemen) atau **sebelum** modifikasi kontinu dimulai (*onDragStart*, *onResizeStart*, *onFocus* pada input teks), sistem akan memanggil fungsi `saveHistory()`. Fungsi ini akan mendorong (*push*) kondisi `elements` saat ini ke array `past` dan mengosongkan array `future`.

## 2. Multi-Select (Pilih Banyak)
Pengguna dapat memilih banyak elemen sekaligus dengan menahan tombol `Shift` saat mengklik elemen.
- **Logika Teknis:** Pada *event* `onClick` elemen, jika `e.shiftKey` bernilai *true*, ID elemen tersebut ditambahkan (atau dihapus jika sudah ada) ke `selectedIds`. Jika tidak, `selectedIds` di-*reset* dan hanya diisi oleh elemen yang diklik.

## 3. Multi-Drag (Geser Bersama)
Saat pengguna men-*drag* sebuah elemen yang sedang terpilih bersama elemen lain, sistem akan memindahkan semua elemen terpilih secara sinkron.
- **Logika Teknis (`handleDragMulti`):**
  Alih-alih mengandalkan *event handler* standar yang hanya memberikan kordinat baru elemen individual, fungsi ini akan mencari *delta* (selisih kordinat `X` dan `Y`) antara letak elemen saat ditarik dan letak elemen tersebut di state sebelumnya (`draggedPrev`). Nilai *delta* ini (contoh: *geser kanan 10px, bawah 5px*) kemudian ditambahkan ke koordinat `x` dan `y` milik seluruh elemen yang memiliki ID di dalam `selectedIds`.

## 4. Fitur Group & Ungroup
Konsep grup di sini menggunakan pendekatan "Wadah / *Bounding Box*" permanen, mirip dengan aplikasi desain profesional.

**Cara Kerja `handleGroup`:**
1. Mencari elemen apa saja yang terpilih.
2. Menghitung *Bounding Box* terluar (batas kiri paling jauh, atas paling tinggi, lebar total, dan tinggi total) dari kumpulan elemen tersebut.
3. Membuat elemen baru bertipe `group` dengan dimensi *Bounding Box* tersebut.
4. Menambahkan properti `groupId` ke elemen-elemen terpilih yang merujuk pada ID grup baru.
5. **Mengubah koordinat anak:** Kordinat `x` dan `y` dari anak-anak tersebut diubah menjadi *relatif* terhadap wadah grup (mengurangi koordinat aslinya dengan koordinat `X` & `Y` grup).

**Cara Kerja Rendering (`renderElementContent` & Map Utama):**
- Di *root* / lapisan teratas canvas, kita HANYA melakukan *mapping* pada elemen yang BUKAN anak dari grup (elemen yang tidak memiliki `groupId`).
- Jika elemen teratas tersebut bertipe `group`, fungsi akan kembali me-render div *absolute* yang melakukan *looping* untuk memanggil `renderElementContent` dari anak-anaknya. Hal ini memastikan wadah grup dapat digeser sebagai satu kesatuan objek.

**Cara Kerja `handleUngroup`:**
1. Menghapus elemen bertipe `group`.
2. Menghapus `groupId` dari anak-anaknya.
3. Mengembalikan koordinat anak-anaknya ke posisi absolut canvas (menambahkan kembali koordinat `X` dan `Y` dari grup lama ke koordinat anak).

## 5. Fitur Data-Binding
Elemen *text* dan *image* memiliki kemampuan untuk di-"ikat" (*bound*) ke variabel data artikel/konten. Properti ini disimpan di `CanvasElement.bindTo`.
- Jika `bindTo` bukan "none", input teks pada panel kanan akan dinonaktifkan (*disabled*).
- Pada saat dirender (`renderElementContent`), fungsi akan mengecek apakah ada `bindTo`. Jika ya (contoh: `title`), ia akan menimpa (`override`) isi `text` dengan data judul utama artikel sebelum dirender ke DOM.
- **Khusus Tags (Flex Container):** Jika *bindTo* disetel ke `"tags"`, tipe teks biasa tidak akan digunakan. Sebaliknya, string daftar tag (dipisahkan oleh koma) akan dipecah dan dirender menjadi *chip/badge* di dalam sebuah Flexbox (`display: flex, flex-wrap: wrap`).

## 6. Export ke PNG (html2canvas)
Untuk mengunduh, canvas (DOM Node) akan diduplikasi secara virtual (*clone*). 
Gambar *remote* dari internet (misal: Unsplash) sering bermasalah dengan CORS (*Cross-Origin Resource Sharing*) saat di-*render* ke canvas. Oleh karena itu, terdapat fungsi asinkron pembantu (`inlineImages`) yang bertugas mengonversi URL gambar menjadi `data:image/base64` secara internal sebelum *html2canvas* mengambil *screenshot*.

---
*(Dokumentasi ini mencerminkan struktur internal Canvas Editor hingga tahap pembaruan Grouping & Multi-Select).*
