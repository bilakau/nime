# 🎬 KuzenAnime / MaouAnime

Web streaming anime modern bergaya **Single Page Application (SPA)** yang ringan, cepat, dan responsif. Dibangun dengan fokus pada **User Experience (UX)** yang mulus dan optimasi performa tingkat tinggi.

🌐 **Coba Langsung:** [https://kuzen.my.id/](https://kuzen.my.id/)

---

## 📋 Daftar Isi

- [Fitur Unggulan](#-fitur-unggulan)
- [Arsitektur](#-arsitektur)
- [Tech Stack](#-tech-stack)
- [Struktur Proyek](#-struktur-proyek)
- [Cara Menjalankan (Local)](#-cara-menjalankan-local)
- [Konfigurasi Environment](#-konfigurasi-environment)
- [API Endpoints](#-api-endpoints)
- [Deployment](#-deployment)
- [Troubleshooting](#-troubleshooting)
- [Berkontribusi](#-berkontribusi)
- [Lisensi](#-lisensi)
- [Kredit](#-kredit)

---

## ✨ Fitur Unggulan

- **⚡ Super Cepat** — Navigasi SPA instan dengan *custom buffering overlay*.
- **🎬 Smart Player** — Iframe anti-spam pelacak pihak ketiga dan filter episode reguler yang rapi.
- **🖼️ Smart Thumbnail** — *Background fetching* dan *caching* (`localStorage`) agar gambar selalu muncul dan *loading* web tidak *stuck*.
- **📅 Jadwal Anti-Rate Limit** — Menggunakan *Initial Avatar* agar halaman jadwal ter-*load* instan tanpa risiko IP diblokir oleh API.
- **🔐 Autentikasi Member** — Sistem login/register dengan JWT, password ter-hash via bcrypt.
- **❤️ My List & Riwayat Nonton** — Bookmark anime favorit dan lanjutkan menonton dari episode terakhir.
- **📱 PWA Ready** — Bisa di-install di Android / iOS, mendukung offline shell via Service Worker.
- **🛡️ Failover API** — Otomatis fallback ke API cadangan bila API utama down.

---

## 🏗️ Arsitektur

Proyek ini terdiri dari **dua bagian terpisah**:

```
┌────────────────────────────┐         ┌────────────────────────────┐
│  Frontend (Static SPA)     │  HTTPS  │  Backend (Express)         │
│  • Hosted di Vercel        │ ──────> │  • Hosted di VPS sendiri   │
│  • HTML / Vanilla JS / CSS │         │  • api.kuzen.my.id         │
│  • Tailwind via CDN        │         │  • Auth, Bookmark, History │
│                            │         │  • DB: Supabase (Postgres) │
└────────────────────────────┘         └────────────────────────────┘
              │                                      │
              │                                      ▼
              │                          ┌────────────────────────┐
              └────────────────────────> │  External Anime APIs   │
                                         │  • Otakudesu (Kanata)  │
                                         │  • Sankavollerei       │
                                         └────────────────────────┘
```

> ⚠️ **Penting:** `server.js` (backend Express) hanya berjalan di VPS sendiri (`api.kuzen.my.id`). Vercel hanya meng-host frontend statis. Lihat [Deployment](#-deployment) untuk detail.

---

## 🛠️ Tech Stack

### Frontend
- **HTML5** + **Vanilla JavaScript** (ES6 Modules, *importmap*)
- **Tailwind CSS** (via CDN)
- **SweetAlert2** — popup & alert
- **Font Awesome 6** — icon library
- **Service Worker** — PWA / offline shell

### Backend
- **Node.js 18+** dengan **Express 5**
- **Supabase** (Postgres) via [`@supabase/supabase-js`](https://supabase.com/docs/reference/javascript)
- **JWT** (`jsonwebtoken`) — token sesi 7 hari
- **bcrypt** — hashing password (10 rounds)
- **CORS** — whitelist origin (`kuzen.my.id`, `kuzen.web.id`)
- **dotenv** — manajemen environment variables

### External APIs
- [Otakudesu REST API (Kanata)](https://api.kanata.web.id/otakudesu) — sumber data anime utama
- [Sankavollerei API](https://www.sankavollerei.com/anime) — sumber data tambahan

---

## 📂 Struktur Proyek

```
nime/
├── index.html              # SPA shell (entry point)
├── manifest.json           # PWA manifest
├── sw.js                   # Service Worker
├── robots.txt              # SEO crawler rules
├── sitemap.xml             # SEO sitemap
├── .htaccess               # Apache CORS headers (untuk shared hosting)
├── vercel.json             # Konfigurasi rewrite SPA untuk Vercel
├── .vercelignore           # File yang tidak diupload ke Vercel
├── server.js               # Backend Express (jalan di VPS, BUKAN di Vercel)
├── package.json            # Dependency manifest
├── .env.example            # Template environment vars (copy ke .env)
├── supabase/
│   └── migrations/
│       └── 0001_init_schema.sql   # DDL Postgres untuk Supabase
├── css/
│   └── style.css           # Custom styles + animations
├── js/
│   ├── config.js           # URL API endpoints
│   ├── api.js              # Fetch helpers + fallback
│   ├── auth.js             # Login / Register / JWT handling
│   ├── home.js             # Halaman beranda
│   ├── detail.js           # Halaman detail anime
│   ├── player.js           # Iframe player + filter episode
│   ├── schedule.js         # Jadwal rilis anime
│   ├── genres.js           # Filter genre
│   ├── batch.js            # Download batch
│   ├── mylist.js           # Bookmark / favorit
│   ├── history.js          # Riwayat nonton
│   ├── profile.js          # Halaman profil user
│   ├── donate.js           # Halaman donasi (QRIS)
│   ├── admin.js            # Panel admin
│   ├── gacha.js            # VTuber gacha mini-game
│   └── utils.js            # Helper functions umum
└── img/                    # Asset gambar (icon PWA, og-image, dll)
```

---

## 🚀 Cara Menjalankan (Local)

### 1. Clone Repositori

```bash
git clone https://github.com/bilakau/nime.git
cd nime
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Environment Variables

```bash
cp .env.example .env
```

Lalu edit `.env` dan isi nilai-nilai berikut (lihat juga [Konfigurasi Environment](#-konfigurasi-environment)):

```env
PORT=3000
JWT_SECRET=ganti-dengan-secret-acak-yang-panjang

SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your-anon-public-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

> 🔑 **Tip:** generate `JWT_SECRET` cepat dengan `openssl rand -hex 64`.

### 4. Setup Database (Supabase)

1. Buat project di [https://supabase.com/dashboard](https://supabase.com/dashboard).
2. Ambil kredensial dari **Project Settings → API**:
   - `Project URL` → `SUPABASE_URL`
   - `anon public` → `SUPABASE_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY` (rahasia! jangan expose di browser)
3. Buka **SQL Editor** → **New Query**, paste isi file [`supabase/migrations/0001_init_schema.sql`](supabase/migrations/0001_init_schema.sql), jalankan.
   File ini membuat tabel `users`, `bookmarks`, `watch_history` lengkap dengan indeks, foreign key, dan RLS yang aman untuk pemakaian via `service_role` key.

> ⚠️ Jika kamu **hanya** punya `anon` key (tanpa `service_role`), backend tidak bisa insert/update/delete dengan RLS aktif. Lihat catatan di akhir file migration untuk men-disable RLS — tapi ini **tidak direkomendasikan** untuk production karena siapa pun yang punya anon key bisa CRUD data user.

### 5. Jalankan Server

```bash
npm start
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

> 💡 Untuk **frontend-only** (tanpa backend), kamu cukup buka `index.html` lewat *static server* apa pun (misal `npx serve .`). Fitur login/bookmark/history tidak akan jalan tanpa backend.

---

## 🔧 Konfigurasi Environment

### Frontend (`js/config.js`)

```js
export const ANIME_API       = "https://api.kanata.web.id/otakudesu";
export const SANKA_API       = "https://www.sankavollerei.com/anime";
export const USER_API        = "https://api.kuzen.my.id/api";
export const USER_API_BACKUP = "https://apiv1.kuzen.web.id/api";
```

Ganti `USER_API` ke `http://localhost:3000/api` saat development lokal jika perlu.

### Backend (`.env`)

| Variabel                    | Wajib | Deskripsi                                                                 | Contoh                                |
|-----------------------------|-------|---------------------------------------------------------------------------|---------------------------------------|
| `PORT`                      |       | Port server Express                                                       | `3000`                                |
| `JWT_SECRET`                | ✅    | Secret untuk sign JWT (wajib panjang & acak)                              | `openssl rand -hex 64`                |
| `SUPABASE_URL`              | ✅    | URL project Supabase                                                       | `https://abc.supabase.co`             |
| `SUPABASE_KEY`              | ✅\*  | Anon (public) key Supabase                                                 | `eyJhbGciOi...`                       |
| `SUPABASE_SERVICE_ROLE_KEY` | 🔥    | Service role key — **direkomendasikan** untuk backend, bypass RLS         | `eyJhbGciOi...`                       |
| `SUPABASE_PROJECT_ID`       |       | ID project (informasi saja, tidak dipakai server)                          | `latwvoyphfdjhftgtzym`                |

\* Server akan **prefer** `SUPABASE_SERVICE_ROLE_KEY` jika tersedia; jika tidak, fallback ke `SUPABASE_KEY` (anon).

---

## 🔌 API Endpoints

Base URL: `https://api.kuzen.my.id/api` (production) atau `http://localhost:3000/api` (local)

### Public

| Method | Path           | Deskripsi                      |
|--------|----------------|--------------------------------|
| GET    | `/test-db`     | Cek koneksi database           |
| POST   | `/register`    | Daftar akun baru               |
| POST   | `/login`       | Login → mengembalikan JWT      |

### Protected (butuh header `Authorization: Bearer <token>`)

| Method | Path                       | Deskripsi                          |
|--------|----------------------------|------------------------------------|
| GET    | `/bookmarks`               | List semua bookmark milik user     |
| GET    | `/bookmarks/check/:slug`   | Cek apakah anime sudah di-bookmark |
| POST   | `/bookmarks/toggle`        | Toggle bookmark (add / remove)     |
| GET    | `/history`                 | List 20 riwayat tontonan terakhir  |
| POST   | `/history`                 | Simpan / update riwayat            |
| DELETE | `/history`                 | Hapus semua riwayat                |

---

## ☁️ Deployment

### Frontend → Vercel

Frontend di-deploy sebagai **static site** ke Vercel. File `vercel.json` sudah dikonfigurasi:

- `framework: null` — disable auto-detection (penting!)
- `buildCommand: null` — tidak ada build step
- `rewrites` — semua route → `index.html` (SPA-friendly)

File `.vercelignore` mengecualikan `server.js` dan `node_modules` agar Vercel **tidak** salah mendeteksi proyek sebagai Express app dan mencoba menjalankan serverless function.

```bash
# Deploy via Vercel CLI
npm i -g vercel
vercel --prod
```

Atau hubungkan repo GitHub ke Vercel — auto-deploy setiap `git push`.

### Backend → VPS Sendiri

Backend (`server.js`) di-host di VPS pribadi (`api.kuzen.my.id`) menggunakan **PM2**:

```bash
# Di VPS
git clone https://github.com/bilakau/nime.git
cd nime
npm install --production

# Buat .env (lihat bagian Konfigurasi Environment)
nano .env

# Jalankan dengan PM2
npm i -g pm2
pm2 start server.js --name maouanime-api
pm2 save
pm2 startup
```

Pasang reverse-proxy (Nginx / Caddy) dengan SSL (Let's Encrypt) untuk membungkus port 3000 → 443.

---

## 🐛 Troubleshooting

### `500: FUNCTION_INVOCATION_FAILED` di Vercel

**Penyebab:** Vercel auto-detect `express` di `package.json` lalu mencoba mendeploy `server.js` sebagai serverless function. Function ini crash karena (1) `app.listen()` tidak didukung di environment serverless, dan (2) ada referensi `window` yang tidak ada di Node.js.

**Solusi:** File `.vercelignore` sudah mengecualikan `server.js`. `vercel.json` juga sudah disetel `framework: null` agar tidak ada auto-detection. Re-deploy proyek setelah update.

### `🚨 SUPABASE_URL atau SUPABASE_KEY belum di-set` saat start backend

Pastikan `.env` ada di root folder dan berisi `SUPABASE_URL` + `SUPABASE_KEY` (atau `SUPABASE_SERVICE_ROLE_KEY`). Jangan commit `.env` ke git — gunakan `.env.example` sebagai template.

### `PGRST205 - Could not find the table 'public.<x>'`

Tabel belum ada di Supabase. Buka **SQL Editor** di dashboard, jalankan [`supabase/migrations/0001_init_schema.sql`](supabase/migrations/0001_init_schema.sql).

### `new row violates row-level security policy` saat register / bookmark

Backend dijalankan dengan **anon key** sementara RLS aktif → setiap insert/update ditolak. Solusi (urut prioritas):

1. **Pakai `SUPABASE_SERVICE_ROLE_KEY`** di `.env` (rekomendasi). Service role bypass RLS.
2. Atau di Supabase **Authentication → Policies**, matikan RLS pada tabel `users`, `bookmarks`, `watch_history` (kurang aman, lihat catatan di file migration).

### `CORS error` di browser

Pastikan domain frontend ada di whitelist `allowedOrigins` (`server.js`). Default sudah include `kuzen.my.id`, `kuzen.web.id`, dan `localhost:3000`.

### Service Worker pakai versi lama

Hard-reload (`Ctrl+Shift+R`) atau buka DevTools → Application → Service Workers → Unregister.

---

## 🤝 Berkontribusi

Pull request dipersilakan! Untuk perubahan besar, buka *issue* dulu agar bisa didiskusikan.

1. Fork repo ini
2. Buat branch fitur (`git checkout -b feat/my-feature`)
3. Commit perubahan (`git commit -m 'feat: tambah fitur X'`)
4. Push ke branch (`git push origin feat/my-feature`)
5. Buka Pull Request

---

## 📄 Lisensi

ISC — bebas digunakan untuk pembelajaran. Cantumkan kredit jika di-redistribute.

---

## 👏 Kredit

- **Otakudesu API** by [Kanata](https://api.kanata.web.id/) — sumber data anime
- **Sankavollerei API** — sumber data tambahan
- **Tailwind CSS** — utility-first styling
- **SweetAlert2** — popup yang cantik
- **Font Awesome** — icon library

---

> Made with ❤️ for the anime community by **[@bilakau](https://github.com/bilakau)**.
