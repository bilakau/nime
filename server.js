import "dotenv/config"; // <-- Otomatis membaca file .env
import express from "express";
import { createClient } from "@supabase/supabase-js";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Mengambil port dari .env, atau gunakan 3000 jika kosong
const PORT = process.env.PORT || 3000;

const app = express();

const allowedOrigins = [
    "http://localhost:3000",
    "https://maounime.my.id",
    "https://www.maounime.my.id",
];

app.use(
    cors({
        origin: function (origin, callback) {
            // Izinkan jika origin ada di daftar atau jika tidak ada origin (seperti alat testing Postman)
            if (!origin || allowedOrigins.indexOf(origin) !== -1) {
                callback(null, true);
            } else {
                callback(
                    new Error(
                        "Maaf, domain Anda tidak diizinkan oleh sistem CORS MaouAnime",
                    ),
                );
            }
        },
        credentials: true, // Penting jika kamu nanti pakai Cookie/Session
    }),
);

app.use(express.json());

app.use(express.static(path.join(__dirname)));

// ==========================================
// 1. KONEKSI SUPABASE DARI .ENV
// ==========================================
// Untuk operasi backend (insert/update/delete) gunakan SERVICE_ROLE key,
// karena anon key dibatasi oleh Row Level Security (RLS).
// Anon key dipakai sebagai fallback agar dev cepat (RLS harus dimatikan).
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error(
        "🚨 SUPABASE_URL atau SUPABASE_KEY belum di-set. Cek file .env.",
    );
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
    },
});

// ==========================================
// 2. ENDPOINT API (BACKEND)
// ==========================================
app.get("/api/test-db", async (req, res) => {
    try {
        const { error } = await supabase
            .from("users")
            .select("id", { count: "exact", head: true });
        if (error) throw error;
        res.json({
            status: "success",
            data: { pesan: "Koneksi ke MaouAnime Supabase Berhasil!" },
        });
    } catch (error) {
        console.error("Database error:", error);
        res.status(500).json({
            status: "error",
            message: "Gagal konek ke Supabase",
            error: error.message,
        });
    }
});

app.post("/api/register", async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Cek apakah email atau username sudah dipakai
        const { data: existingUsers, error: checkError } = await supabase
            .from("users")
            .select("id")
            .or(`email.eq.${email},username.eq.${username}`)
            .limit(1);
        if (checkError) throw checkError;

        if (existingUsers && existingUsers.length > 0) {
            return res.status(400).json({
                status: "error",
                message: "Email atau Username sudah terdaftar!",
            });
        }

        // Acak password biar aman (Hashing)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Simpan ke database
        const { error: insertError } = await supabase
            .from("users")
            .insert({ username, email, password: hashedPassword });
        if (insertError) throw insertError;

        res.json({ status: "success", message: "Registrasi berhasil!" });
    } catch (error) {
        console.error("🚨 ERROR DETAIL REGISTRASI:", error);
        res.status(500).json({
            status: "error",
            message: "Server error saat registrasi.",
        });
    }
});

// Login Akun
app.post("/api/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        // Cari user berdasarkan email
        const { data: user, error: findError } = await supabase
            .from("users")
            .select("*")
            .eq("email", email)
            .maybeSingle();
        if (findError) throw findError;

        if (!user) {
            return res
                .status(400)
                .json({ status: "error", message: "Email tidak ditemukan!" });
        }

        // Cocokkan password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res
                .status(400)
                .json({ status: "error", message: "Password salah!" });
        }

        // Buat Tiket/Token (berlaku 7 hari)
        const token = jwt.sign(
            { id: user.id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: "7d" },
        );

        res.json({
            status: "success",
            message: "Login berhasil!",
            token: token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                avatar: user.avatar,
            },
        });
    } catch (error) {
        console.error("🚨 ERROR DETAIL LOGIN:", error);
        res.status(500).json({
            status: "error",
            message: "Server error saat login.",
        });
    }
});

// ==========================================
// 3. MIDDLEWARE & ENDPOINT BOOKMARK
// ==========================================

// Fungsi Satpam (Cek Token JWT)
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (!token)
        return res
            .status(401)
            .json({ status: "error", message: "Silakan Login dulu!" });

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err)
            return res.status(403).json({
                status: "error",
                message: "Sesi berakhir, silakan Login ulang.",
            });
        req.user = user;
        next();
    });
};

// Ambil Semua Bookmark User
app.get("/api/bookmarks", authenticateToken, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from("bookmarks")
            .select("*")
            .eq("user_id", req.user.id)
            .order("created_at", { ascending: false });
        if (error) throw error;
        res.json({ status: "success", data: data || [] });
    } catch (error) {
        console.error("🚨 ERROR DETAIL BOOKMARKS:", error);
        res.status(500).json({
            status: "error",
            message: "Gagal mengambil bookmark.",
        });
    }
});

