export async function loadDonate() {
  window.scrollTo({ top: 0, behavior: "smooth" });

  const display = document.getElementById("content-display");
  if (!display) return;

  // Update Judul & URL untuk SEO
  document.title = "Donate & Support - MaouAnime";
  history.pushState(null, null, "/donate");

  display.innerHTML = `
        <div class="max-w-3xl mx-auto animate-fadeIn px-2">
            <div class="mb-10 text-center md:text-left">
                <h1 class="text-3xl md:text-4xl font-black text-white tracking-tighter mb-2 uppercase">Support <span class="text-[#ff6600]">KuzenAnime</span></h1>
                <p class="text-gray-500 text-sm font-medium uppercase tracking-widest">Bantu kami agar tetap bisa melayani kalian setiap hari.</p>
            </div>

            <div class="bg-[#121212] border border-gray-800 rounded-3xl p-6 md:p-8 mb-8 text-center shadow-2xl overflow-hidden">
                <h3 class="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-8">Scan QRIS All Payment</h3>
                
                <div class="mb-8">
                    <img src="/img/qris-kuzen.png" 
                         alt="QRIS MaouAnime" 
                         class="w-full max-w-xs mx-auto rounded-2xl shadow-lg border border-gray-800/50" 
                         onerror="this.onerror=null; this.src='https://via.placeholder.com/500x500?text=QRIS+IMAGE+NOT+FOUND';">
                </div>
                
                <p class="text-xs text-gray-500 italic max-w-sm mx-auto leading-relaxed">
                    Dukung operasional server & update anime harian melalui QRIS. Terima kasih atas supportnya!
                </p>
            </div>

            <div class="space-y-4">
                <h3 class="text-[10px] font-black text-[#ff6600] uppercase tracking-[0.3em] ml-2 mb-4">Metode Lainnya</h3>
                
                <a href="https://saweria.co/widgets/qr?streamKey=de67ea139cfb5f4faa87bc291dccf3ab" target="_blank" class="flex items-center gap-4 bg-[#121212] border border-gray-800 p-4 rounded-2xl hover:border-[#ff6600] hover:bg-orange-950/10 transition-all group shadow-sm">
                    <div class="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-[#ff6600] text-xl group-hover:scale-110 transition">
                        <i class="fas fa-coffee"></i>
                    </div>
                    <div class="flex-grow min-w-0">
                        <h4 class="text-sm font-bold text-white group-hover:text-[#ff6600] transition">Tako.id</h4>
                        <p class="text-[10px] text-gray-600 uppercase font-black tracking-tighter">Dukung via GOPAY, OVO, Dana, LinkAja</p>
                    </div>
                    <i class="fas fa-external-link-alt text-gray-700 text-xs mr-2"></i>
                </a>
            </div>

            <p class="mt-12 text-center text-[9px] text-gray-700 font-black uppercase tracking-widest">
                Arigatou Gozaimasu! Enjoy your anime!
            </p>
        </div>
    `;
}
