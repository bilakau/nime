import { USER_API, USER_API_BACKUP } from "./config.js";
import { fetchWithFallback } from "./api.js";
import { showLoading } from "./utils.js";

export async function loadProfile() {
  const token = localStorage.getItem("kuzen_token");

  // 1. Proteksi Halaman: Usir jika belum login
  if (!token) {
    Swal.fire({
      icon: "error",
      title: "Akses Ditolak",
      text: "Silakan login terlebih dahulu untuk membuka profil.",
      background: "#1a1a1a",
      color: "#ffffff",
    });
    window.history.back(); // Kembalikan ke halaman sebelumnya
    return;
  }

  showLoading(true);
  history.pushState(null, null, `/profile`);

  const display = document.getElementById("content-display");
  if (!display) return;

  // 2. Ambil Data User Saat Ini (Opsional: Sesuaikan dengan endpoint backend kamu)
  let currentUsername = "User";
  let currentUserPhoto = "";

  try {
    const res = await fetchWithFallback("/profile", USER_API, USER_API_BACKUP, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      currentUsername = data.username || "User";
      currentUserPhoto = data.photo || "";
    }
  } catch (err) {
    console.warn("Gagal menarik data profil awal:", err);
  }

  // 3. Render UI Profil
  display.innerHTML = `
        <div class="animate-fadeIn max-w-3xl mx-auto px-2 pb-10">
            <button onclick="window.history.back()" class="flex items-center gap-2 text-gray-300 hover:text-white font-bold text-sm mb-8 transition-colors w-fit group">
                <i class="fas fa-arrow-left group-hover:-translate-x-1 transition-transform"></i> Back
            </button>

            <div class="text-center mb-10">
                <div class="relative w-28 h-28 mx-auto mb-4 group">
                    <div id="profile-pic-container" class="w-full h-full bg-gradient-to-tr from-[#ff6600] to-orange-400 rounded-full flex items-center justify-center shadow-lg shadow-orange-500/30 overflow-hidden border-4 border-gray-900">
                        ${
                          currentUserPhoto
                            ? `<img id="profile-img" src="${currentUserPhoto}" class="w-full h-full object-cover" onerror="this.onerror=null; this.src='/img/default-avatar.png';">`
                            : `<i id="profile-icon" class="fas fa-user text-4xl text-white"></i>`
                        }
                    </div>
                    <label for="file-upload" class="absolute bottom-0 right-0 bg-[#ff6600] p-2.5 rounded-full cursor-pointer hover:scale-110 transition shadow-lg border-2 border-gray-900">
                        <i class="fas fa-camera text-white text-[10px]"></i>
                        <input type="file" id="file-upload" class="hidden" accept="image/*" onchange="handleImageUpload(event)">
                    </label>
                </div>
                <h1 class="text-2xl md:text-3xl font-black text-white tracking-tight">${currentUsername}</h1>
                <p class="text-gray-400 text-sm mt-1 uppercase tracking-widest text-[10px] font-black">Member MaouAnime</p>
            </div>

            <div class="space-y-6">
                <div class="bg-[#121212] border border-gray-800 p-6 md:p-8 rounded-3xl shadow-sm relative overflow-hidden">
                    <div class="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                    <h2 class="text-lg font-black text-white mb-6 flex items-center gap-2 uppercase tracking-widest">
                        <i class="fas fa-id-badge text-blue-500"></i> Ganti Username
                    </h2>
                    <form onsubmit="handleUpdateUsername(event)" class="space-y-4">
                        <input type="text" id="input-username" value="${currentUsername}" required class="w-full bg-gray-900/50 border border-gray-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-blue-500 transition-colors">
                        <div class="flex justify-end"><button type="submit" class="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95">Simpan Username</button></div>
                    </form>
                </div>

                <div class="bg-[#121212] border border-gray-800 p-6 md:p-8 rounded-3xl shadow-sm relative overflow-hidden">
                    <div class="absolute top-0 left-0 w-1 h-full bg-[#ff6600]"></div>
                    <h2 class="text-lg font-black text-white mb-6 flex items-center gap-2 uppercase tracking-widest">
                        <i class="fas fa-lock text-[#ff6600]"></i> Ganti Password
                    </h2>
                    <form onsubmit="handleUpdatePassword(event)" class="space-y-4">
                         <input type="password" id="input-old-password" required placeholder="Password Lama" class="w-full bg-gray-900/50 border border-gray-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-[#ff6600]">
                         <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input type="password" id="input-new-password" required placeholder="Password Baru" class="w-full bg-gray-900/50 border border-gray-700 text-white px-4 py-3 rounded-xl">
                            <input type="password" id="input-confirm-password" required placeholder="Konfirmasi" class="w-full bg-gray-900/50 border border-gray-700 text-white px-4 py-3 rounded-xl">
                         </div>
                         <div class="flex justify-end"><button type="submit" class="bg-[#ff6600] hover:bg-[#e65c00] text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95">Update Password</button></div>
                    </form>
                </div>

                <div class="flex justify-center pt-8">
                    <button onclick="handleLogout()" class="text-red-500 hover:text-white bg-red-500/10 hover:bg-red-500 border border-red-500/30 hover:border-red-500 px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2">
                        <i class="fas fa-sign-out-alt"></i> Logout Akun
                    </button>
                </div>
            </div>
        </div>
    `;
  showLoading(false);
}

