> Tugas Responsi 1

| | |
|---|---|
| **Nama** | Muhammad Khiesichella Putra Yudanto |
| **NIM** | 21120124140122 |
| **Base URL (Vercel)** | `https://GANTI-DENGAN-URL-VERCEL-KAMU.vercel.app` |

---

## 1. Deskripsi & Tujuan Proyek

Library Loan API menyediakan layanan backend untuk mencatat dan memantau peminjaman buku. API ini mencakup tiga sumber daya (*resource*): **anggota** (`members`), **buku** (`books`), dan **peminjaman** (`loans`).

Tujuan proyek:

- Mengimplementasikan arsitektur RESTful API dengan operasi **CRUD** lengkap.
- Menerapkan pemisahan kode ke dalam **model, controller, dan router**.
- Menghubungkan Express.js dengan database **Supabase**.
- Menyediakan **filter query**, misalnya `GET /loans?status=Terlambat`, untuk menemukan peminjaman yang melewati jatuh tempo.
- Menggunakan **environment variable** dan men-*deploy* API agar dapat diakses publik melalui Vercel.

### Fitur utama

- CRUD anggota, buku, dan peminjaman.
- Filter peminjaman berdasarkan `status`, `member_id`, dan `book_id` (bisa digabung).
- Status **Terlambat dihitung otomatis** dari tanggal jatuh tempo, sehingga tidak pernah basi.
- **Stok buku otomatis** berkurang saat dipinjam dan bertambah saat dikembalikan.
- Endpoint khusus pengembalian buku: `PATCH /loans/:id/return`.
- Validasi input dan pesan error yang konsisten (400 / 404 / 409 / 500).

---

## 2. Struktur Data / Schema

Script lengkap ada di [`database/schema.sql`](database/schema.sql).

### Relasi

```
members (1) ────< loans >──── (1) books
```

Satu anggota dapat memiliki banyak peminjaman, dan satu buku dapat dipinjam berkali-kali.

### Tabel `members`

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | uuid (PK) | Dibuat otomatis |
| `name` | text | **Wajib** |
| `email` | text | Unik |
| `phone` | text | |
| `address` | text | |

### Tabel `books`

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | uuid (PK) | Dibuat otomatis |
| `title` | text | **Wajib** |
| `author` | text | |
| `isbn` | text | Unik |
| `stock` | integer | Default 1, minimal 0 |

### Tabel `loans`

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | uuid (PK) | Dibuat otomatis |
| `member_id` | uuid (FK → members.id) | **Wajib** |
| `book_id` | uuid (FK → books.id) | **Wajib** |
| `loan_date` | date | Default hari ini |
| `due_date` | date | Default `loan_date` + 7 hari |
| `return_date` | date | Terisi saat buku dikembalikan |
| `status` | text | `Dipinjam` / `Dikembalikan` (tersimpan di DB) |
| `created_at` | timestamptz | Dibuat otomatis |

### Aturan status

| Status | Arti | Cara ditentukan |
|---|---|---|
| `Dipinjam` | Sedang dipinjam, belum jatuh tempo | Tersimpan di database |
| `Dikembalikan` | Sudah dikembalikan | Tersimpan di database |
| `Terlambat` | Belum dikembalikan **dan** `due_date` < hari ini | **Dihitung otomatis** oleh API (zona waktu WIB) |

---

## 3. Daftar Endpoint

| Method | Endpoint | Fungsi |
|---|---|---|
| GET | `/` | Cek status API |
| GET | `/members` | Daftar anggota |
| GET | `/members/:id` | Detail anggota |
| POST | `/members` | Tambah anggota |
| PUT | `/members/:id` | Ubah anggota |
| DELETE | `/members/:id` | Hapus anggota |
| GET | `/books` | Daftar buku |
| GET | `/books/:id` | Detail buku |
| POST | `/books` | Tambah buku |
| PUT | `/books/:id` | Ubah buku |
| DELETE | `/books/:id` | Hapus buku |
| GET | `/loans` | Daftar peminjaman (mendukung filter) |
| GET | `/loans/:id` | Detail peminjaman |
| POST | `/loans` | Catat peminjaman baru |
| PUT | `/loans/:id` | Ubah `loan_date`, `due_date`, atau `status` |
| PATCH | `/loans/:id/return` | Kembalikan buku |
| DELETE | `/loans/:id` | Hapus data peminjaman |

### Filter query pada `GET /loans`

| Parameter | Contoh | Keterangan |
|---|---|---|
| `status` | `?status=Terlambat` | `Dipinjam`, `Dikembalikan`, atau `Terlambat` (tidak peka huruf besar/kecil) |
| `member_id` | `?member_id=<uuid>` | Peminjaman milik satu anggota |
| `book_id` | `?book_id=<uuid>` | Peminjaman satu buku |

Filter dapat digabung: `GET /loans?status=Terlambat&member_id=<uuid>`.

---

## 4. Contoh Request & Response

Ganti `BASE_URL` dengan `http://localhost:3000` (lokal) atau URL Vercel kamu.

### 4.1 Tambah anggota — `POST /members`

