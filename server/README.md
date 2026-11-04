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

```bash
npm install
npm run dev
```

Gunakan `npm start` untuk menjalankan tanpa mode watch. Jangan commit file `.env` atau credential nyata.

Sebelum menggunakan logout JWT, siapkan tabel revokasi token dengan `npm run db:create-revoked-tokens`. Akun admin harus diberikan melalui proses administratif tepercaya; registrasi publik selalu membuat akun `user`.

Jalankan unit test autentikasi dengan `npm test`.

## Kualitas kode

```bash
npm run lint
npm run lint:fix
npm run format
npm run format:check
```