// Fungsi untuk upload ke Cloudinary
async function uploadToCloudinary(file) {
  const cloudName = "djog2tu7s"; // Ganti dengan Cloud Name kamu
  const uploadPreset = "KuzenCDN";

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: "POST",
        body: formData,
      },
    );

    if (!response.ok) throw new Error("Gagal upload ke Cloudinary");

    const data = await response.json();
    return data.secure_url; // Ini adalah link foto yang sudah jadi
  } catch (error) {
    console.error("Cloudinary Error:", error);
    return null;
  }
}

// ==========================================
// FUNGSI AKSI (Terkait API Backend Kamu)
// ==========================================

// 3. HANDLER UNTUK INPUT FILE (Taruh di dalam js/profile.js)
window.handleImageUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const token = localStorage.getItem("kuzen_token");

  // Loading Alert
  Swal.fire({
    title: "Sedang Upload...",
    text: "Sabar ya, lagi diproses ke CDN",
    allowOutsideClick: false,
    background: "#1a1a1a",
    color: "#ffffff",
    didOpen: () => {
      Swal.showLoading();
    },
  });

  const imageUrl = await uploadToCloudinary(file);

  if (imageUrl) {
    // SIMPAN KE BACKEND KAMU (Code ke-3 yang kamu tanya ada di sini)
    try {
      const res = await fetchWithFallback("/profile/update-photo", USER_API, USER_API_BACKUP, {
        method: "PUT", // Sesuaikan method backend (PUT/POST)
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ photo: imageUrl }), // Sesuaikan nama field di backend (photo / photo_url)
      });

      if (res.ok) {
        // Update UI secara instan
        const container = document.getElementById("profile-pic-container");
        container.innerHTML = `<img src="${imageUrl}" class="w-full h-full object-cover animate-fadeIn" onerror="this.onerror=null; this.src='/img/default-avatar.png';">`;

        Swal.fire({
          icon: "success",
          title: "Foto Profil Diupdate!",
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 3000,
          background: "#1a1a1a",
          color: "#ffffff",
        });
      } else {
        throw new Error("Gagal simpan ke database");
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Gagal Update Database",
        text: err.message,
      });
    }
  } else {
    Swal.fire({ icon: "error", title: "Gagal Upload ke Cloudinary" });
  }
};

window.handleUpdateUsername = async (e) => {
  e.preventDefault();
  const newUsername = document.getElementById("input-username").value.trim();
  const token = localStorage.getItem("kuzen_token");

  try {
    showLoading(true);
    const res = await fetchWithFallback("/profile/update-username", USER_API, USER_API_BACKUP, {
      method: "PUT", // Atau POST, sesuaikan backendmu
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ username: newUsername }),
    });

    const result = await res.json();
    showLoading(false);

    if (res.ok && result.status === "success") {
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Username diupdate!",
        showConfirmButton: false,
        timer: 3000,
        background: "#1a1a1a",
        color: "#ffffff",
      });
    } else {
      throw new Error(result.message || "Gagal mengupdate username");
    }
  } catch (err) {
    showLoading(false);
    Swal.fire({
      icon: "error",
      title: "Oops...",
      text: err.message,
      background: "#1a1a1a",
      color: "#ffffff",
    });
  }
};

window.handleUpdatePassword = async (e) => {
  e.preventDefault();
  const oldPassword = document.getElementById("input-old-password").value;
  const newPassword = document.getElementById("input-new-password").value;
  const confirmPassword = document.getElementById(
    "input-confirm-password",
  ).value;
  const token = localStorage.getItem("kuzen_token");

  // Validasi Frontend
  if (newPassword !== confirmPassword) {
    Swal.fire({
      icon: "warning",
      title: "Password Tidak Sama",
      text: "Konfirmasi password baru tidak cocok!",
      background: "#1a1a1a",
      color: "#ffffff",
    });
    return;
  }

  try {
    showLoading(true);
    const res = await fetchWithFallback("/profile/update-password", USER_API, USER_API_BACKUP, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        old_password: oldPassword,
        new_password: newPassword,
      }),
    });

    const result = await res.json();
    showLoading(false);

    if (res.ok && result.status === "success") {
      // Bersihkan form input setelah sukses
      document.getElementById("input-old-password").value = "";
      document.getElementById("input-new-password").value = "";
      document.getElementById("input-confirm-password").value = "";

      Swal.fire({
        icon: "success",
        title: "Sukses!",
        text: "Password berhasil diubah.",
        background: "#1a1a1a",
        color: "#ffffff",
      });
    } else {
      throw new Error(result.message || "Password lama salah / gagal update");
    }
  } catch (err) {
    showLoading(false);
    Swal.fire({
      icon: "error",
      title: "Gagal",
      text: err.message,
      background: "#1a1a1a",
      color: "#ffffff",
    });
  }
};

window.handleLogout = () => {
  Swal.fire({
    title: "Yakin ingin keluar?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#3085d6",
    confirmButtonText: "Ya, Logout",
    cancelButtonText: "Batal",
    background: "#1a1a1a",
    color: "#ffffff",
  }).then((result) => {
    if (result.isConfirmed) {
      localStorage.removeItem("kuzen_token");
      // Bisa hapus memori lain jika perlu (misal current_anime_slug)
      window.location.href = "/"; // Arahkan kembali ke Home
    }
  });
};
