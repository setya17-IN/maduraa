# API Specification

Dokumen ini menjelaskan kontrak API yang saat ini tersedia di backend Maduraa.
Semua endpoint menggunakan prefix `/api/v1`. Contoh memakai `http://localhost:5000` sebagai base URL lokal.

## Format umum

- Request dan response menggunakan JSON, kecuali endpoint health.
- Endpoint yang ditandai **Bearer token** memerlukan header `Authorization: Bearer <token>`.
- ID kategori, produk, dan transaksi berbentuk UUID.
- Response sukses umumnya berbentuk `{ "status": "success", "message": "...", "data": ... }`.
- Response gagal dari helper umumnya berbentuk `{ "status": "error", "message": "..." }`. Beberapa endpoint autentikasi dan middleware mengembalikan bentuk yang sedikit berbeda seperti dijelaskan di bawah.

## Health check

| Method | Endpoint | Auth | Fungsi |
|---|---|---|---|
| GET | `/health` | Tidak | Memeriksa server API |

Contoh response `200`:

```json
{ "status": "ok", "timestamp": "2026-10-21T00:00:00.000Z" }
```

## Authentication

| Method | Endpoint | Auth | Fungsi |
|---|---|---|---|
| POST | `/auth/register` | Tidak | Membuat akun |
| POST | `/auth/login` | Tidak | Login dan memperoleh JWT |
| GET | `/auth/me` | Bearer token | Mengambil klaim pengguna dari token |

### `POST /auth/register`

Request:

```json
{ "name": "Nama Pengguna", "email": "user@example.com", "password": "password-rahasia" }
```

`name`, `email`, dan `password` wajib diisi. Backend meng-hash password sebelum disimpan. `role` saat ini dapat dikirim oleh pemanggil dan memiliki default `user`; pembatasan role belum diterapkan.

Response `201`:

```json
{
  "status": "success",
  "message": "Registrasi berhasil! Silakan login.",
  "data": { "id": "<uuid>", "name": "Nama Pengguna", "email": "user@example.com", "role": "user" }
}
```

### `POST /auth/login`

Request:

```json
{ "email": "user@example.com", "password": "password-rahasia" }
```

Response `200`:

```json
{
  "status": "success",
  "message": "Login berhasil",
  "token": "<jwt>",
  "user": { "id": "<uuid>", "name": "Nama Pengguna", "email": "user@example.com", "role": "user" }
}
```

Kredensial yang tidak cocok menghasilkan `401`. Field wajib yang kosong menghasilkan `400`.

### `GET /auth/me`

Response `200`:

```json
{
  "status": "success",
  "message": "Profil pengguna berhasil diambil",
  "user": { "id": "<uuid>", "email": "user@example.com", "role": "user", "iat": 0, "exp": 0 }
}
```

`user` adalah klaim JWT; endpoint ini tidak mengambil ulang profil dari database.

## Categories

Semua endpoint kategori memerlukan Bearer token.

| Method | Endpoint | Fungsi |
|---|---|---|
| GET | `/categories` | Daftar kategori, diurutkan berdasarkan nama |
| POST | `/categories` | Membuat kategori |
| PUT | `/categories/:id` | Mengubah nama kategori |
| DELETE | `/categories/:id` | Menghapus kategori |

Request untuk `POST` dan `PUT`:

```json
{ "name": "Minuman" }
```

Nama wajib diisi. Nama duplikat (tanpa membedakan huruf besar/kecil) menghasilkan `409`. Response daftar berisi array kategori di dalam `data`, misalnya `{ "id": "<uuid>", "name": "Minuman", "created_at": "..." }`.

## Products

Semua endpoint produk memerlukan Bearer token.

| Method | Endpoint | Fungsi |
|---|---|---|
| GET | `/products` | Daftar produk dengan pencarian dan pagination |
| GET | `/products/:id` | Detail produk |
| POST | `/products` | Membuat produk |
| PUT | `/products/:id` | Mengubah field produk yang dikirim |
| DELETE | `/products/:id` | Menghapus produk |

### Daftar dan pencarian

Query opsional: `page` (default `1`), `limit` (default `20`), `search` (mencari nama produk), dan `category_id`.

Contoh: `GET /products?page=1&limit=20&search=kopi&category_id=<uuid>`.

