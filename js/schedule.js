import { SANKA_API } from "./config.js";
import { showLoading, createSkeletonList, getProxyImage } from "./utils.js";

export async function loadSchedule() {
  window.scrollTo({ top: 0, behavior: "smooth" });
  showLoading(false);
  history.pushState(null, null, `/schedule`);

  const display = document.getElementById("content-display");

  // TAMPILKAN SKELETON JADWAL
  if (display) {
    let skeletonHtml = `
      <div class="animate-fadeIn max-w-6xl mx-auto">
          <h2 class="text-2xl md:text-3xl font-black mb-8 flex items-center gap-3 uppercase tracking-tighter text-gray-500 animate-pulse">
              <div class="w-6 h-6 bg-gray-700 rounded-md"></div> Memuat Jadwal...
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
    `;

    for (let i = 0; i < 6; i++) {
      skeletonHtml += `
          <div class="bg-[#121212] border border-gray-800 p-6 rounded-3xl shadow-lg flex flex-col">
              <div class="h-5 w-24 bg-gray-700 rounded mb-5 animate-pulse"></div>
              <div class="flex flex-col gap-3 flex-grow">
                  ${createSkeletonList(3)}
              </div>
          </div>
      `;
    }
    skeletonHtml += `</div></div>`;
    display.innerHTML = skeletonHtml;
  }

  try {
    // Ambil data dari API SANKA
    const response = await fetch(`${SANKA_API}/schedule`);
    const json = await response.json();
    const data = json.data;

    if (!data || data.length === 0) {
      if (display)
        display.innerHTML = `<div class="text-center py-20 text-red-500 font-bold uppercase tracking-widest text-[10px]">Gagal memuat jadwal rilis.</div>`;
      return;
    }

    // TIMPA SKELETON DENGAN DATA ASLI
    let html = `
      <div class="animate-fadeIn max-w-6xl mx-auto">
          <h2 class="text-2xl md:text-3xl font-black mb-8 flex items-center gap-3 uppercase tracking-tighter text-white">
              <i class="fas fa-calendar-alt text-[#ff6600]"></i> Jadwal Rilis
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      `;

    data.forEach((dayData) => {
      html += `
          <div class="bg-[#121212] border border-gray-800 p-6 rounded-3xl shadow-lg flex flex-col">
              <h3 class="text-lg font-black mb-5 flex items-center gap-3 uppercase tracking-widest text-[#ff6600] border-b border-gray-800 pb-3">
                  <i class="fas fa-clock"></i> ${dayData.day}
              </h3>
              <div class="flex flex-col gap-3 flex-grow">
      `;

      if (dayData.anime_list && dayData.anime_list.length > 0) {
        dayData.anime_list.forEach((anime) => {
          const title = anime.title || "Unknown";
          const poster = anime.poster || "";

          html += `
              <div onclick="app.loadDetail('${anime.slug}', '${poster}')" class="group cursor-pointer bg-gray-900/50 hover:bg-gray-800 border border-gray-800 hover:border-[#ff6600]/50 p-3 rounded-xl transition-all flex items-center gap-4 shadow-sm">
                  
                  <div class="w-10 h-14 md:w-12 md:h-16 flex-shrink-0 rounded-lg overflow-hidden border border-gray-700 group-hover:border-[#ff6600] transition-colors duration-300">
                      <img src="${getProxyImage(poster)}" alt="${title}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" onerror="this.onerror=null; this.src='https://via.placeholder.com/150x200?text=No+Image';">
                  </div>
                  
                  <div class="flex-grow min-w-0">
                      <h4 class="text-xs font-bold text-gray-300 group-hover:text-[#ff6600] transition-colors line-clamp-2 leading-snug">
                          ${title}
                      </h4>
                  </div>
                  <i class="fas fa-chevron-right text-gray-600 group-hover:text-[#ff6600] transition-colors text-[10px] mr-2"></i>
              </div>
          `;
        });
      } else {
        html += `
              <div class="flex items-center justify-center h-full min-h-[80px] border border-dashed border-gray-800 rounded-xl bg-gray-900/20">
                  <p class="text-[10px] text-gray-600 font-bold uppercase tracking-widest flex items-center gap-2">
                      <i class="fas fa-bed"></i> Tidak ada rilis
                  </p>
              </div>
        `;
      }

      html += `</div></div>`;
    });

    html += `</div></div>`;

    if (display) display.innerHTML = html;
  } catch (error) {
    console.error("Schedule Error:", error);
    if (display)
      display.innerHTML = `<div class="text-center py-20 text-red-500 font-bold uppercase tracking-widest text-[10px]">Terjadi kesalahan pada server.</div>`;
  }
}
