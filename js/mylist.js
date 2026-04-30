import { showLoading, createSkeletonGrid, getProxyImage } from "./utils.js"; // Pastikan createSkeletonGrid di-import
import { USER_API, USER_API_BACKUP } from "./config.js";
import { fetchWithFallback } from "./api.js";

export async function loadMyList() {
  window.scrollTo({ top: 0, behavior: "smooth" });
  // 1. Matikan loading spinner bawaan
  showLoading(false);

  // Ubah URL browser tanpa reload
  history.pushState(null, null, "/mylist");

  const content = document.getElementById("content-display");
  const token = localStorage.getItem("maounime_token");

  // Jika belum login, arahkan ke login (Instan, tanpa skeleton)
  if (!token) {
    content.innerHTML = `
            <div class="flex flex-col items-center justify-center py-20 animate-fadeIn">
                <div class="w-20 h-20 bg-gray-900 rounded-full flex items-center justify-center mb-6 border border-gray-800">
                    <i class="fas fa-lock text-[#ff6600] text-3xl"></i>
                </div>
                <h2 class="text-xl font-black uppercase tracking-tighter mb-2 text-white">Halaman Terkunci</h2>
                <p class="text-xs text-gray-500 font-bold uppercase tracking-widest mb-6">Silakan login untuk melihat My List Anda</p>
                <button onclick="window.app.showAuthModal(true)" class="bg-[#ff6600] hover:bg-[#ff5500] text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition shadow-lg shadow-[#ff6600]/20">
                    Login Sekarang
                </button>
            </div>
        `;
    return;
  }

  // 2. TAMPILKAN SKELETON JIKA USER SUDAH LOGIN
  if (content) {
    content.innerHTML = `
        <div class="animate-fadeIn">
            <div class="flex items-center justify-between mb-8">
                <div>
                    <h2 class="text-2xl md:text-4xl font-black uppercase tracking-tighter italic text-gray-500 animate-pulse">My List</h2>
                    <p class="text-[10px] text-gray-700 font-black uppercase tracking-[0.3em] animate-pulse">Memuat Koleksi...</p>
                </div>
                <div class="bg-gray-900 border border-gray-800 px-4 py-2 rounded-2xl animate-pulse h-10 w-20"></div>
            </div>
            ${createSkeletonGrid(10)}
        </div>
    `;
  }

  try {
    // 3. Ambil data asli dari API
    const res = await fetchWithFallback("/bookmarks", USER_API, USER_API_BACKUP, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const result = await res.json();

    // 4. TIMPA SKELETON DENGAN DATA ASLI
    let html = `
            <div class="animate-fadeIn">
                <div class="flex items-center justify-between mb-8">
                    <div>
                        <h2 class="text-2xl md:text-4xl font-black uppercase tracking-tighter italic text-white">My List</h2>
                        <p class="text-[10px] text-[#ff6600] font-black uppercase tracking-[0.3em]">Koleksi Anime Favorit Anda</p>
                    </div>
                    <div class="bg-gray-900 border border-gray-800 px-4 py-2 rounded-2xl">
                        <span class="text-xs font-black text-white">${result.data.length}</span>
                        <span class="text-[10px] font-bold text-gray-500 uppercase ml-1">Titles</span>
                    </div>
                </div>
        `;

    if (result.data.length === 0) {
      html += `
                <div class="text-center py-20 bg-gray-900/20 rounded-3xl border border-dashed border-gray-800">
                    <i class="far fa-heart text-gray-800 text-5xl mb-4"></i>
                    <p class="text-xs font-bold text-gray-600 uppercase tracking-widest">Belum ada anime yang disimpan.</p>
                </div>
            `;
    } else {
      // Wrapper grid ditutup di bawah
      html += `<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">`;

      result.data.forEach((item) => {
        html += `
                    <div class="group relative bg-gray-900 rounded-2xl overflow-hidden border border-gray-800 hover:border-[#ff6600] transition-all duration-300 shadow-lg">
                        <div class="aspect-[3/4] overflow-hidden cursor-pointer" onclick="app.loadDetail('${item.anime_slug}', '${item.anime_thumb}')">
                            <img src="${getProxyImage(item.anime_thumb)}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" onerror="this.onerror=null; this.src='https://via.placeholder.com/300x400?text=No+Image';">
                            <div class="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80"></div>
                        </div>

                        <div class="absolute bottom-0 left-0 right-0 p-3">
                            <h3 class="text-[10px] font-black text-white truncate uppercase mb-2">${item.anime_title}</h3>
                            <button onclick="event.stopPropagation(); deleteBookmark('${item.anime_slug}')" class="w-full bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-colors border border-red-600/30">
                                <i class="fas fa-trash-alt mr-1"></i> Remove
                            </button>
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
      content.innerHTML = `<p class="text-center text-red-500 py-20 font-bold uppercase tracking-widest text-[10px]">Gagal memuat My List.</p>`;
  }
}

// ==========================================
// FUNGSI HAPUS BOOKMARK (Tetap sama)
// ==========================================
window.deleteBookmark = async (slug) => {
  Swal.fire({
    title: "Hapus Anime?",
    text: "Anime ini akan dihapus dari koleksi My List kamu.",
    icon: "warning",
    background: "#1a1a1a",
    color: "#ffffff",
    showCancelButton: true,
    confirmButtonColor: "#ff6600",
    cancelButtonColor: "#444",
    confirmButtonText: "Ya, Hapus!",
    cancelButtonText: "Batal",
    customClass: { popup: "rounded-3xl" },
  }).then(async (result) => {
    if (result.isConfirmed) {
      const token = localStorage.getItem("maounime_token");
      try {
        const res = await fetchWithFallback("/bookmarks/toggle", USER_API, USER_API_BACKUP, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ anime_slug: slug }),
        });
        const apiResult = await res.json();

        if (apiResult.status === "success") {
          Swal.fire({
            title: "Dihapus!",
            text: "Anime telah dihapus dari My List.",
            icon: "info",
            width: "320px",
            background: "#1a1a1a",
            color: "#ffffff",
            confirmButtonColor: "#ff6600",
            customClass: { popup: "rounded-3xl" },
            timer: 3000,
            timerProgressBar: true,
          });
          loadMyList(); // Refresh halaman
        }
      } catch (err) {
        Swal.fire({
          title: "Error!",
          text: "Gagal menghapus anime karena masalah server.",
          icon: "error",
          background: "#1a1a1a",
          color: "#ffffff",
          confirmButtonColor: "#ff6600",
        });
      }
    }
  });
};
