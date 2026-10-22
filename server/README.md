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

Salin `.env.example` menjadi `.env` di direktori `server/`, lalu isi `DATABASE_URL`, `JWT_SECRET`, dan variabel backend lain yang diperlukan. Jangan gunakan file env backend di frontend.

```bash
npm install
npm run dev
```

Gunakan `npm start` untuk menjalankan tanpa mode watch. Jangan commit file `.env` atau credential nyata.

## Kualitas kode

```bash
npm run lint
npm run lint:fix
npm run format
npm run format:check
```
