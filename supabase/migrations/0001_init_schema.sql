-- ==========================================
-- MaouAnime / KuzenAnime — Schema awal Supabase
-- Jalankan di Supabase SQL Editor (Project → SQL Editor → New Query)
-- atau via `psql` ke connection string Supabase.
-- ==========================================

-- 1. Tabel users
create table if not exists public.users (
    id           bigserial primary key,
    username     varchar(50)  not null unique,
    email        varchar(100) not null unique,
    password     varchar(255) not null,
    avatar       varchar(255),
    created_at   timestamptz  not null default now()
);

create index if not exists users_email_idx on public.users (email);
create index if not exists users_username_idx on public.users (username);

-- 2. Tabel bookmarks
create table if not exists public.bookmarks (
    id           bigserial primary key,
    user_id      bigint       not null references public.users(id) on delete cascade,
    anime_slug   varchar(255) not null,
    anime_title  varchar(255) not null,
    anime_thumb  varchar(500),
    created_at   timestamptz  not null default now(),
    constraint bookmarks_user_anime_unique unique (user_id, anime_slug)
);

create index if not exists bookmarks_user_id_idx on public.bookmarks (user_id);

-- 3. Tabel watch_history
create table if not exists public.watch_history (
    id             bigserial primary key,
    user_id        bigint       not null references public.users(id) on delete cascade,
    anime_slug     varchar(255) not null,
    anime_title    varchar(255) not null,
    anime_thumb    varchar(500),
    episode_slug   varchar(255),
    episode_title  varchar(255),
    updated_at     timestamptz  not null default now(),
    constraint watch_history_user_anime_unique unique (user_id, anime_slug)
);

create index if not exists watch_history_user_id_idx on public.watch_history (user_id);

-- ==========================================
-- 4. Row Level Security (RLS)
-- ==========================================
-- Backend Express memakai SERVICE_ROLE key (bypass RLS by default),
-- jadi pilihan yang aman: aktifkan RLS dan TIDAK buat policy untuk role anon.
-- Frontend tidak boleh akses langsung tabel ini — semua via API Express.

alter table public.users         enable row level security;
alter table public.bookmarks     enable row level security;
alter table public.watch_history enable row level security;

-- Tidak ada policy untuk anon = anon tidak bisa read/write apa pun.
-- service_role TETAP bisa karena memang bypass RLS.

-- ==========================================
-- ALTERNATIF: Jika kamu HANYA punya anon key (tanpa service_role),
-- matikan RLS ketiga tabel agar backend bisa berjalan dengan anon key.
-- (kurang aman untuk production — orang lain dengan anon key bisa
-- read/write data user kamu).
--
-- alter table public.users         disable row level security;
-- alter table public.bookmarks     disable row level security;
-- alter table public.watch_history disable row level security;
-- ==========================================