```bash
curl -X POST BASE_URL/members \
  -H "Content-Type: application/json" \
  -d '{"name":"Budi Santoso","email":"budi@email.com","phone":"08123456789","address":"Jl. Merdeka No. 10, Semarang"}'
```

**Response `201 Created`**

```json
{
  "message": "Anggota berhasil ditambahkan",
  "data": {
    "id": "a99b9ccf-18ba-4d80-a26a-71397bc608e1",
    "name": "Budi Santoso",
    "email": "budi@email.com",
    "phone": "08123456789",
    "address": "Jl. Merdeka No. 10, Semarang"
  }
}
```

### 4.2 Tambah buku — `POST /books`

```bash
curl -X POST BASE_URL/books \
  -H "Content-Type: application/json" \
  -d '{"title":"Laskar Pelangi","author":"Andrea Hirata","isbn":"9789793062792","stock":3}'
```

**Response `201 Created`**

```json
{
  "message": "Buku berhasil ditambahkan",
  "data": {
    "id": "fd83c86e-de74-43f9-b0e0-60706000bc0f",
    "title": "Laskar Pelangi",
    "author": "Andrea Hirata",
    "isbn": "9789793062792",
    "stock": 3
  }
}
```

### 4.3 Catat peminjaman — `POST /loans`

`loan_date` dan `due_date` opsional. Jika dikosongkan, `loan_date` = hari ini dan `due_date` = 7 hari setelahnya. Stok buku berkurang 1.

```bash
curl -X POST BASE_URL/loans \
  -H "Content-Type: application/json" \
  -d '{"member_id":"a99b9ccf-18ba-4d80-a26a-71397bc608e1","book_id":"fd83c86e-de74-43f9-b0e0-60706000bc0f"}'
```

**Response `201 Created`**

```json
{
  "message": "Peminjaman berhasil dicatat",
  "data": {
    "id": "5ac0f46f-75a2-436b-9d88-e64e6390597c",
    "member_id": "a99b9ccf-18ba-4d80-a26a-71397bc608e1",
    "book_id": "fd83c86e-de74-43f9-b0e0-60706000bc0f",
    "loan_date": "2026-10-08",
    "due_date": "2026-10-15",
    "return_date": null,
    "status": "Dipinjam",
    "created_at": "2026-10-08T03:12:45.123Z",
    "members": { "id": "a99b9ccf-18ba-4d80-a26a-71397bc608e1", "name": "Budi Santoso", "email": "budi@email.com" },
    "books": { "id": "fd83c86e-de74-43f9-b0e0-60706000bc0f", "title": "Laskar Pelangi", "author": "Andrea Hirata" }
  }
}
```

### 4.4 Filter peminjaman terlambat — `GET /loans?status=Terlambat`

```bash
curl "BASE_URL/loans?status=Terlambat"
```

**Response `200 OK`**

```json
{
  "count": 1,
  "data": [
    {
      "id": "0c1f5d2e-3a4b-4c6d-8e7f-9a0b1c2d3e4f",
      "member_id": "a99b9ccf-18ba-4d80-a26a-71397bc608e1",
      "book_id": "fd83c86e-de74-43f9-b0e0-60706000bc0f",
      "loan_date": "2026-09-24",
      "due_date": "2026-10-01",
      "return_date": null,
      "status": "Terlambat",
      "created_at": "2026-09-24T02:00:00.000Z",
      "members": { "id": "a99b9ccf-18ba-4d80-a26a-71397bc608e1", "name": "Budi Santoso", "email": "budi@email.com" },
      "books": { "id": "fd83c86e-de74-43f9-b0e0-60706000bc0f", "title": "Laskar Pelangi", "author": "Andrea Hirata" }
    }
  ]
}
```

### 4.5 Ubah jatuh tempo (perpanjangan) — `PUT /loans/:id`

```bash
curl -X PUT BASE_URL/loans/5ac0f46f-75a2-436b-9d88-e64e6390597c \
  -H "Content-Type: application/json" \
  -d '{"due_date":"2026-10-22"}'
```

**Response `200 OK`**

```json
{
  "message": "Peminjaman berhasil diperbarui",
  "data": { "id": "5ac0f46f-75a2-436b-9d88-e64e6390597c", "due_date": "2026-10-22", "status": "Dipinjam", "...": "..." }
}
```

### 4.6 Kembalikan buku — `PATCH /loans/:id/return`

Mengubah status menjadi `Dikembalikan`, mengisi `return_date` dengan hari ini, dan menambah stok buku 1.

```bash
curl -X PATCH BASE_URL/loans/5ac0f46f-75a2-436b-9d88-e64e6390597c/return
```

**Response `200 OK`**

```json
{
  "message": "Buku berhasil dikembalikan",
  "data": { "id": "5ac0f46f-75a2-436b-9d88-e64e6390597c", "return_date": "2026-10-09", "status": "Dikembalikan", "...": "..." }
}
```

### 4.7 Hapus peminjaman — `DELETE /loans/:id`

```bash
curl -X DELETE BASE_URL/loans/5ac0f46f-75a2-436b-9d88-e64e6390597c
```

**Response `200 OK`**

