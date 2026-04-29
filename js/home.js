import { SANKA_API } from "./config.js";
import {
  showLoading,
  createAnimeCard,
  createPagination,
  createSkeletonGrid,
  getProxyImage,
} from "./utils.js";

// Variabel global untuk menyimpan "timer hantu" agar bisa dimatikan
let heroInterval;

export async function loadHome() {
  window.scrollTo({ top: 0, behavior: "smooth" });
  // Matikan loading muter-muter bawaan
  showLoading(false);

  const display = document.getElementById("content-display");
  if (display) {
    // TAMPILKAN SKELETON HOME (Hero Besar + 2 Baris Kategori)
    display.innerHTML = `
      <div class="animate-fadeIn">
        <div class="w-full h-[350px] md:h-[500px] rounded-2xl md:rounded-3xl bg-gray-800 animate-pulse mb-8 md:mb-10 border border-gray-700"></div>
        
        <div class="h-6 md:h-8 w-48 bg-gray-800 rounded animate-pulse mb-4 mt-8"></div>
        ${createSkeletonGrid(6)}
        
        <div class="h-6 md:h-8 w-48 bg-gray-800 rounded animate-pulse mb-4 mt-8"></div>
        ${createSkeletonGrid(6)}
      </div>
    `;
  }

  let homeJson = null;
  try {
    const res = await fetch(`${SANKA_API}/home`);
    if (res.ok) homeJson = await res.json();
  } catch (e) {
    console.error("Gagal fetch home dari Sanka:", e);
  }

  const ongoingList = homeJson?.data?.ongoing?.animeList || [];
  const completeList = homeJson?.data?.completed?.animeList || [];

  if (display) {
    display.innerHTML = ""; // Bersihkan skeleton

    // 1. Render Hero Slider (Ambil 5 anime pertama dari Ongoing)
    if (ongoingList.length > 0) {
      renderHeroSlider(ongoingList.slice(0, 5));
    }

    // 2. Render List Kategori
    renderPreview(ongoingList, "Ongoing Anime", "ongoing");
    renderPreview(completeList, "Complete Anime", "complete");
  }
}

