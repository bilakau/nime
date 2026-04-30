const CACHE_NAME = "maounime-cache-v1";

// Saat di-install, Service Worker langsung aktif tanpa menunggu
self.addEventListener("install", (event) => {
    self.skipWaiting();
});

// Bersihkan cache lama jika ada versi baru
self.addEventListener("activate", (event) => {
    event.waitUntil(clients.claim());
});

// Strategi: Jaringan selalu yang utama, kalau internet mati, baru cari di cache
self.addEventListener("fetch", (event) => {
    // Hanya handle request ke origin kita sendiri atau file statis lokal
    // Lewati request eksternal (API, gambar luar, dll) agar tidak bermasalah dengan CORS/Opaque
    if (
        !event.request.url.startsWith(self.location.origin) ||
        event.request.url.includes("api.kanata") ||
        event.request.url.includes("mp4")
    ) {
        return;
    }

    event.respondWith(
        fetch(event.request).catch(async () => {
            const cachedResponse = await caches.match(event.request);
            if (cachedResponse) {
                return cachedResponse;
            }
            // Jika network gagal dan cache kosong, lempar error agar browser tau request gagal secara native
            // atau bisa return Response kosong dengan status 404
            throw new Error("Network failure and no cache match");
        }),
    );
});
