# Server

Backend Maduraa berbasis Node.js dan Express. Source backend berada di workspace ini dan terpisah dari aplikasi frontend di `client/`.

## Struktur

- `src/index.js` — entry point dan konfigurasi Express.
- `src/routes/` — definisi endpoint API.
- `src/controllers/` — logika penanganan request.
- `src/middlewares/` — middleware Express.
- `.env.example` — contoh variabel lingkungan backend.

## Menjalankan

```bash
cd server
npm install
npm run dev
```

Gunakan `npm start` untuk menjalankan tanpa mode watch. Jangan commit file `.env` atau credential nyata.