// ==========================================
// FITUR BARU: RENDER HERO SLIDER (DESAIN KANATA/PREMIUM)
// ==========================================
function renderHeroSlider(animeList) {
  const display = document.getElementById("content-display");

  let slidesHtml = "";
  let dotsHtml = "";

  animeList.forEach((anime, index) => {
    // Slide Aktif Pertama
    const isActive = index === 0 ? "opacity-100 z-10" : "opacity-0 z-0";
    const thumb = anime.poster || anime.thumb || anime.thumbnail;

    slidesHtml += `
      <div class="hero-slide absolute inset-0 transition-opacity duration-1000 ease-in-out ${isActive}" data-index="${index}">
          
          <div class="absolute inset-0 bg-cover bg-center blur-sm opacity-40 transform scale-110" style="background-image: url('${getProxyImage(thumb)}');"></div>
          <div class="absolute inset-0 bg-gradient-to-t from-[#0b0b0b] via-[#0b0b0b]/60 to-transparent z-10"></div>
          <div class="absolute inset-0 bg-gradient-to-r from-[#0b0b0b]/95 via-[#0b0b0b]/60 to-transparent z-10"></div>
          
          <div class="absolute inset-0 flex items-center justify-center p-4 md:p-12 lg:px-16 z-20">
              <div class="flex flex-col md:flex-row items-center gap-3 md:gap-10 w-full max-w-6xl animate-slideUp text-center md:text-left">
                  
                  <div class="w-36 sm:w-36 md:w-52 lg:w-60 flex-shrink-0 rounded-xl md:rounded-3xl overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.8)] border border-gray-700/50">
                      <img src="${getProxyImage(thumb)}" class="w-full h-full object-cover aspect-[3/4]" alt="${anime.title}" onerror="this.onerror=null; this.src='https://via.placeholder.com/300x400?text=No+Image';">
                  </div>

                  <div class="flex-grow flex flex-col items-center md:items-start w-full mt-2 md:mt-0">
                      <div class="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-2 md:mb-4">
                          <span class="bg-[#ff6600] text-white text-[8px] md:text-[10px] font-black px-2 md:px-3 py-1 rounded border border-[#ff6600] uppercase tracking-widest flex items-center gap-1 shadow-lg shadow-[#ff6600]/30">
                              <i class="fas fa-fire"></i> Trending
                          </span>
                          <span class="bg-gray-800/80 backdrop-blur-sm text-gray-300 border border-gray-700 text-[8px] md:text-[10px] font-bold px-2 md:px-3 py-1 rounded uppercase tracking-widest">
                              Ep ${anime.episodes || anime.episode || anime.eps || "?"}
                          </span>
                      </div>

                      <h2 class="text-xl sm:text-3xl md:text-5xl lg:text-6xl font-black text-white mb-3 md:mb-6 tracking-tighter leading-tight drop-shadow-2xl line-clamp-2 md:line-clamp-3 w-full px-2 md:px-0">${anime.title}</h2>
                      
                      <div class="flex justify-center md:justify-start gap-3 md:gap-4 w-full">
                          <a href="/anime/${anime.animeId || anime.slug}" 
                                  class="bg-[#ff6600] hover:bg-[#e65c00] text-white px-6 md:px-8 py-2 md:py-3.5 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-[#ff6600]/30 flex items-center justify-center gap-2 hover:scale-105 active:scale-95 anime-link">
                              <i class="fas fa-play"></i> Tonton
                          </a>
                      </div>
                  </div>

              </div>
          </div>
      </div>
    `;

    const dotClass =
      index === 0
        ? "bg-[#ff6600] w-4 md:w-6"
        : "bg-gray-500 w-1.5 md:w-2 hover:bg-gray-400";
    dotsHtml += `<div class="hero-dot h-1.5 md:h-2 rounded-full transition-all duration-300 cursor-pointer ${dotClass}" data-index="${index}"></div>`;
  });

  // UBAH TINGGI CONTAINER HERO DI SINI: h-[350px] md:h-[500px]
  const heroContainer = `
    <div class="relative w-full h-[420px] sm:h-[500px] md:h-[500px] rounded-2xl md:rounded-[2rem] overflow-hidden mb-8 md:mb-12 shadow-2xl group border border-gray-800/50">
        ${slidesHtml}
        
        <button id="hero-prev" class="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-30 bg-black/40 hover:bg-[#ff6600] text-white w-8 h-8 md:w-12 md:h-12 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all backdrop-blur-md border border-white/10">
            <i class="fas fa-chevron-left text-xs md:text-lg"></i>
        </button>
        <button id="hero-next" class="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-30 bg-black/40 hover:bg-[#ff6600] text-white w-8 h-8 md:w-12 md:h-12 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all backdrop-blur-md border border-white/10">
            <i class="fas fa-chevron-right text-xs md:text-lg"></i>
        </button>

        <div class="absolute bottom-4 left-1/2 -translate-x-1/2 md:bottom-6 md:left-auto md:right-8 md:translate-x-0 z-30 flex gap-1.5 md:gap-2 items-center">
            ${dotsHtml}
        </div>
    </div>
  `;

  display.insertAdjacentHTML("afterbegin", heroContainer);

  // Memanggil fungsi logika slider yang sudah ada
  initHeroSlider(animeList.length);
}

function initHeroSlider(totalSlides) {
  let currentSlide = 0;
  const slides = document.querySelectorAll(".hero-slide");
  const dots = document.querySelectorAll(".hero-dot");
  const prevBtn = document.getElementById("hero-prev");
  const nextBtn = document.getElementById("hero-next");

  if (!slides.length) return;

  if (heroInterval) clearInterval(heroInterval);

  // FUNGSI UPDATE SLIDER (PERBAIKAN LOGIKA DOTS)
  const updateSlider = (newIndex) => {
    // 1. Matikan Slide & Dot Lama
    slides[currentSlide].classList.remove("opacity-100", "z-10");
    slides[currentSlide].classList.add("opacity-0", "z-0");

    // Dot Lama: Jadi Abu & Kecil
    dots[currentSlide].classList.remove("bg-[#ff6600]", "w-4", "md:w-6");
    dots[currentSlide].classList.add("bg-gray-500", "w-1.5", "md:w-2");

    // 2. Hitung Index Baru (Looping)
    currentSlide = (newIndex + totalSlides) % totalSlides;

    // 3. Hidupkan Slide & Dot Baru
    slides[currentSlide].classList.remove("opacity-0", "z-0");
    slides[currentSlide].classList.add("opacity-100", "z-10");

    // Dot Baru: Jadi Orange & Lebar
    dots[currentSlide].classList.remove("bg-gray-500", "w-1.5", "md:w-2");
    dots[currentSlide].classList.add("bg-[#ff6600]", "w-4", "md:w-6");
  };

  // Event Listeners
  if (nextBtn)
    nextBtn.addEventListener("click", () => {
      updateSlider(currentSlide + 1);
      resetInterval();
    });

  if (prevBtn)
    prevBtn.addEventListener("click", () => {
      updateSlider(currentSlide - 1);
      resetInterval();
    });

  dots.forEach((dot, index) => {
    dot.addEventListener("click", () => {
      updateSlider(index);
      resetInterval();
    });
  });

  // Auto Slide
  const startInterval = () => {
    heroInterval = setInterval(() => {
      // Cek apakah elemen masih ada di DOM (Penting untuk SPA)
      if (!document.querySelector(".hero-slide")) {
        clearInterval(heroInterval);
        return;
      }
      updateSlider(currentSlide + 1);
    }, 4000);
  };

  const resetInterval = () => {
    clearInterval(heroInterval);
    startInterval();
  };

  startInterval();
}
// ==========================================

