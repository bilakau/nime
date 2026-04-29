import { USER_API, USER_API_BACKUP, SANKA_API, ANIME_API } from "./config.js";
import { fetchWithFallback } from "./api.js";
import { showLoading, getProxyImage } from "./utils.js";

// Global state untuk sorting episode di halaman detail
let currentEpisodes = [];
let sortAscending = true;

// 1. Fungsi mengambil detail LENGKAP dari API Sanka
async function fetchFullDetailFromSanka(slug) {
  try {
    const response = await fetch(`${SANKA_API}/anime/${slug}`);
    if (!response.ok) throw new Error(`Sanka API Error: ${response.status}`);
    const result = await response.json();
    return result.data || null;
  } catch (error) {
    console.warn("Sanka API Error:", error);
    return null;
  }
}

// 1b. Fallback: Ambil detail dari Otakudesu (Kanata API)
async function fetchDetailFromOtakudesu(slug) {
  try {
    // Bersihkan slug jika ada sisa-sisa path
    let cleanSlug = slug.replace("/anime/", "").replace("/", "");
    
    // Coba slug as-is dulu
    let response = await fetch(`${ANIME_API}/anime/${cleanSlug}`);
    
    // Jika gagal, coba hapus "-sub-indo" (Sanka style)
    if (!response.ok && cleanSlug.includes("-sub-indo")) {
      const altSlug = cleanSlug.replace("-sub-indo", "");
      console.log(`Fallback mencoba slug alternatif: ${altSlug}`);
      response = await fetch(`${ANIME_API}/anime/${altSlug}`);
    }

    if (!response.ok) throw new Error(`Otakudesu API Error: ${response.status}`);
    const result = await response.json();
    
    if (!result) return null;

    // Normalisasi format agar sesuai dengan yang diharapkan loadDetail (Format Sanka)
    // Mendukung dua format: { data: {...} } atau langsung {...}
    const d = result.data || result;
    
    // Bersihkan Judul Utama Anime
    const animeTitle = (d.title || "")
      .replace(/Sub\s*Indo.*/gi, "")
      .replace(/Subtitle\s*Indonesia/gi, "")
      .trim();

    // Pisahkan episode reguler dan batch
    const rawEpisodes = d.episodes || d.episode_list || [];
    const episodeList = [];
    let batch = null;

    rawEpisodes.forEach(ep => {
      let rawTitle = ep.title || ep.episode_title || "";
      const lowRaw = rawTitle.toLowerCase();
      
      // Strict Hidding: Jika judul mengandung "Sub Indo :" atau "Subtitle Indonesia :" 
      // biasanya itu link ke halaman Series/Movie, bukan episode. Sembunyikan.
      // Mendukung variasi: Sub Indo:, Sub Indo :, Subtitle Indonesia :, dll
      if (/(Sub\s*Indo|Subtitle\s*Indonesia)\s*:/gi.test(rawTitle)) {
          return;
      }

      // Bersihkan Judul Episode: Hapus "Sub Indo", "Subtitle Indonesia", dll
      let cleanTitle = rawTitle
          .replace(/\[BATCH\]/gi, "")
          .replace(/Sub\s*Indo\s*(:)?/gi, "")
          .replace(/Subtitle\s*Indonesia/gi, "")
          .trim();

      // Filter Redundancy: Sembunyikan jika text-nya cuma judul anime saja (sama dengan animeTitle)
      if (cleanTitle.toLowerCase() === animeTitle.toLowerCase() || cleanTitle === "") {
          return;
      }

      const epObj = {
        title: cleanTitle || rawTitle,
        episodeId: (ep.slug || ep.episode_endpoint || "").replace("/episode/", "").replace("/", "")
      };

      if (lowRaw.includes("batch")) {
        batch = {
          title: epObj.title,
          batchId: epObj.episodeId
        };
      } else {
        episodeList.push(epObj);
      }
    });

    return {
      title: animeTitle || d.title,
      japanese: d.japanese || d.japanese_title,
      score: d.score,
      poster: d.thumbnail || d.poster,
      type: d.type,
      status: d.status,
      aired: d.aired,
      duration: d.duration,
      studios: d.producer,
      genreList: d.genres || (d.genre_list || []).map(g => g.genre_name || g),
      synopsis: {
        paragraphs: [d.synopsis || ""]
      },
      episodeList: episodeList,
      batch: batch,
      isFallback: true
    };
  } catch (error) {
    console.warn("Otakudesu Fallback Error:", error);
    return null;
  }
}

