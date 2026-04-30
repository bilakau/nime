import { USER_API, USER_API_BACKUP } from "./config.js";
import { fetchWithFallback } from "./api.js";

export async function loadAdminDashboard() {
  fetchAdminStats();
  // Keamanan: Cek apakah user benar-benar admin (dari localStorage/token)
  const user = JSON.parse(localStorage.getItem("maounime_user"));
  if (!user || user.role !== "admin") {
    Swal.fire({
      icon: "error",
      title: "Akses Ditolak",
      text: "Hanya Admin yang bisa masuk!",
    });
    window.location.href = "/";
    return;
  }

  const display = document.getElementById("content-display");
  display.innerHTML = `
        <div class="max-w-6xl mx-auto animate-fadeIn px-4 py-8">
            <div class="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
                <div>
                    <h1 class="text-3xl font-black text-white uppercase tracking-tighter">Admin <span class="text-[#ff6600]">Dashboard</span></h1>
                    <p class="text-gray-500 text-[10px] font-bold uppercase tracking-[0.2em]">Management & System Control</p>
                </div>
                <div class="flex gap-3">
                    <button onclick="app.loadAdminUsers()" class="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase transition border border-gray-700">Manage Users</button>
                    <button class="bg-[#ff6600] text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase shadow-lg shadow-orange-500/20">Add Content</button>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div class="bg-[#121212] border border-gray-800 p-6 rounded-3xl">
                    <p class="text-gray-500 text-[10px] font-black uppercase mb-2">Total Users</p>
                    <h2 id="stat-users" class="text-3xl font-black text-white animate-pulse">...</h2>
                </div>
                <div class="bg-[#121212] border border-gray-800 p-6 rounded-3xl">
                    <p class="text-gray-500 text-[10px] font-black uppercase mb-2">Total History</p>
                    <h2 id="stat-history" class="text-3xl font-black text-white animate-pulse">...</h2>
                </div>
                <div class="bg-[#121212] border border-gray-800 p-6 rounded-3xl">
                    <p class="text-gray-500 text-[10px] font-black uppercase mb-2">Server Status</p>
                    <h2 class="text-3xl font-black text-green-500">ONLINE</h2>
                </div>
            </div>

            <div id="admin-main-content" class="bg-[#121212] border border-gray-800 rounded-3xl overflow-hidden shadow-sm">
                <div class="p-6 border-b border-gray-800 flex justify-between items-center">
                    <h3 class="text-xs font-black uppercase text-gray-400 tracking-widest">Recent Registered Users</h3>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-left">
                        <thead class="bg-gray-900/50 text-gray-500 text-[9px] font-black uppercase tracking-widest">
                            <tr>
                                <th class="px-6 py-4">User</th>
                                <th class="px-6 py-4">Role</th>
                                <th class="px-6 py-4">Joined</th>
                                <th class="px-6 py-4">Action</th>
                            </tr>
                        </thead>
                        <tbody id="admin-user-list" class="divide-y divide-gray-800/50">
                            </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

  fetchAdminStats();
}

export async function fetchAdminStats() {
  const token = localStorage.getItem("maounime_token");
  try {
    const res = await fetchWithFallback("/admin/stats", USER_API, USER_API_BACKUP, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    document.getElementById("stat-users").innerText = data.total_users || 0;
    document.getElementById("stat-history").innerText = data.total_history || 0;

    // Render tabel user
    const list = document.getElementById("admin-user-list");
    list.innerHTML = data.users
      .map(
        (u) => `
            <tr class="hover:bg-gray-800/30 transition-colors">
                <td class="px-6 py-4 flex items-center gap-3">
                    <img src="${u.photo || "/img/default-avatar.png"}" class="w-8 h-8 rounded-full border border-gray-700" onerror="this.onerror=null; this.src='/img/default-avatar.png';">
                    <div>
                        <p class="text-sm font-bold text-white">${u.username}</p>
                        <p class="text-[10px] text-gray-600">${u.email}</p>
                    </div>
                </td>
                <td class="px-6 py-4">
                    <span class="px-2 py-1 rounded text-[8px] font-black uppercase ${u.role === "admin" ? "bg-orange-500/10 text-orange-500" : "bg-gray-800 text-gray-500"}">${u.role}</span>
                </td>
                <td class="px-6 py-4 text-xs text-gray-600">${new Date(u.created_at).toLocaleDateString()}</td>
                <td class="px-6 py-4">
                    <button onclick="app.editUserByAdmin('${u.id}')" class="text-gray-500 hover:text-white transition"><i class="fas fa-edit"></i></button>
                </td>
            </tr>
        `,
      )
      .join("");
  } catch (e) {
    console.error("Gagal load data admin");
  }
}

// Fungsi untuk munculin modal edit password user
export async function editUserByAdmin(userId) {
  const { value: newPassword } = await Swal.fire({
    title: "Reset Password User",
    input: "text",
    inputLabel: "Masukkan Password Baru",
    inputPlaceholder: "Min 6 karakter...",
    showCancelButton: true,
    background: "#121212",
    color: "#ffffff",
    confirmButtonColor: "#ff6600",
  });

  if (newPassword && newPassword.length >= 6) {
    Swal.fire({
      title: "Sedang memproses...",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    const token = localStorage.getItem("maounime_token");
    try {
      const res = await fetchWithFallback("/admin/reset-user-password", USER_API, USER_API_BACKUP, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ user_id: userId, new_password: newPassword }),
      });

      const result = await res.json();
      if (res.ok && result.status === "success") {
        Swal.fire({
          icon: "success",
          title: "Berhasil!",
          text: result.message,
        });
      } else {
        throw new Error(result.message || "Gagal reset password.");
      }
    } catch (err) {
      Swal.fire({ icon: "error", title: "Gagal!", text: err.message });
    }
  }
}
