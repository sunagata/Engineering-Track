# Daily Engineering Log

Web app pribadi buat catat project, aktivitas, dan ringkasan kerja harian. Data tersimpan di Supabase jadi otomatis sinkron antara HP dan laptop. Sudah dikonfigurasi sebagai PWA — bisa di-install ke home screen HP seperti app biasa.

## 1. Setup Supabase (database + login)

1. Buka [supabase.com](https://supabase.com), daftar gratis, klik **New project**.
2. Kasih nama project (misal `engineering-log`), pilih password database (simpan baik-baik), pilih region terdekat (Singapore), klik **Create**. Tunggu kurang lebih 2 menit sampai project siap.
3. Di sidebar kiri, klik **SQL Editor** > **New query**. Buka file `supabase/schema.sql` di project ini, copy semua isinya, paste ke editor, klik **Run**. Ini akan membuat semua tabel yang dibutuhkan (projects, activities, targets, daily_reflections).
4. Di sidebar, klik **Project Settings** > **API**. Catat dua nilai ini:
   - **Project URL**
   - **anon public key**
5. Login ke app pakai magic link (link lewat email) sudah aktif secara default di Supabase, jadi tidak perlu setting tambahan.

## 2. Jalankan di komputer kamu

```bash
npm install
cp .env.example .env
```

Buka file `.env`, isi dengan nilai dari langkah 1.4:

```
VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=...
```

Lalu jalankan:

```bash
npm run dev
```

Buka `http://localhost:5173`, masukkan email kamu, cek inbox, klik link masuk. Setelah itu dashboard langsung muncul (masih kosong, tinggal mulai tambah project/aktivitas).

## 3. Deploy ke web (gratis)

1. Push folder ini ke repo GitHub baru.
2. Buka [vercel.com](https://vercel.com), login pakai GitHub, klik **Add New Project**, pilih repo ini.
3. Di bagian **Environment Variables**, tambahkan `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` dengan nilai yang sama seperti di `.env`.
4. Klik **Deploy**. Setelah selesai kamu dapat URL publik (misal `engineering-log.vercel.app`) yang bisa diakses dari HP atau laptop manapun, datanya selalu sinkron karena sama-sama nyambung ke Supabase yang sama.

## 4. Install sebagai app di HP

Project ini sudah dikonfigurasi pakai `vite-plugin-pwa`, jadi begitu sudah online di Vercel (otomatis HTTPS):

- **Android (Chrome)**: buka URL-nya, tap menu (titik tiga) lalu **Add to Home screen** / **Install app**.
- **iPhone (Safari)**: buka URL-nya, tap tombol Share lalu **Add to Home Screen**.

Icon dan nama app akan muncul seperti app native. Ganti `public/icon-192.png` dan `public/icon-512.png` dengan logo kamu sendiri kapan saja — ukurannya harus tetap 192x192 dan 512x512 piksel.

## Struktur data

- `projects` — daftar project aktif (nama, progress, status, priority)
- `activities` — log aktivitas per tanggal (kategori, durasi, jam mulai/selesai)
- `targets` — target untuk besok
- `daily_reflections` — mood, pencapaian, kendala, catatan pribadi per tanggal

Semua tabel dibatasi Row Level Security, jadi setiap akun cuma bisa lihat dan ubah data miliknya sendiri — aman dipakai walau URL-nya publik.

## Langkah lanjutan (opsional, kalau nanti perlu)

- **Ringkasan mingguan otomatis** — query 7 hari terakhir dari tabel `activities`, tinggal minta dibuatkan kalau sudah mulai pakai harian.
- **Native app store** — wrap project ini pakai Capacitor (capacitorjs.com) kalau suatu saat mau publish ke Play Store/App Store.