// 1c. Search Fallback: Pencarian dengan 1 kata kunci (Kanata API)
async function fetchBySearchFromOtakudesu(title) {
  if (!title) return null;
  try {
    // Ambil kata pertama saja (Abaikan karakter spesial)
    const firstWord = title.trim().split(/\s+/)[0].replace(/[^\w]/g, "");
    if (!firstWord) return null;

    console.log(`Fallback mencari kueri singkat: ${firstWord}`);
    const response = await fetch(`${ANIME_API}/search/${encodeURIComponent(firstWord)}`);
    if (!response.ok) return null;
    
    const result = await response.json();
    const list = result.data || result || [];
    if (Array.isArray(list) && list.length > 0) {
      // Ambil hasil pertama yang paling relevan (slug)
      const firstResultSlug = list[0].slug;
      console.log(`Menemukan hasil search: ${firstResultSlug}, mengambil detail...`);
      return await fetchDetailFromOtakudesu(firstResultSlug);
    }
    return null;
  } catch (error) {
    console.warn("Search Fallback Error:", error);
    return null;
  }
}

export async function loadDetail(slug, thumbFromHome = null, titleFromHome = null) {
  window.scrollTo({ top: 0, behavior: "smooth" });
  showLoading(false);

  if (thumbFromHome) {
    localStorage.setItem(`saved_thumb_${slug}`, thumbFromHome);
  }
  if (titleFromHome) {
    localStorage.setItem(`saved_title_${slug}`, titleFromHome);
  }

  localStorage.setItem("current_anime_slug", slug);
  if (window.location.pathname !== `/anime/${slug}`) {
    history.pushState(null, null, `/anime/${slug}`);
  }

  const display = document.getElementById("content-display");

  // 2. Tampilkan Skeleton Loader agar transisi halus
  if (display) {
    display.innerHTML = `
      <div class="animate-pulse px-4 md:px-0">
          <div class="flex flex-col md:flex-row gap-8 mb-10">
              <div class="w-full md:w-72 h-[450px] md:h-96 bg-gray-800 rounded-3xl mx-auto md:mx-0"></div>
              <div class="flex-grow">
                  <div class="h-10 bg-gray-800 w-3/4 mb-4 rounded-lg hidden md:block"></div>
                  <div class="h-6 bg-gray-800 w-1/4 mb-6 rounded-lg hidden md:block"></div>
                  <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                      <div class="h-16 bg-gray-800 rounded-2xl"></div>
                      <div class="h-16 bg-gray-800 rounded-2xl"></div>
                      <div class="h-16 bg-gray-800 rounded-2xl"></div>
                      <div class="h-16 bg-gray-800 rounded-2xl"></div>
                  </div>
              </div>
          </div>
      </div>
    `;
  }

  // 3. Ambil data dari Sanka API, jika gagal pakai Otakudesu
  let dataSanka = await fetchFullDetailFromSanka(slug);
  
  if (!dataSanka) {
    console.log("Sanka gagal, mencoba Otakudesu fallback...");
    dataSanka = await fetchDetailFromOtakudesu(slug);
  }

  // 4. Ultimate Fallback: Jika slug gagal (mungkin beda format), gunakan Search 1 Kata
  if (!dataSanka) {
    const backupTitle = titleFromHome || localStorage.getItem(`saved_title_${slug}`);
    if (backupTitle) {
      console.log(`Slug gagal, mencoba Search Otakudesu fallback untuk title: ${backupTitle}`);
      dataSanka = await fetchBySearchFromOtakudesu(backupTitle);
    }
  }

  if (!dataSanka) {
    if (display) {
      display.innerHTML = `
        <div class="text-center py-20 animate-fadeIn">
            <i class="fas fa-exclamation-circle text-[#ff6600] text-5xl mb-4"></i>
            <p class="text-white font-black uppercase tracking-widest text-xs mb-6">Gagal memuat detail anime.</p>
            <button onclick="location.reload()" class="bg-gray-800 hover:bg-[#ff6600] text-white px-8 py-3 rounded-2xl font-black uppercase tracking-widest transition-all text-[10px]">Coba Lagi</button>
        </div>`;
    }
    return;
  }

  // --- DATA MAPPING ---
  const title = dataSanka.title || "Unknown Title";
  const rating = dataSanka.score || "N/A";
  const type = dataSanka.type || "TV";
  const thumb =
    dataSanka.poster ||
    localStorage.getItem(`saved_thumb_${slug}`) ||
    "https://via.placeholder.com/300x400?text=No+Image";

  // --- SINOPSIS ---
  let synopsisHtml =
    "<p class='mb-4 italic text-gray-500'>Sinopsis resmi belum tersedia untuk anime ini.</p>";

  if (dataSanka.synopsis?.paragraphs && dataSanka.synopsis.paragraphs.length > 0) {
    synopsisHtml = dataSanka.synopsis.paragraphs
      .map((p) => `<p class="mb-4">${p}</p>`)
      .join("");
  }

  document.title = `${title} Sub Indo - KuzenAnime`;

  // --- EPISODE LIST dari Sanka (episodeList + batch) ---
  // Jika fallback, biasanya list episode sudah urut ascending (lama ke baru)
  currentEpisodes = dataSanka.isFallback 
    ? [...(dataSanka.episodeList || [])]
    : [...(dataSanka.episodeList || [])].reverse(); 
    
  sortAscending = true;
  const batchItem = dataSanka.batch || null;

  // 4. Render HTML Lengkap
  display.innerHTML = `
    <div class="animate-fadeIn relative">
        <button onclick="window.history.back()" class="flex items-center gap-2 text-gray-500 hover:text-white font-bold text-xs mb-8 transition-all group">
            <i class="fas fa-arrow-left group-hover:-translate-x-1 transition-transform"></i> BACK
        </button>

        <div class="flex flex-col md:flex-row gap-8 md:gap-12 mb-12">
            <div class="w-56 sm:w-64 md:w-80 mx-auto md:mx-0 flex-shrink-0">
                <img src="${getProxyImage(thumb)}" class="w-full rounded-[2.5rem] shadow-2xl border border-gray-800 object-cover aspect-[3/4]" alt="${title}" onerror="this.onerror=null; this.src='https://via.placeholder.com/300x400?text=No+Image';">
            </div>
            
            <div class="flex-grow text-center md:text-left">
                <div class="flex flex-wrap justify-center md:justify-start gap-3 mb-4">
                    <span class="bg-[#ff6600]/10 text-[#ff6600] text-[10px] font-black px-3 py-1 rounded-full border border-[#ff6600]/20 uppercase">${type}</span>
                    <span class="bg-blue-500/10 text-blue-400 text-[10px] font-black px-3 py-1 rounded-full border border-blue-500/20 uppercase">${dataSanka.status || "N/A"}</span>
                </div>

                <h1 class="text-4xl md:text-6xl font-black mb-2 tracking-tighter leading-none text-white">${title}</h1>
                <p class="text-[#ff6600] font-bold text-sm mb-6">${dataSanka.japanese || ""}</p>
                
                <div class="flex flex-wrap justify-center md:justify-start gap-4 mb-8">
                    <div id="watch-now-container"></div>
                    <div id="bookmark-container"></div>
                </div>

                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 text-left">
                    <div class="bg-[#121212] p-4 rounded-3xl border border-gray-800">
                        <p class="text-[9px] font-black text-gray-500 uppercase mb-1 tracking-widest">Score</p>
                        <p class="text-sm font-black text-yellow-500"><i class="fas fa-star mr-1"></i> ${rating}</p>
                    </div>
                    <div class="bg-[#121212] p-4 rounded-3xl border border-gray-800">
                        <p class="text-[9px] font-black text-gray-500 uppercase mb-1 tracking-widest">Studios</p>
                        <p class="text-sm font-black text-white truncate">${dataSanka.studios || "N/A"}</p>
                    </div>
                    <div class="bg-[#121212] p-4 rounded-3xl border border-gray-800">
                        <p class="text-[9px] font-black text-gray-500 uppercase mb-1 tracking-widest">Duration</p>
                        <p class="text-sm font-black text-white">${dataSanka.duration || "N/A"}</p>
                    </div>
                    <div class="bg-[#121212] p-4 rounded-3xl border border-gray-800">
                        <p class="text-[9px] font-black text-gray-500 uppercase mb-1 tracking-widest">Aired</p>
                        <p class="text-sm font-black text-white">${dataSanka.aired || "N/A"}</p>
                    </div>
                </div>

                <div class="flex flex-wrap justify-center md:justify-start gap-2 mb-8">
                    ${(dataSanka.genreList || [])
                      .map((g) => {
                        const name = typeof g === "string" ? g : g.title || g.name;
                        return `<span class="bg-gray-800/40 hover:bg-gray-700 border border-gray-700/50 px-4 py-1.5 rounded-xl text-[10px] font-bold text-gray-400 hover:text-white transition cursor-default">${name}</span>`;
                      })
                      .join("")}
                </div>

                <div class="bg-gray-900/20 p-6 md:p-8 rounded-[2rem] border border-gray-800/50 text-left">
                    <h3 class="text-xs font-black uppercase tracking-[0.2em] text-gray-500 mb-4 flex items-center gap-2">
                        <i class="fas fa-align-left text-[#ff6600]"></i> Storyline
                    </h3>
                    <div class="text-sm text-gray-400 leading-relaxed font-medium">
                        ${synopsisHtml}
                    </div>
                </div>
            </div>
        </div>

        <div class="bg-[#121212] border border-gray-800 rounded-[2.5rem] p-6 md:p-10 mb-12 shadow-2xl">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <h2 class="text-2xl font-black flex items-center gap-4 uppercase tracking-tighter text-white">
                    <span class="w-2 h-8 bg-[#ff6600] rounded-full"></span> Episode List
                </h2>
                <button onclick="app.toggleEpisodeSort()" class="flex items-center gap-2 bg-gray-800/50 hover:bg-gray-700 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-white transition-all border border-gray-700 w-max self-end sm:self-auto">
                    <i id="sort-icon" class="fas fa-sort-amount-down-alt"></i>
                    <span id="sort-text">Eps 1 - Last</span>
                </button>
            </div>
            
            ${batchItem
                ? `
                <div class="mb-10 bg-orange-500/5 border border-orange-500/10 p-6 rounded-3xl">
                    <h3 class="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500/60 mb-5 flex items-center gap-2">
                        <i class="fas fa-box-open"></i> Full Batch Download
                    </h3>
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div onclick="app.loadBatch('${batchItem.batchId}')" class="bg-orange-500/10 hover:bg-orange-500 border border-orange-500/20 p-4 rounded-2xl cursor-pointer transition-all group">
                            <span class="text-xs font-black text-orange-500 group-hover:text-white transition truncate block">${batchItem.title}</span>
                        </div>
                    </div>
                </div>
            `
                : ""
            }

            <div id="episode-grid" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                ${renderEpisodeGrid(currentEpisodes)}
            </div>
        </div>
        </div>

        ${
          dataSanka?.recommendedAnimeList &&
          dataSanka.recommendedAnimeList.length > 0
            ? `
            <div class="mt-20">
                <div class="flex items-center justify-between mb-8">
                    <h3 class="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-4">
                        <span class="w-2 h-8 bg-[#ff6600] rounded-full"></span> You May Also Like
                    </h3>
                </div>
                <div class="flex gap-4 md:gap-5 overflow-x-auto pb-8 no-scrollbar scroll-smooth items-start">
                    ${dataSanka.recommendedAnimeList
                      .map(
                        (rec) => `
                        <a href="/anime/${rec.animeId}" class="w-36 md:w-48 flex-none group cursor-pointer anime-link">
                            
                            <div class="relative w-full aspect-[3/4] rounded-2xl md:rounded-3xl overflow-hidden border-2 border-transparent group-hover:border-[#ff6600] transition-all duration-300 shadow-lg bg-gray-900">
                                <img src="${getProxyImage(rec.poster)}" class="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="${rec.title}" onerror="this.onerror=null; this.src='https://via.placeholder.com/300x400?text=No+Image';">
                            </div>
                            
                            <p class="mt-3 md:mt-4 text-[10px] md:text-xs font-black text-gray-500 group-hover:text-white truncate transition uppercase tracking-wider">${rec.title}</p>
                        </a>
                    `,
                      )
                      .join("")}
                </div>
            </div>
        `
            : ""
        }
    </div>
  `;

  // 5. Inisialisasi Fitur Tambahan
  initWatchNowButton(dataSanka.episodeList);
  initBookmarkButton({ slug, title, thumb });
}