export async function loadCategory(type, page = 1) {
  const display = document.getElementById("content-display");

  window.scrollTo({ top: 0, behavior: "smooth" });
  showLoading(false);
  history.pushState(null, null, `/${type}?page=${page}`);

  display.innerHTML = `
    <h2 class="text-xl md:text-2xl font-black mb-6 border-l-4 border-[#ff6600] pl-4 tracking-tighter text-gray-700 bg-gray-800/20 w-max rounded-r-md animate-pulse">MEMUAT DATA...</h2>
    ${createSkeletonGrid(12)}
  `;

  // Map type ke endpoint Sanka
  const endpointMap = { ongoing: "ongoing-anime", complete: "complete-anime" };
  const endpoint = endpointMap[type] || `${type}-anime`;

  let animeList = [];
  try {
    const res = await fetch(`${SANKA_API}/${endpoint}?page=${page}`);
    if (res.ok) {
      const json = await res.json();
      animeList = json?.data?.animeList || [];
    }
  } catch (e) {
    console.error("loadCategory error:", e);
  }

  display.innerHTML = `<h2 class="text-xl md:text-2xl font-black mb-6 border-l-4 border-[#ff6600] pl-4 uppercase tracking-tighter text-white capitalize">${type} Anime</h2>`;

  let html = `<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-4 md:gap-6">`;
  animeList.forEach((a) => {
    // Badge: hari rilis untuk ongoing, score untuk completed
    const badge = type === "ongoing"
      ? (a.releaseDay || "Ongoing")
      : (a.score && a.score.trim() !== "" ? a.score : "Completed");
    const normalised = { ...a, thumb: a.poster, slug: a.animeId, episode: a.episodes, extra: badge };
    html += createAnimeCard(normalised, `/anime/${a.animeId}`);
  });
  html += `</div>` + createPagination(page, type);

  display.insertAdjacentHTML("beforeend", html);
}

function renderPreview(list, title, type) {
  const display = document.getElementById("content-display");
  const sliderId = `slider-${type}`;

  // Buat semua kartu
  let cardsHtml = "";
  list.forEach((a) => {
    const badge = type === "ongoing"
      ? (a.releaseDay || "Ongoing")
      : (a.score && a.score.trim() !== "" ? a.score : "Completed");
    const normalised = { ...a, thumb: a.poster, slug: a.animeId, episode: a.episodes, extra: badge };
    // Kartu dengan lebar tetap agar bisa di-scroll horizontal
    cardsHtml += `<div class="flex-shrink-0 w-[140px] sm:w-[160px] md:w-[175px]">${createAnimeCard(normalised, `/anime/${a.animeId}`)}</div>`;
  });

  const html = `
    <div class="mt-8">
      <div class="flex justify-between items-center mb-4">
          <h2 class="text-lg md:text-2xl font-black border-l-4 border-[#ff6600] pl-3 uppercase tracking-tighter">${title}</h2>
          <div class="flex items-center gap-2">
            <button id="${sliderId}-prev" class="w-8 h-8 rounded-full bg-gray-800 hover:bg-[#ff6600] border border-gray-700 hover:border-[#ff6600] flex items-center justify-center transition-all text-white text-xs">
              <i class="fas fa-chevron-left"></i>
            </button>
            <button id="${sliderId}-next" class="w-8 h-8 rounded-full bg-gray-800 hover:bg-[#ff6600] border border-gray-700 hover:border-[#ff6600] flex items-center justify-center transition-all text-white text-xs">
              <i class="fas fa-chevron-right"></i>
            </button>
            <a href="/${type}?page=1" class="ml-1 text-[10px] font-bold text-gray-500 hover:text-white cursor-pointer transition uppercase anime-link">View All <i class="fas fa-chevron-right ml-1"></i></a>
          </div>
      </div>
      <div id="${sliderId}" class="flex gap-3 md:gap-4 overflow-x-auto scroll-smooth pb-3 scrollbar-hide" style="scrollbar-width:none; -ms-overflow-style:none;">
        ${cardsHtml}
      </div>
    </div>
  `;

  display.insertAdjacentHTML("beforeend", html);

  // Inisialisasi tombol prev/next setelah DOM dirender
  const track = document.getElementById(sliderId);
  const prevBtn = document.getElementById(`${sliderId}-prev`);
  const nextBtn = document.getElementById(`${sliderId}-next`);
  const scrollAmt = () => track.clientWidth * 0.75;

  if (prevBtn) prevBtn.addEventListener("click", () => track.scrollBy({ left: -scrollAmt(), behavior: "smooth" }));
  if (nextBtn) nextBtn.addEventListener("click", () => track.scrollBy({ left: scrollAmt(), behavior: "smooth" }));
}

