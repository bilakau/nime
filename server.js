import "dotenv/config"; // <-- Baris ini otomatis membaca file .env
import express from "express";
import mysql from "mysql2/promise";
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
    "https://kuzen.my.id",
    "https://www.kuzen.my.id",
    "https://kuzen.web.id",
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
// 1. KONEKSI DATABASE MYSQL DARI .ENV
// ==========================================
const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

// ==========================================
// 2. ENDPOINT API (BACKEND)
// ==========================================
app.get("/api/test-db", async (req, res) => {
    try {
        const [rows] = await db.query(
            "SELECT 'Koneksi ke MaouAnime DB Berhasil!' AS pesan",
        );
        res.json({ status: "success", data: rows[0] });
    } catch (error) {
        console.error("Database error:", error);
        res.status(500).json({
            status: "error",
            message: "Gagal konek ke database",
            error: error.message,
        });
    }
});

app.post("/api/register", async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Cek apakah email atau username sudah dipakai
        const [existingUser] = await db.query(
            "SELECT id FROM users WHERE email = ? OR username = ?",
            [email, username],
        );
        if (existingUser.length > 0) {
            return res.status(400).json({
                status: "error",
                message: "Email atau Username sudah terdaftar!",
            });
        }

        // Acak password biar aman (Hashing)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Simpan ke database
        await db.query(
            "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
            [username, email, hashedPassword],
        );
        res.json({ status: "success", message: "Registrasi berhasil!" });
    } catch (error) {
        // 👇 TAMBAHKAN BARIS INI UNTUK MELIHAT PENYAKIT ASLINYA 👇
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
        const [users] = await db.query("SELECT * FROM users WHERE email = ?", [
            email,
        ]);
        if (users.length === 0) {
            return res
                .status(400)
                .json({ status: "error", message: "Email tidak ditemukan!" });
        }

        const user = users[0];

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
        const [rows] = await db.query(
            "SELECT * FROM bookmarks WHERE user_id = ? ORDER BY created_at DESC",
            [req.user.id],
        );
        res.json({ status: "success", data: rows });
    } catch (error) {
        res.status(500).json({
            status: "error",
            message: "Gagal mengambil bookmark.",
        });
    }
});

// Cek Status Bookmark (Apakah anime ini sudah di-bookmark?)
app.get("/api/bookmarks/check/:slug", authenticateToken, async (req, res) => {
    try {
        const [rows] = await db.query(
            "SELECT id FROM bookmarks WHERE user_id = ? AND anime_slug = ?",
            [req.user.id, req.params.slug],
        );
        res.json({ status: "success", isBookmarked: rows.length > 0 });
    } catch (error) {
        res.status(500).json({ status: "error", message: "Gagal cek status." });
    }
});

// Tambah atau Hapus Bookmark (Toggle)
app.post("/api/bookmarks/toggle", authenticateToken, async (req, res) => {
    try {
        const { anime_slug, anime_title, anime_thumb } = req.body;
        const [existing] = await db.query(
            "SELECT id FROM bookmarks WHERE user_id = ? AND anime_slug = ?",
            [req.user.id, anime_slug],
        );

        if (existing.length > 0) {
            // Jika sudah ada, maka HAPUS
            await db.query(
                "DELETE FROM bookmarks WHERE user_id = ? AND anime_slug = ?",
                [req.user.id, anime_slug],
            );
            res.json({
                status: "success",
                message: "Dihapus dari My List",
                action: "removed",
            });
        } else {
            // Jika belum ada, maka TAMBAH
            await db.query(
                "INSERT INTO bookmarks (user_id, anime_slug, anime_title, anime_thumb) VALUES (?, ?, ?, ?)",
                [req.user.id, anime_slug, anime_title, anime_thumb],
            );
            res.json({
                status: "success",
                message: "Berhasil disimpan ke My List",
                action: "added",
            });
        }
    } catch (error) {
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
        const [rows] = await db.query(
            "SELECT * FROM watch_history WHERE user_id = ? ORDER BY updated_at DESC LIMIT 20",
            [req.user.id],
        );
        res.json({ status: "success", data: rows });
    } catch (error) {
        res.status(500).json({
            status: "error",
            message: "Gagal mengambil riwayat.",
        });
    }
});

// Simpan/Update Riwayat Nonton
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

        // 1. CARI BERDASARKAN ANIME_SLUG (Bukan episode_slug)
        // Ini supaya satu anime cuma punya satu baris di history per user
        const [existing] = await db.query(
            "SELECT id FROM watch_history WHERE user_id = ? AND anime_slug = ?",
            [req.user.id, anime_slug],
        );

        if (existing.length > 0) {
            // 2. JIKA SUDAH ADA, UPDATE KE EPISODE TERBARU & UPDATE POSTER
            await db.query(
                "UPDATE watch_history SET anime_thumb = ?, episode_slug = ?, episode_title = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                [anime_thumb, episode_slug, episode_title, existing[0].id],
            );
            return res.json({
                status: "success",
                message: "Riwayat diperbarui",
            });
        } else {
            // 3. JIKA BELUM ADA, BARU INSERT DATA BARU
            await db.query(
                "INSERT INTO watch_history (user_id, anime_slug, anime_title, anime_thumb, episode_slug, episode_title) VALUES (?, ?, ?, ?, ?, ?)",
                [
                    req.user.id,
                    anime_slug,
                    anime_title,
                    anime_thumb,
                    episode_slug,
                    episode_title,
                ],
            );
            return res.json({
                status: "success",
                message: "Riwayat baru ditambahkan",
            });
        }
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
        await db.query("DELETE FROM watch_history WHERE user_id = ?", [
            req.user.id,
        ]);
        res.json({ status: "success", message: "Riwayat berhasil dihapus!" });
    } catch (error) {
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
// 4. JALANKAN SERVER
// ==========================================
app.listen(PORT, () => {
    console.log(`-------------------------------------------`);
    console.log(`🚀 MaouAnime API & Web live at http://localhost:${PORT}`);
    console.log(`-------------------------------------------`);
});
