import { SANKA_API } from "./config.js";
import { showLoading } from "./utils.js";

export async function loadBatch(slug) {
  if (!slug) return;
  window.scrollTo({ top: 0, behavior: "smooth" });
  showLoading(true);

  history.pushState(null, null, `/batch/${slug}`);

  // Fetch dari Sanka API
  let data = null;
  try {
    const res = await fetch(`${SANKA_API}/batch/${slug}`);
    if (res.ok) {
      const json = await res.json();
      data = json.data || null;
    }
  } catch (e) {
    console.error("Gagal fetch batch dari Sanka:", e);
  }

  const display = document.getElementById("content-display");
  if (display) display.innerHTML = "";

  if (!data) {
    display.innerHTML = `<div class="text-center py-20 text-red-500 font-bold uppercase tracking-widest text-[10px]">Gagal memuat data batch.</div>`;
    showLoading(false);
    return;
  }

  const animeSlug = localStorage.getItem("current_anime_slug");
  const title = data.title || "Download Batch";
  const thumb = data.poster || data.thumb || "https://via.placeholder.com/150x200";

  display.innerHTML = `
    <div class="animate-fadeIn max-w-4xl mx-auto">
        <button onclick="${animeSlug ? `app.loadDetail('${animeSlug}')` : `app.navigateTo('/')`}" 
            class="mb-6 bg-gray-900 border border-gray-800 hover:bg-[#ff6600] px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-white transition-all shadow-sm group">
            <i class="fas fa-arrow-left mr-2 group-hover:-translate-x-1 transition-transform"></i> Kembali
        </button>

        <div class="bg-[#121212] border border-gray-800 p-6 rounded-3xl mb-8 shadow-2xl flex flex-col md:flex-row gap-6 items-center md:items-start">
            <div class="w-32 md:w-40 flex-shrink-0">
                <img src="${thumb}" class="w-full rounded-2xl shadow-lg border border-gray-700 object-cover aspect-[3/4]" onerror="this.src='https://via.placeholder.com/150x200'">
            </div>
            
            <div class="flex-grow text-center md:text-left pt-2">
                <h1 class="text-xl md:text-3xl font-black mb-4 tracking-tight text-white leading-tight">${title}</h1>
                <div class="flex flex-wrap justify-center md:justify-start gap-3 text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                    <span class="text-orange-500 bg-orange-900/10 px-3 py-1.5 rounded-lg border border-orange-900/30">
                        <i class="fas fa-file-archive mr-1"></i> BATCH EPISODES
                    </span>
                    <span class="text-[#ff6600] bg-orange-900/10 px-3 py-1.5 rounded-lg border border-orange-900/30">
                        <i class="fas fa-download mr-1"></i> MULTIPLE RESOLUTIONS
                    </span>
                </div>
            </div>
        </div>

        <div class="bg-[#121212] border border-gray-800 rounded-3xl p-6 md:p-8 shadow-inner">
            <h2 class="text-xs font-black mb-6 flex items-center gap-3 uppercase tracking-tighter text-gray-300 border-b border-gray-800 pb-4">
                <i class="fas fa-cloud-download-alt text-orange-500"></i> Link Download Tersedia
            </h2>
            
            <div class="space-y-6">
                ${renderDownloadLinks(data.downloadUrl)}
            </div>
        </div>
    </div>
    `;

  showLoading(false);
}

// Render struktur Sanka: downloadUrl.formats[].qualities[].title/size/urls[]
function renderDownloadLinks(downloadUrl) {
  if (!downloadUrl || !downloadUrl.formats || downloadUrl.formats.length === 0) {
    return `<div class="p-4 bg-gray-900/50 rounded-xl text-center text-gray-500 text-xs font-bold uppercase tracking-widest">Belum ada link download.</div>`;
  }

  let html = "";

  downloadUrl.formats.forEach((format) => {
    if (!format.qualities) return;

    format.qualities.forEach((qItem) => {
      const qualityName = qItem.title || "Unknown Quality";
      const fileSize = qItem.size || "Unknown Size";

      html += `
        <div class="bg-gray-900/30 hover:bg-gray-900/80 border border-gray-800 hover:border-gray-700 p-5 rounded-2xl transition duration-300">
            
            <div class="mb-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <span class="bg-[#ff6600] text-white text-[10px] font-black px-4 py-1.5 rounded-lg shadow-lg shadow-orange-600/20 uppercase tracking-widest">
                    <i class="fas fa-video mr-1"></i> ${qualityName}
                </span>
                <span class="bg-gray-800 border border-gray-700 text-gray-400 text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest">
                    <i class="fas fa-hdd mr-1"></i> ${fileSize}
                </span>
                <span class="hidden sm:block h-px flex-grow bg-gray-800"></span>
            </div>

            <div class="flex flex-wrap gap-2">
                ${
                  qItem.urls && qItem.urls.length > 0
                    ? qItem.urls.map((server) => `
                        <a href="${server.url}" target="_blank" rel="noopener noreferrer" 
                            class="flex items-center gap-2 bg-gray-800 hover:bg-orange-600 border border-gray-700 hover:border-orange-500 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase text-gray-300 hover:text-white transition-all shadow-sm group">
                            <i class="fas fa-download opacity-50 group-hover:opacity-100"></i>
                            ${server.title || "Download"}
                        </a>
                      `).join("")
                    : '<span class="text-xs text-red-500">No servers available</span>'
                }
            </div>
        </div>
      `;
    });
  });

  return html;
}
