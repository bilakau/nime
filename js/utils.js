// Fungsi Loading (Biarkan seperti semula)
export function showLoading(show) {
  const loader = document.getElementById("loading");
  const display = document.getElementById("content-display"); // Ambil elemen tempat anime berada

  if (loader && display) {
    if (show) {
      // Saat loading mulai: Munculkan spinner, sembunyikan konten
      loader.classList.remove("hidden");
      display.classList.add("hidden");
    } else {
      // Saat loading selesai: Sembunyikan spinner, munculkan konten baru
      loader.classList.add("hidden");
      display.classList.remove("hidden");
    }
  }
}

// Fungsi Proxy Gambar (Dinonaktifkan sementara karena kendala akses)
export function getProxyImage(url) {
  if (!url || String(url).trim() === "" || url === "null" || url === "undefined") {
    return "https://placehold.co/400x600/121212/666666?text=No+Poster";
  }
  return url;
}

// Fungsi Render Card Dinamis untuk SEMUA Halaman
export function createAnimeCard(anime, url) {
  let topLeftBadge = "";

  // 1. PRIORITAS UTAMA: Cek apakah ada properti 'extra' (Biasanya dari page Completed)
  if (anime.extra) {
    topLeftBadge = `
            <div class="absolute top-2 left-2 bg-gray-900/90 backdrop-blur-md border border-gray-700 text-yellow-500 text-[8px] md:text-[9px] font-black px-2 py-0.5 rounded shadow-lg flex items-center gap-1 z-10">
                <i class="fas fa-star text-[8px]"></i> ${anime.extra}
            </div>
        `;
  }
  // 2. FALLBACK: Jika tidak ada 'extra', gunakan logika Ongoing / Completed
  else {
    const statusVal = (anime.status || "").toLowerCase();
    const epText = String(anime.episode || anime.eps || "").toLowerCase();

    const isCompleted =
      statusVal.includes("complete") ||
      statusVal.includes("tamat") ||
      statusVal.includes("lengkap") ||
      epText.includes("end") ||
      epText.includes("tamat");

    if (isCompleted) {
      const ratingScore = anime.score || anime.rating || "N/A";
      topLeftBadge = `
                <div class="absolute top-2 left-2 bg-gray-900/90 backdrop-blur-md border border-gray-700 text-yellow-500 text-[8px] md:text-[9px] font-black px-2 py-0.5 rounded shadow-lg flex items-center gap-1 z-10">
                    <i class="fas fa-star text-[8px]"></i> ${ratingScore}
                </div>
            `;
    } else {
      topLeftBadge = `
                <div class="absolute top-2 left-2 bg-[#ff6600] text-white text-[8px] md:text-[9px] font-black px-2 py-0.5 rounded shadow-lg uppercase tracking-widest z-10">
                    ONGOING
                </div>
            `;
    }
  }

  // Teks episode di pojok kanan atas
  const displayEp = anime.episode || anime.eps || "?";
  const rawThumb = anime.thumb || anime.thumbnail || "";
  const proxiedThumb = getProxyImage(rawThumb);

  return `
        <a href="${url}" 
           data-title="${anime.title.replace(/"/g, '&quot;')}" 
           data-thumb="${rawThumb.replace(/"/g, '&quot;')}"
           class="cursor-pointer group animate-fadeIn block anime-link">
            <div class="relative overflow-hidden rounded-xl aspect-[3/4] bg-gray-900 mb-2 shadow-lg">
                <img src="${proxiedThumb}" 
                     class="w-full h-full object-cover group-hover:scale-110 transition duration-500" 
                     onerror="this.onerror=null; this.src='https://via.placeholder.com/300x400?text=No+Image';">
                
                ${topLeftBadge}
                
                <div class="absolute top-2 right-2 bg-black/80 text-white font-bold text-[8px] md:text-[9px] px-2 py-0.5 rounded backdrop-blur-sm z-10 border border-gray-800">
                    ${displayEp}
                </div>
            </div>
            
            <h3 class="text-xs md:text-sm font-bold group-hover:text-[#ff6600] line-clamp-2 leading-tight text-gray-200 transition-colors">
                ${anime.title}
            </h3>
        </a>
    `;
}

export function createPagination(currentPage, type) {
  return `
        <div class="flex justify-center items-center gap-4 mt-8 mb-8">
            <a href="/${type}?page=${currentPage - 1}" 
                ${currentPage <= 1 ? 'onclick="return false" class="opacity-30 cursor-default bg-gray-800 px-6 py-2 rounded-xl font-bold transition"' : 'class="bg-gray-800 hover:bg-[#ff6600] px-6 py-2 rounded-xl font-bold transition anime-link"'}>Prev</a>
            <span class="bg-[#ff6600] px-4 py-2 rounded-xl font-bold">Page ${currentPage}</span>
            <a href="/${type}?page=${currentPage + 1}" 
                class="bg-gray-800 hover:bg-[#ff6600] px-6 py-2 rounded-xl font-bold transition anime-link">Next</a>
        </div>
    `;
}

export function createSkeletonGrid(count = 10) {
  let skeletons = "";
  for (let i = 0; i < count; i++) {
    skeletons += `
            <div class="relative w-full rounded-lg overflow-hidden aspect-[3/4] bg-gray-800 animate-pulse border border-gray-700">
                <div class="w-full h-full bg-gray-700/50"></div>
                
                <div class="absolute bottom-0 left-0 w-full p-2 md:p-3 bg-gradient-to-t from-black via-black/80 to-transparent">
                    <div class="h-2.5 md:h-3 bg-gray-500 rounded-full w-3/4 mb-2"></div>
                    <div class="h-2 bg-gray-600 rounded-full w-1/2"></div>
                </div>
                
                <div class="absolute top-2 left-2 w-10 h-4 bg-gray-600 rounded-sm"></div>
                <div class="absolute top-2 right-2 w-8 h-4 bg-gray-600 rounded-sm"></div>
            </div>
        `;
  }
  return `<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-4 md:gap-6 animate-fadeIn">${skeletons}</div>`;
}

export function createSkeletonList(count = 5) {
  let skeletons = "";
  for (let i = 0; i < count; i++) {
    skeletons += `
            <div class="bg-gray-900/50 border border-gray-800 p-3 rounded-xl flex items-center gap-4 animate-pulse">
                <div class="w-10 h-10 flex-shrink-0 rounded-lg bg-gray-700"></div>
                
                <div class="flex-grow">
                    <div class="h-3 bg-gray-700 rounded w-3/4 mb-2"></div>
                    <div class="h-2 bg-gray-800 rounded w-1/2"></div>
                </div>
            </div>
        `;
  }
  return skeletons;
}
