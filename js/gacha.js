import { SANKA_API } from "./config.js";

export async function gachaAnime() {
    // 1. Create and inject Gacha Overlay
    const overlay = document.createElement('div');
    overlay.className = 'gacha-overlay animate-fadeIn';
    overlay.innerHTML = `
        <div class="gacha-reveal-container">
            <div id="gacha-orb" class="gacha-orb">
                <i class="fas fa-question text-white text-4xl"></i>
            </div>
            <div id="gacha-light" class="gacha-light-burst"></div>
            
            <div id="gacha-result" class="gacha-result">
                <div class="gacha-rarity-aura"></div>
                <div class="gacha-result-card">
                    <img id="result-img" src="" class="w-full h-full object-cover aspect-[3/4]" alt="Result">
                    <div class="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black via-black/80 to-transparent">
                        <h2 id="result-title" class="text-xl font-bold text-white mb-2 leading-tight"></h2>
                        <div class="flex items-center justify-between">
                            <span class="px-2 py-1 bg-[#ff6600] text-black text-[10px] font-black uppercase rounded">GOTCHA!</span>
                            <span id="result-status" class="text-gray-400 text-[10px] font-bold uppercase tracking-widest"></span>
                        </div>
                    </div>
                </div>
                <div class="mt-8 flex gap-4">
                    <button id="gacha-go-btn" class="px-8 py-3 bg-[#ff6600] text-white font-black uppercase tracking-widest rounded-full shadow-lg shadow-[#ff6600]/30 hover:scale-105 active:scale-95 transition-all text-sm">
                        LIHAT DETAIL
                    </button>
                    <button onclick="location.reload()" class="px-8 py-3 bg-gray-800 text-gray-300 font-black uppercase tracking-widest rounded-full hover:bg-gray-700 transition-all text-sm">
                        ULANGI
                    </button>
                </div>
            </div>

            <div id="gacha-status" class="mt-12 text-center">
                <p class="text-[#ff6600] font-black uppercase tracking-[0.3em] text-xs animate-pulse">Memanggil Takdir...</p>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

    const orb = document.getElementById('gacha-orb');
    const light = document.getElementById('gacha-light');
    const resultDiv = document.getElementById('gacha-result');
    const statusText = document.getElementById('gacha-status');

    try {
        // Start "Searching" phase
        orb.classList.add('shaking');

        // Fetch data simultaneously with animation
        const isComplete = Math.random() > 0.3;
        const type = isComplete ? 'complete-anime' : 'ongoing-anime';
        const maxPage = isComplete ? 60 : 5;
        const page = Math.floor(Math.random() * maxPage) + 1;
        
        const fetchPromise = fetch(`${SANKA_API}/${type}?page=${page}`).then(r => r.json());
        
        // Wait at least 1.5s for "suspense"
        const [json] = await Promise.all([
            fetchPromise,
            new Promise(resolve => setTimeout(resolve, 2000))
        ]);

        const animeList = json?.data?.animeList || [];
        if (animeList.length === 0) throw new Error("List anime kosong");
        
        const randomIdx = Math.floor(Math.random() * animeList.length);
        const anime = animeList[randomIdx];
        const slug = anime.animeId || anime.slug;
        const thumb = anime.poster || anime.thumb;
        const title = anime.title;
        const status = anime.status || (isComplete ? 'TAMAT' : 'ONGOING');

        // Prepare result
        document.getElementById('result-img').src = thumb;
        document.getElementById('result-title').textContent = title;
        document.getElementById('result-status').textContent = status;

        // Reveal Sequence
        orb.classList.remove('shaking');
        orb.style.animation = 'none'; // Stop floating
        
        // Final suspense pause
        await new Promise(r => setTimeout(r, 200));

        // BURST!
        light.classList.add('light-burst-animate');
        
        setTimeout(() => {
            orb.style.display = 'none';
            statusText.style.display = 'none';
            resultDiv.classList.add('result-show');
        }, 300);

        // Bind Go Button
        document.getElementById('gacha-go-btn').onclick = () => {
            overlay.classList.add('opacity-0');
            setTimeout(() => {
                overlay.remove();
                if (window.app && window.app.loadDetail) {
                    window.app.loadDetail(slug, thumb, title);
                } else {
                    window.location.href = `/anime/${slug}`;
                }
            }, 300);
        };

    } catch (error) {
        console.error("Gacha Error:", error);
        overlay.innerHTML = `
            <div class="text-center p-8 bg-gray-900 rounded-3xl border border-gray-800">
                <i class="fas fa-exclamation-triangle text-red-500 text-5xl mb-4"></i>
                <h2 class="text-2xl font-bold mb-2">Gacha Gagal!</h2>
                <p class="text-gray-400 mb-6">Sepertinya koneksi kita sedang terganggu...</p>
                <button onclick="location.reload()" class="px-8 py-3 bg-[#ff6600] text-white font-black rounded-full">COBA LAGI</button>
            </div>
        `;
    }
}
