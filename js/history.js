import { showLoading, getProxyImage } from "./utils.js";
import { USER_API, USER_API_BACKUP } from "./config.js";
import { fetchWithFallback } from "./api.js";

export async function loadHistory() {
  window.scrollTo({ top: 0, behavior: "smooth" });
  // 1. Matikan loading spinner bawaan
  showLoading(false);

  // Update URL di browser
  history.pushState(null, null, "/history");

  const content = document.getElementById("content-display");
  const token = localStorage.getItem("maounime_token");

  // 2. Proteksi: Cek apakah user sudah login (Instan, tanpa skeleton)
  if (!token) {
    if (content) {
      content.innerHTML = `
        <div class="flex flex-col items-center justify-center py-20 animate-fadeIn">
            <div class="w-20 h-20 bg-gray-900 rounded-full flex items-center justify-center mb-6 border border-gray-800">
                <i class="fas fa-history text-[#ff6600] text-3xl"></i>
            </div>
            <h2 class="text-xl font-black uppercase tracking-tighter mb-2 text-white">Riwayat Terkunci</h2>
            <p class="text-xs text-gray-500 font-bold uppercase tracking-widest mb-6">Login untuk melihat apa yang terakhir Anda tonton</p>
            <button onclick="window.app.showAuthModal(true)" class="bg-[#ff6600] hover:bg-[#ff5500] text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition shadow-lg shadow-[#ff6600]/20">
                Login Sekarang
            </button>
        </div>
      `;
    }
    return;
  }

  // 3. TAMPILKAN SKELETON KHUSUS HISTORY (Bentuk Horizontal)
  if (content) {
    let skeletonCards = "";
    // Buat 6 kartu skeleton placeholder
    for (let i = 0; i < 6; i++) {
      skeletonCards += `
        <div class="flex bg-gray-900/50 border border-gray-800 rounded-2xl overflow-hidden animate-pulse">
            <div class="w-24 h-32 flex-shrink-0 bg-gray-700"></div>
            <div class="p-4 flex flex-col justify-center flex-1 min-w-0">
                <div class="h-2 w-1/3 bg-gray-600 rounded-full mb-2"></div>
                <div class="h-3 w-3/4 bg-gray-500 rounded-full mb-2"></div>
                <div class="h-2 w-1/2 bg-gray-600 rounded-full"></div>
                <div class="mt-4 w-full bg-gray-800 h-1.5 rounded-full"></div>
            </div>
        </div>
      `;
    }

    content.innerHTML = `
      <div class="animate-fadeIn">
          <div class="flex items-center justify-between mb-8">
              <div>
                  <h2 class="text-2xl md:text-4xl font-black uppercase tracking-tighter italic text-gray-500 animate-pulse">Recent Activity</h2>
                  <p class="text-[10px] text-gray-700 font-black uppercase tracking-[0.3em] animate-pulse">Memuat Riwayat...</p>
              </div>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              ${skeletonCards}
          </div>
      </div>
    `;
  }

  try {
    // 4. Ambil data asli dari server
    const res = await fetchWithFallback("/history", USER_API, USER_API_BACKUP, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const result = await res.json();

    // 5. TIMPA SKELETON DENGAN DATA ASLI
    let html = `
      <div class="animate-fadeIn">
          <div class="flex items-center justify-between mb-8">
              <div>
                  <h2 class="text-2xl md:text-4xl font-black uppercase tracking-tighter italic text-white">Recent Activity</h2>
                  <p class="text-[10px] text-[#ff6600] font-black uppercase tracking-[0.3em]">Lanjutkan tontonan Anda</p>
              </div>
              <button onclick="window.app.clearHistory()" class="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                  <i class="fas fa-trash-alt text-[8px]"></i>
                  <span>Clear</span>
              </button>
          </div>
    `;

    if (!result.data || result.data.length === 0) {
      html += `
          <div class="text-center py-20 bg-gray-900/20 rounded-3xl border border-dashed border-gray-800">
              <i class="fas fa-play-circle text-gray-800 text-5xl mb-4"></i>
              <p class="text-xs font-bold text-gray-600 uppercase tracking-widest">Belum ada riwayat menonton.</p>
          </div>
      `;
    } else {
      html += `<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">`;

      result.data.forEach((item) => {
        const watchDate = new Date(item.updated_at).toLocaleDateString(
          "id-ID",
          { day: "numeric", month: "short" },
        );

        html += `
            <div class="group flex bg-gray-900/50 border border-gray-800 rounded-2xl overflow-hidden hover:border-[#ff6600] transition-all cursor-pointer shadow-lg" 
                 onclick="app.loadPlayer('${item.episode_slug}', '${item.anime_slug}')">
                
                <div class="w-24 h-32 flex-shrink-0 relative">
                    <img src="${getProxyImage(item.anime_thumb)}" 
                         class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                         onerror="this.onerror=null; this.src='https://placehold.co/400x600/121212/666666?text=No+Poster';">
                    <div class="absolute inset-0 bg-[#ff6600]/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                        <i class="fas fa-play text-white text-xs"></i>
                    </div>
                </div>

                <div class="p-4 flex flex-col justify-center flex-1 min-w-0">
                    <p class="text-[9px] font-black text-[#ff6600] uppercase tracking-widest mb-1">${watchDate}</p>
                    <h3 class="text-xs font-black text-white truncate uppercase tracking-tighter mb-1">${item.anime_title}</h3>
                    <p class="text-[10px] text-gray-500 font-bold truncate italic">Terakhir: ${item.episode_title.replace("Episode", "EP")}</p>
                    
                    <div class="mt-3 w-full bg-gray-800 h-1 rounded-full overflow-hidden">
                        <div class="bg-[#ff6600] h-full w-full opacity-50"></div>
                    </div>
                </div>
            </div>
        `;
      });

      html += `</div>`;
    }

    html += `</div>`;
    if (content) content.innerHTML = html;
  } catch (err) {
    if (content)
      content.innerHTML = `<p class="text-center text-red-500 py-20 uppercase font-black text-xs">Gagal memuat riwayat.</p>`;
  }
}

export async function clearHistory() {
  const token = localStorage.getItem("maounime_token");
  if (!token) return;

  const result = await Swal.fire({
    title: "Hapus Semua Riwayat?",
    text: "Tindakan ini tidak bisa dibatalkan!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#ff6600",
    cancelButtonColor: "#3085d6",
    confirmButtonText: "Ya, Hapus!",
    cancelButtonText: "Batal",
    background: "#1a1a1a",
    color: "#fff",
  });

  if (result.isConfirmed) {
    try {
      const res = await fetchWithFallback(
        "/history",
        USER_API,
        USER_API_BACKUP,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const data = await res.json();
      if (data.status === "success") {
        Swal.fire({
          title: "Terhapus!",
          text: "Riwayat nonton Anda telah dibersihkan.",
          icon: "success",
          background: "#1a1a1a",
          color: "#fff",
          confirmButtonColor: "#ff6600",
        });
        loadHistory();
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      Swal.fire({
        title: "Gagal!",
        text: "Terjadi kesalahan saat menghapus riwayat.",
        icon: "error",
        background: "#1a1a1a",
        color: "#fff",
      });
    }
  }
}
