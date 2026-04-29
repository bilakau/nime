import { SANKA_API } from "./config.js";
import { showLoading, createAnimeCard, createSkeletonGrid } from "./utils.js";

export async function loadGenres(selectedGenreSlug = null, page = 1) {
  window.scrollTo({ top: 0, behavior: "smooth" });
  // 1. Matikan loading spinner bawaan
  showLoading(false);

  // Update URL browser
  const url = selectedGenreSlug
    ? `/genres/${selectedGenreSlug}?page=${page}`
    : "/genres";
  history.pushState(null, null, url);

  const display = document.getElementById("content-display");
  if (!display) return;

  // Fetch daftar genre dari Sanka API (dengan fallback statis)
  let genres = [];
  try {
    const genreRes = await fetch(`${SANKA_API}/genre`);
    if (genreRes.ok) {
      const genreJson = await genreRes.json();
      genres = (genreJson?.data?.genreList || []).map(g => ({
        name: g.title,
        slug: g.genreId,
      }));
    }
  } catch (e) {
    console.warn("Gagal fetch genre list dari Sanka, pakai fallback.");
  }

  // Fallback statis kalau fetch gagal
  if (genres.length === 0) {
    genres = [
      { name: "Action", slug: "action" }, { name: "Adventure", slug: "adventure" },
      { name: "Comedy", slug: "comedy" }, { name: "Drama", slug: "drama" },
      { name: "Fantasy", slug: "fantasy" }, { name: "Horror", slug: "horror" },
      { name: "Mystery", slug: "mystery" }, { name: "Romance", slug: "romance" },
      { name: "Sci-Fi", slug: "sci-fi" }, { name: "Shounen", slug: "shounen" },
      { name: "Slice of Life", slug: "slice-of-life" }, { name: "Sports", slug: "sports" },
    ];
  }

  // 2. RENDER HEADER & TOMBOL GENRE
  let topHtml = `
    <div class="animate-fadeIn">
        <div class="flex items-center gap-4 mb-8">
            <div class="w-12 h-12 bg-[#ff6600]/20 rounded-2xl flex items-center justify-center text-[#ff6600] shadow-xl">
                <i class="fas fa-filter text-xl"></i>
            </div>
            <div>
                <h1 class="text-3xl font-black uppercase tracking-tighter text-white">Browse by Genre</h1>
                <p class="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Find your favorite categories</p>
            </div>
        </div>

        <div class="bg-[#121212] border border-gray-800 p-6 rounded-2xl mb-10 shadow-inner">
            <h3 class="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                <i class="fas fa-layer-group text-[#ff6600]"></i> Available Categories
            </h3>
            <div class="flex flex-wrap gap-2">
                ${genres
                  .map((g) => {
                    const isSelected = selectedGenreSlug === g.slug;
                    return `
                      <button onclick="app.loadGenres('${g.slug}', 1)" 
                          class="px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all duration-300 
                          ${isSelected ? "bg-[#ff6600] text-white shadow-lg shadow-[#ff6600]/20" : "bg-gray-900 text-gray-400 border border-gray-800 hover:border-[#ff6600] hover:text-white"}">
                          ${g.name}
                      </button>
                  `;
                  })
                  .join("")}
            </div>
        </div>
  `;

  // 3. TENTUKAN ISI KONTEN BAWAH (Skeleton atau Teks Kosong)
  let contentHtml = "";
  if (selectedGenreSlug) {
    const genreName =
      genres.find((g) => g.slug === selectedGenreSlug)?.name ||
      selectedGenreSlug;

    // TAMPILKAN SKELETON GRID SAAT USER KLIK GENRE TERTENTU
    contentHtml = `
        <div id="genre-content-area">
            <div class="flex justify-between items-center mb-6 px-1">
                <h2 class="text-xl font-black uppercase tracking-tighter text-white">${genreName} <span class="text-gray-600 ml-1 font-normal italic text-lg">Anime</span></h2>
                <span class="bg-gray-900 text-gray-500 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border border-gray-800 animate-pulse">MEMUAT...</span>
            </div>
            ${createSkeletonGrid(12)}
        </div>
    </div>`; // Tutup tag dari topHtml
  } else {
    // Tampilan awal sebelum klik apa-apa
    contentHtml = `
        <div id="genre-content-area" class="text-center py-20">
            <p class="text-gray-600 font-bold uppercase text-[10px] tracking-[0.3em]">Please select a category above to start browsing</p>
        </div>
    </div>`;
  }

  // Masukkan tombol dan skeleton ke layar secara instan!
  display.innerHTML = topHtml + contentHtml;

  // 4. JIKA ADA GENRE YANG DIKLIK, AMBIL DATA API & TIMPA SKELETON
  if (selectedGenreSlug) {
    try {
      let animeList = [];
      const res = await fetch(`${SANKA_API}/genre/${selectedGenreSlug}?page=${page}`);
      if (res.ok) {
        const json = await res.json();
        animeList = json?.data?.animeList || [];
      }

      const contentArea = document.getElementById("genre-content-area");
      if (!contentArea) return;

      if (animeList.length > 0) {
        const genreName =
          genres.find((g) => g.slug === selectedGenreSlug)?.name ||
          selectedGenreSlug;

        let finalHtml = `
            <div class="flex justify-between items-center mb-6 px-1 animate-fadeIn">
                <h2 class="text-xl font-black uppercase tracking-tighter text-white">${genreName} <span class="text-gray-600 ml-1 font-normal italic text-lg">Anime</span></h2>
                <span class="bg-gray-900 text-gray-500 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border border-gray-800">PAGE ${page}</span>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 md:gap-6 animate-fadeIn">
        `;

        animeList.forEach((anime) => {
          const scoreVal = anime.score && anime.score.trim() !== "" ? anime.score : null;
          const normalised = {
            ...anime,
            thumb: anime.poster,
            slug: anime.animeId,
            episode: anime.episodes,
            extra: scoreVal || "Completed",
          };
          finalHtml += createAnimeCard(normalised, `/anime/${anime.animeId}`);
        });

        finalHtml += `</div>` + createPaginationGenre(selectedGenreSlug, page);
        contentArea.innerHTML = finalHtml;
      } else {
        contentArea.innerHTML = `
            <div class="text-center py-20 bg-gray-900/20 rounded-3xl border border-dashed border-gray-800 animate-fadeIn">
                <i class="fas fa-search text-gray-700 text-4xl mb-4"></i>
                <p class="text-gray-500 font-bold uppercase text-[10px] tracking-widest">No anime found in this category</p>
            </div>`;
      }
    } catch (error) {
      console.error("Genre fetch error:", error);
    }
  }
}

function createPaginationGenre(slug, currentPage) {
  return `
    <div class="flex justify-center items-center gap-4 mt-12 mb-8">
        <button onclick="app.loadGenres('${slug}', ${currentPage - 1})" 
            ${currentPage <= 1 ? 'disabled class="opacity-20 cursor-not-allowed"' : 'class="bg-gray-800 hover:bg-[#ff6600] text-white px-6 py-2 rounded-xl text-[10px] font-black transition uppercase"'}>Prev</button>
        <span class="bg-[#ff6600] text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase shadow-lg shadow-[#ff6600]/20">Page ${currentPage}</span>
        <button onclick="app.loadGenres('${slug}', ${currentPage + 1})" 
            class="bg-gray-800 hover:bg-[#ff6600] text-white px-6 py-2 rounded-xl text-[10px] font-black transition uppercase">Next</button>
    </div>
  `;
}