// --- FUNGSI WATCH NOW ---
function initWatchNowButton(episodeList) {
    const container = document.getElementById("watch-now-container");
    if (!container || !episodeList || episodeList.length === 0) return;

    const latestEp = episodeList[0]; // Sanka API returns newest first
    
    container.innerHTML = `
        <a href="/episode/${latestEp.episodeId}" 
            class="bg-gradient-to-r from-[#ff6600] to-[#ff8533] hover:scale-105 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 shadow-xl shadow-[#ff6600]/20 border border-white/10 anime-link">
            <i class="fas fa-play"></i> Watch Now
        </a>
    `;
}

// --- FUNGSI TAMPILAN GRID EPISODE ---
function renderEpisodeGrid(episodes) {
    return episodes.map((ep) => `
        <a href="/episode/${ep.episodeId}" class="bg-gray-800/30 hover:bg-[#ff6600] border border-gray-800 hover:border-[#ff6600] p-5 rounded-2xl cursor-pointer transition-all group flex justify-between items-center shadow-sm anime-link">
            <span class="text-xs font-bold group-hover:text-white text-gray-300 transition">${ep.title}</span>
            <div class="w-8 h-8 rounded-full bg-gray-800 group-hover:bg-white/20 flex items-center justify-center transition">
                <i class="fas fa-play text-[10px] text-[#ff6600] group-hover:text-white"></i>
            </div>
        </a>
    `).join("");
}