export async function handleSearch() {
  const mobileInput = document.getElementById("search-input-mobile");
  const desktopInput = document.getElementById("search-input-desktop");
  const q = (mobileInput?.value || desktopInput?.value || "").trim();

  if (!q) return;

  // Kosongkan input setelah query didapatkan
  if (mobileInput) mobileInput.value = "";
  if (desktopInput) desktopInput.value = "";

  // Tutup container pencarian
  const mobileSearchContainer = document.getElementById("mobile-search-container");
  const desktopSearchContainer = document.getElementById("desktop-search-container");
  if (mobileSearchContainer) mobileSearchContainer.classList.add("hidden");
  if (desktopSearchContainer) desktopSearchContainer.classList.add("hidden");

  // Matikan loading muter-muter
  showLoading(false);
  history.pushState(null, null, `/search?q=${encodeURIComponent(q)}`);

  const display = document.getElementById("content-display");

  if (display) {
    // TAMPILKAN SKELETON PENCARIAN
    display.innerHTML = `
      <div class="animate-fadeIn">
        <div class="flex items-center gap-3 mb-6 mt-2">
          <div class="w-1 h-6 bg-gray-700 rounded-full animate-pulse"></div>
          <h2 class="text-xl font-black uppercase tracking-tighter text-gray-500 animate-pulse">
            Mencari: "${q}"...
          </h2>
        </div>
        ${createSkeletonGrid(12)}
      </div>
    `;
  }

  try {
    let animeList = [];
    const res = await fetch(`${SANKA_API}/search/${encodeURIComponent(q)}`);
    if (res.ok) {
      const json = await res.json();
      animeList = json?.data?.animeList || [];
    }

    if (display) {
      if (animeList.length > 0) {
        display.innerHTML = `
          <div class="animate-fadeIn">
            <div class="flex items-center gap-3 mb-6 mt-2">
              <div class="w-1 h-6 bg-[#ff6600] rounded-full"></div>
              <h2 class="text-xl font-black uppercase tracking-tighter text-white">
                Search Results: <span class="text-[#ff6600]">"${q}"</span>
              </h2>
            </div>
            <div id="search-results-grid" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 md:gap-6"></div>
          </div>
        `;

        const grid = document.getElementById("search-results-grid");
        let html = "";
        animeList.forEach((anime) => {
          const normalised = { ...anime, thumb: anime.poster, slug: anime.animeId };
          html += createAnimeCard(normalised, `/anime/${anime.animeId}`);
        });
        grid.innerHTML = html;
      } else {
        display.innerHTML = `
          <div class="text-center py-32 opacity-50">
            <i class="fas fa-search-minus text-5xl mb-4 text-gray-600"></i>
            <p class="font-bold font-['Poppins'] text-sm text-white">Anime tidak ditemukan</p>
            <p class="text-[10px] text-gray-400 mt-2 max-w-xs mx-auto">
              Tidak ada hasil untuk "${q}". Coba gunakan satu atau dua kata kunci utama saja.
            </p>
            <a href="/" class="mt-6 inline-block text-[10px] bg-gray-900 border border-gray-700 px-6 py-2.5 rounded-full font-bold hover:text-[#ff6600] transition uppercase tracking-widest text-white anime-link">
              Kembali ke Home
            </a>
          </div>
        `;
      }
    }
  } catch (error) {
    console.error("Search Error:", error);
  }
}