// Cek Status Bookmark (Apakah anime ini sudah di-bookmark?)
app.get("/api/bookmarks/check/:slug", authenticateToken, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from("bookmarks")
            .select("id")
            .eq("user_id", req.user.id)
            .eq("anime_slug", req.params.slug)
            .limit(1);
        if (error) throw error;
        res.json({
            status: "success",
            isBookmarked: !!(data && data.length > 0),
        });
    } catch (error) {
        console.error("🚨 ERROR DETAIL CHECK BOOKMARK:", error);
        res.status(500).json({ status: "error", message: "Gagal cek status." });
    }
});

// Tambah atau Hapus Bookmark (Toggle)
app.post("/api/bookmarks/toggle", authenticateToken, async (req, res) => {
    try {
        const { anime_slug, anime_title, anime_thumb } = req.body;
        const { data: existing, error: checkError } = await supabase
            .from("bookmarks")
            .select("id")
            .eq("user_id", req.user.id)
            .eq("anime_slug", anime_slug)
            .limit(1);
        if (checkError) throw checkError;

        if (existing && existing.length > 0) {
            // Jika sudah ada, maka HAPUS
            const { error: deleteError } = await supabase
                .from("bookmarks")
                .delete()
                .eq("user_id", req.user.id)
                .eq("anime_slug", anime_slug);
            if (deleteError) throw deleteError;

            res.json({
                status: "success",
                message: "Dihapus dari My List",
                action: "removed",
            });
        } else {
            // Jika belum ada, maka TAMBAH
            const { error: insertError } = await supabase
                .from("bookmarks")
                .insert({
                    user_id: req.user.id,
                    anime_slug,
                    anime_title,
                    anime_thumb,
                });
            if (insertError) throw insertError;

            res.json({
                status: "success",
                message: "Berhasil disimpan ke My List",
                action: "added",
            });
        }
    } catch (error) {
        console.error("🚨 ERROR DETAIL TOGGLE BOOKMARK:", error);
        res.status(500).json({
            status: "error",
            message: "Gagal memproses bookmark.",
        });
    }
});

// ==========================================
// 4. ENDPOINT RIWAYAT NONTON (WATCH HISTORY)
// ==========================================

// Ambil Riwayat Nonton User
app.get("/api/history", authenticateToken, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from("watch_history")
            .select("*")
            .eq("user_id", req.user.id)
            .order("updated_at", { ascending: false })
            .limit(20);
        if (error) throw error;
        res.json({ status: "success", data: data || [] });
    } catch (error) {
        console.error("🚨 ERROR DETAIL HISTORY:", error);
        res.status(500).json({
            status: "error",
            message: "Gagal mengambil riwayat.",
        });
    }
});

// Simpan atau Update Riwayat Nonton
app.post("/api/history", authenticateToken, async (req, res) => {
    try {
        const {
            anime_slug,
            anime_title,
            anime_thumb,
            episode_slug,
            episode_title,
        } = req.body;

        // 1. Cari berdasarkan anime_slug (bukan episode_slug)
        // supaya satu anime cuma punya satu baris di history per user
        const { data: existing, error: checkError } = await supabase
            .from("watch_history")
            .select("id")
            .eq("user_id", req.user.id)
            .eq("anime_slug", anime_slug)
            .limit(1);
        if (checkError) throw checkError;

        if (existing && existing.length > 0) {
            // 2. Jika sudah ada, update ke episode terbaru & update poster
            const { error: updateError } = await supabase
                .from("watch_history")
                .update({
                    anime_thumb,
                    episode_slug,
                    episode_title,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", existing[0].id);
            if (updateError) throw updateError;

            return res.json({
                status: "success",
                message: "Riwayat diperbarui",
            });
        }

        // 3. Jika belum ada, insert data baru
        const { error: insertError } = await supabase
            .from("watch_history")
            .insert({
                user_id: req.user.id,
                anime_slug,
                anime_title,
                anime_thumb,
                episode_slug,
                episode_title,
            });
        if (insertError) throw insertError;

        return res.json({
            status: "success",
            message: "Riwayat baru ditambahkan",
        });
    } catch (error) {
        console.error("🚨 DETAIL ERROR HISTORY:", error);
        res.status(500).json({
            status: "error",
            message: "Gagal memproses riwayat.",
        });
    }
});

// Hapus Semua Riwayat Nonton User
app.delete("/api/history", authenticateToken, async (req, res) => {
    try {
        const { error } = await supabase
            .from("watch_history")
            .delete()
            .eq("user_id", req.user.id);
        if (error) throw error;
        res.json({ status: "success", message: "Riwayat berhasil dihapus!" });
    } catch (error) {
        console.error("🚨 ERROR DETAIL DELETE HISTORY:", error);
        res.status(500).json({
            status: "error",
            message: "Gagal menghapus riwayat.",
        });
    }
});

app.use(express.static(__dirname));

app.use((req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

// ==========================================
// 5. JALANKAN SERVER
// ==========================================
app.listen(PORT, () => {
    console.log(`-------------------------------------------`);
    console.log(`🚀 MaouAnime API & Web live at http://localhost:${PORT}`);
    console.log(`📦 Database: Supabase (${SUPABASE_URL})`);
    console.log(`-------------------------------------------`);
});