```json
{ "message": "Data peminjaman berhasil dihapus" }
```

### 4.8 Contoh error

| Kasus | Status | Response |
|---|---|---|
| Nilai `status` filter tidak valid | 400 | `{"error":"Status tidak valid. Gunakan salah satu: Dipinjam, Dikembalikan, Terlambat"}` |
| `member_id` / `book_id` tidak dikirim | 400 | `{"error":"member_id dan book_id wajib diisi"}` |
| Format tanggal salah | 400 | `{"error":"due_date harus berformat YYYY-MM-DD"}` |
| ID tidak ditemukan | 404 | `{"error":"Data tidak ditemukan"}` |
| Stok buku habis | 409 | `{"error":"Stok buku \"Laskar Pelangi\" habis"}` |
| Buku sudah dikembalikan | 409 | `{"error":"Buku sudah dikembalikan sebelumnya"}` |
| Hapus anggota/buku yang masih punya peminjaman | 409 | `{"error":"Data masih berelasi dengan data lain atau referensi tidak valid"}` |

---

## 5. Panduan Instalasi & Menjalankan Secara Lokal

### Prasyarat

- [Node.js](https://nodejs.org/) v18 atau lebih baru
- Akun [Supabase](https://supabase.com/)
- [Postman](https://www.postman.com/) atau `curl` untuk pengujian

### Langkah-langkah

**1. Clone repository**

```bash
git clone https://github.com/USERNAME-KAMU/library-loan-api.git
cd library-loan-api
```

**2. Siapkan database di Supabase**

1. Buat project baru di Supabase.
2. Buka **SQL Editor → New query**, salin isi [`database/schema.sql`](database/schema.sql), lalu klik **RUN**.
3. *(Opsional)* Jalankan [`database/seed.sql`](database/seed.sql) untuk data contoh, termasuk satu peminjaman yang sudah terlambat.
4. Pastikan tiga tabel (`members`, `books`, `loans`) muncul di **Table Editor**.

> **Catatan:** tabel yang dibuat lewat SQL Editor memiliki Row Level Security (RLS) nonaktif secara default, sehingga dapat diakses dengan `anon key`. Jika kamu mengaktifkan RLS, tambahkan *policy* yang sesuai.

**3. Ambil kredensial Supabase**

Buka **Project Settings → API**, lalu salin **Project URL** dan **anon public key**.

**4. Buat file `.env`**

```bash
cp .env.example .env
```

Isi nilainya:

```env
SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
SUPABASE_KEY=eyJhbGciOi...
PORT=3000
```

**5. Install dependency**

```bash
npm install
```

**6. Jalankan server**

```bash
npm run dev     # mode development (nodemon)
# atau
npm start       # mode produksi
```

Jika berhasil akan tampil `Server running on port 3000`. Coba buka <http://localhost:3000/loans>.

### Struktur folder

```
library-loan-api/
├── database/
│   ├── schema.sql            # DDL tabel
│   └── seed.sql              # data contoh (opsional)
├── src/
│   ├── config/
│   │   └── supabaseClient.js # inisialisasi klien Supabase
│   ├── controllers/          # logika request/response
│   │   ├── bookController.js
│   │   ├── loanController.js
│   │   └── memberController.js
│   ├── models/               # akses database & logika bisnis
│   │   ├── bookModel.js
│   │   ├── loanModel.js
│   │   └── memberModel.js
│   ├── routes/               # pemetaan URL → controller
│   │   ├── bookRoutes.js
│   │   ├── loanRoutes.js
│   │   └── memberRoutes.js
│   ├── utils/
│   │   └── helpers.js        # validasi tanggal & penanganan error
│   └── index.js              # entry point Express
├── .env.example
├── .gitignore
├── package.json
├── vercel.json
└── README.md
```

---

## 6. Deployment ke Vercel

1. Push proyek ke repository GitHub (**pastikan `.env` tidak ikut ter-commit**).
2. Login ke <https://vercel.com/> → **Add New… → Project** → pilih repository ini → **Import**.
3. Pada **Environment Variables**, tambahkan:
   - `SUPABASE_URL` → Project URL Supabase
   - `SUPABASE_KEY` → anon public key Supabase
4. Klik **Deploy** dan tunggu build selesai.
5. Uji endpoint menggunakan URL publik yang diberikan Vercel.

### 🔗 Link Deployment

| | |
|---|---|
| **Base URL** | `https://GANTI-DENGAN-URL-VERCEL-KAMU.vercel.app` |
| **Contoh endpoint** | `https://GANTI-DENGAN-URL-VERCEL-KAMU.vercel.app/loans` |
| **Contoh filter** | `https://GANTI-DENGAN-URL-VERCEL-KAMU.vercel.app/loans?status=Terlambat` |

---

## 7. Teknologi

- [Node.js](https://nodejs.org/) (ES Modules)
- [Express.js](https://expressjs.com/) v5
- [Supabase](https://supabase.com/) (PostgreSQL) via `@supabase/supabase-js`
- [dotenv](https://www.npmjs.com/package/dotenv)
- [Vercel](https://vercel.com/) (`@vercel/node`)