Response `200` memiliki `data` berupa array produk (termasuk `category_name`) serta metadata pagination:

```json
{
  "status": "success",
  "message": "Daftar produk berhasil diambil",
  "data": [{ "id": "<uuid>", "name": "Kopi", "category_id": "<uuid>", "category_name": "Minuman", "purchase_price": "1000", "selling_price": "1500", "stock": 10, "unit": "pcs", "image_url": null }],
  "pagination": { "page": 1, "limit": 20, "total": 1, "totalPages": 1 }
}
```

### Membuat dan mengubah produk

Request `POST /products` (nama dan `selling_price` wajib):

```json
{
  "name": "Kopi",
  "category_id": "<uuid>",
  "purchase_price": 1000,
  "selling_price": 1500,
  "stock": 10,
  "unit": "pcs",
  "image_url": null
}
```

Untuk `PUT`, kirim satu atau lebih field yang ingin diubah dari daftar field tersebut. Field yang tidak dikirim tidak diubah.

## Transactions

Semua endpoint transaksi memerlukan Bearer token.

| Method | Endpoint | Fungsi |
|---|---|---|
| POST | `/transactions` | Membuat transaksi dan mengurangi stok |
| GET | `/transactions` | Daftar transaksi dengan pagination |
| GET | `/transactions/:id` | Detail transaksi beserta item |

### Membuat transaksi

Request:

```json
{
  "items": [
    { "product_id": "<uuid>", "quantity": 2 },
    { "product_id": "<uuid>", "quantity": 1 }
  ]
}
```

`items` wajib berisi setidaknya satu item; `quantity` harus integer positif. Harga diambil dari database, total dihitung server, dan stok dikurangi dalam transaksi database. Jika produk tidak ditemukan atau stok tidak cukup, operasi dibatalkan. Response `201` berisi `data.transaction` dan `data.items`.

**Catatan integrasi:** saat ini controller tidak menerima atau menyimpan `payment_method`, meskipun kolom tersebut ada di tabel. Jangan mengandalkan field itu sampai implementasi backend diperbarui.

### Membaca transaksi

`GET /transactions` menerima query `page` (default `1`) dan `limit` (default `20`). Response menempatkan array di `data.transactions` dan pagination di `data.pagination`. `GET /transactions/:id` mengembalikan data transaksi dan array `items` di dalam `data`.

## Dashboard dan laporan

Kedua endpoint memerlukan Bearer token.

| Method | Endpoint | Fungsi |
|---|---|---|
| GET | `/dashboard/summary` | Ringkasan omzet, transaksi, keuntungan perkiraan, produk terlaris, dan stok menipis |
| GET | `/reports/sales` | Ringkasan laporan penjualan dengan filter periode |

Dashboard response `data` memuat `today_revenue`, `month_revenue`, `today_transactions`, `month_profit_estimate`, `top_products`, dan `low_stock_products`.

Laporan menerima salah satu query `type=daily`, `type=weekly`, atau `type=monthly` (default `monthly`), atau pasangan `start_date=YYYY-MM-DD&end_date=YYYY-MM-DD`. Response `data` memuat `period`, `total_revenue`, `total_transactions`, `total_profit_estimate`, `daily_breakdown`, dan `top_products`.

## Error dan status umum

| Status | Arti umum |
|---|---|
| 400 | Input tidak valid atau field wajib tidak ada |
| 401 | Token tidak ada atau kredensial login salah |
| 403 | Token tidak valid/kedaluwarsa |
| 404 | Endpoint atau record tidak ditemukan |
| 409 | Konflik, seperti nama kategori duplikat |
| 500 | Kesalahan server atau database |

Middleware autentikasi saat ini merespons `{ "message": "..." }` tanpa field `status`. Error database lain dapat menyertakan pesan internal; format error terstandar dan validasi query yang lebih ketat masih perlu diselaraskan.

## Belum tersedia

- `/auth/logout` dan `/auth/session` belum memiliki route. JWT saat ini stateless; logout dilakukan dengan menghapus token di sisi client.
- Pembatasan akses berdasarkan role belum tersedia.
- Filter tanggal khusus hanya diterapkan jika `start_date` dan `end_date` dikirim bersama-sama; format tanggal belum divalidasi khusus oleh controller.
- Upload foto produk belum tersedia sebagai endpoint; produk hanya menerima `image_url`.