// --- LOGIKA SORTING EPISODE ---
export function toggleEpisodeSort() {
    const grid = document.getElementById("episode-grid");
    const sortIcon = document.getElementById("sort-icon");
    const sortText = document.getElementById("sort-text");
    
    if (!grid || !currentEpisodes.length) return;

    // Toggle state
    sortAscending = !sortAscending;
    currentEpisodes.reverse();

    // Update UI
    grid.innerHTML = renderEpisodeGrid(currentEpisodes);
    
    if (sortAscending) {
        sortIcon.className = "fas fa-sort-amount-down-alt";
        sortText.innerText = "Eps 1 - Last";
    } else {
        sortIcon.className = "fas fa-sort-amount-up";
        sortText.innerText = "Last - Eps 1";
    }
}

// --- FUNGSI BOOKMARK (TETAP SAMA) ---
async function initBookmarkButton(animeData) {
  const token = localStorage.getItem("kuzen_token");
  const container = document.getElementById("bookmark-container");
  if (!container) return;

  if (!token) {
    container.innerHTML = `
      <button onclick="window.app.showAuthModal(true)" class="bg-gray-800/50 hover:bg-gray-700 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 border border-gray-800">
          <i class="far fa-heart text-[#ff6600]"></i> Add to My List
      </button>`;
    return;
  }

  try {
    const res = await fetchWithFallback(`/bookmarks/check/${animeData.slug}`, USER_API, USER_API_BACKUP, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const result = await res.json();
    renderBookmarkButton(result.isBookmarked, animeData);
  } catch (err) {
    console.error("Gagal cek status bookmark:", err);
  }
}

function renderBookmarkButton(isBookmarked, animeData) {
  const container = document.getElementById("bookmark-container");
  const titleClean = animeData.title.replace(/'/g, "\\'");

  container.innerHTML = `
    <button onclick="handleBookmarkToggle('${animeData.slug}', '${titleClean}', '${animeData.thumb}')" 
        class="${isBookmarked ? "bg-[#ff6600] shadow-[#ff6600]/20" : "bg-gray-800/80"} hover:scale-105 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 shadow-xl border border-white/5">
        <i class="${isBookmarked ? "fas text-white" : "far text-[#ff6600]"} fa-heart"></i> 
        ${isBookmarked ? "Saved in List" : "Add to My List"}
    </button>
  `;
}

// ==========================================
// LOGIKA BOOKMARK (MY LIST)
// ==========================================

window.handleBookmarkToggle = async (slug, title, thumb) => {
  // 1. Cek apakah user sudah login
  const token = localStorage.getItem("kuzen_token");
  if (!token) {
    // Jika belum login, panggil modal login
    if (window.app && window.app.showAuthModal) {
      return window.app.showAuthModal(true);
    } else {
      return Swal.fire(
        "Akses Ditolak",
        "Silakan login terlebih dahulu!",
        "warning",
      );
    }
  }

  // 2. Jika sudah login, tembak ke API backend kamu
  try {
    const res = await fetchWithFallback("/bookmarks/toggle", USER_API, USER_API_BACKUP, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        anime_slug: slug,
        anime_title: title,
        anime_thumb: thumb,
      }),
    });

    const result = await res.json();

    // 3. Jika berhasil disimpan/dihapus dari database
    if (result.status === "success") {
      // Render ulang tombolnya biar otomatis berubah jadi "Saved in List"
      initBookmarkButton({ slug, title, thumb });

      const isAdded = result.action === "added";

      // Tampilkan Notifikasi Pop-up (Toast)
      Swal.fire({
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        icon: isAdded ? "success" : "info",
        title: isAdded ? "Tersimpan!" : "Dihapus!",
        text: result.message,
        background: "#1a1a1a",
        color: "#ffffff",
        customClass: {
          popup: "border border-gray-800 rounded-2xl shadow-2xl mt-16 md:mt-4",
        },
      });
    }
  } catch (err) {
    console.error("Error toggle bookmark:", err);
    Swal.fire("Error", "Gagal menghubungi server.", "error");
  }
};
