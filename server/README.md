# Server

Backend Maduraa berbasis Node.js dan Express.

## Struktur

- `src/app.js` — konfigurasi Express, middleware, dan route.
- `src/server.js` — memuat environment dan menjalankan HTTP server.
- `src/controllers/` — logika penanganan request.
- `src/routes/` — definisi endpoint API.
- `src/middlewares/` — middleware Express.
- `.env.example` — contoh variabel lingkungan backend.

## Menjalankan

Salin `.env.example` menjadi `.env` di direktori `server/`, lalu isi `DATABASE_URL`, `JWT_SECRET`, dan variabel backend lain yang diperlukan. `JWT_SECRET` wajib berupa nilai rahasia unik minimal 32 karakter; gunakan secret acak dari environment/deployment secret manager. Jangan gunakan file env backend di frontend.
`DATABASE_SSL` aktif secara default; nonaktifkan hanya untuk database lokal yang tidak memakai TLS.

```bash
npm install
npm run dev
```

Gunakan `npm start` untuk menjalankan tanpa mode watch. Jangan commit file `.env` atau credential nyata.

Akun tidak dapat mendaftar sendiri. Buat akun `owner` dan `cashier` melalui `npm run db:seed-users`; skrip membaca `OWNER_EMAIL`, `OWNER_PASSWORD`, `CASHIER_EMAIL`, dan `CASHIER_PASSWORD` dari `server/.env`. Akun yang sudah ada tidak diubah. Gunakan `npm run db:seed-users -- --reset-password` hanya jika memang ingin mengganti password akun yang ada. Endpoint mutasi katalog serta dashboard/laporan memerlukan role `owner`.

Sebelum menggunakan logout JWT, siapkan tabel revokasi token dengan `npm run db:create-revoked-tokens` atau terapkan definisi `revoked_tokens` di `docs/database_schema.sql`. Login dibatasi hingga 10 percobaan gagal dari IP yang sama dalam 15 menit; percobaan login yang berhasil tidak dihitung.

Jalankan unit test autentikasi dengan `npm test`.

## Kualitas kode

```bash
npm run lint
npm run lint:fix
npm run format
npm run format:check
```
