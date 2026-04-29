// js/auth.js
import { showLoading } from "./utils.js";
import { USER_API, USER_API_BACKUP } from "./config.js";
import { fetchWithFallback } from "./api.js";

// ==========================================
// HELPER POPUP TEMA KUZENANIME
// ==========================================
const showPopup = (title, text, icon = "success") => {
  Swal.fire({
    title: title,
    text: text,
    icon: icon,
    width: "320px",
    background: "#121212",
    color: "#ffffff",
    confirmButtonColor: "#ff6600",
    customClass: { popup: "rounded-3xl border border-gray-800" },
    timer: 3000,
    timerProgressBar: true,
  });
};

// ==========================================
// 1. AUTH MODAL (LOGIN/REGISTER POPUP)
// ==========================================
export function showAuthModal(isLogin = true) {
  const existingModal = document.getElementById("auth-modal");
  if (existingModal) existingModal.remove();

  const modalHtml = `
    <div id="auth-modal" class="auth-modal-overlay animate-fadeIn">
        <div class="bg-[#121212] border border-gray-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative animate-slideDown">
            <button onclick="document.getElementById('auth-modal').remove()" class="absolute top-5 right-5 text-gray-500 hover:text-white transition"><i class="fas fa-times text-xl"></i></button>

            <div class="p-8">
                <div class="text-center mb-8">
                    <div class="w-14 h-14 bg-[#ff6600] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#ff6600]/20">
                        <i class="fas ${isLogin ? "fa-lock" : "fa-user-plus"} text-white text-xl"></i>
                    </div>
                    <h2 class="text-2xl font-black uppercase tracking-tighter text-white">${isLogin ? "Welcome Back" : "Join Member"}</h2>
                    <p class="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">${isLogin ? "Login to access your profile" : "Start your journey at KuzenAnime"}</p>
                </div>

                <form id="auth-form" onsubmit="event.preventDefault(); window.app.${isLogin ? "handleLogin()" : "handleRegister()"}">
                    ${
                      !isLogin
                        ? `
                    <div class="mb-4">
                        <label class="block text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">Username</label>
                        <div class="relative"><i class="fas fa-user absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 text-xs"></i>
                            <input type="text" id="auth-username" required placeholder="KuzenMember" class="w-full bg-gray-900/50 border border-gray-800 rounded-xl py-3 pl-11 pr-4 text-sm text-white focus:border-[#ff6600] focus:outline-none transition-all">
                        </div>
                    </div>`
                        : ""
                    }

                    <div class="mb-4">
                        <label class="block text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">Email Address</label>
                        <div class="relative"><i class="fas fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 text-xs"></i>
                            <input type="email" id="auth-email" required placeholder="your@email.com" class="w-full bg-gray-900/50 border border-gray-800 rounded-xl py-3 pl-11 pr-4 text-sm text-white focus:border-[#ff6600] focus:outline-none transition-all">
                        </div>
                    </div>

                    <div class="mb-6">
                        <label class="block text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">Password</label>
                        <div class="relative"><i class="fas fa-key absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 text-xs"></i>
                            <input type="password" id="auth-password" required placeholder="••••••••" class="w-full bg-gray-900/50 border border-gray-800 rounded-xl py-3 pl-11 pr-4 text-sm text-white focus:border-[#ff6600] focus:outline-none transition-all">
                        </div>
                    </div>

                    <p id="auth-error" class="text-red-500 text-[10px] font-bold text-center mb-4 hidden"></p>

                    <button type="submit" class="w-full bg-[#ff6600] hover:bg-[#e65c00] text-white font-black py-3.5 rounded-xl uppercase tracking-widest transition shadow-lg shadow-[#ff6600]/20 text-[11px] active:scale-95">
                        ${isLogin ? "Login Now" : "Create Account"}
                    </button>
                </form>

                <div class="mt-8 text-center pt-6 border-t border-gray-800/50">
                    <p class="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                        ${isLogin ? "Don't have an account?" : "Already a member?"} 
                        <span onclick="window.app.showAuthModal(${!isLogin})" class="text-[#ff6600] hover:text-white cursor-pointer transition-colors ml-1 border-b border-[#ff6600]">
                            ${isLogin ? "Register Here" : "Login Now"}
                        </span>
                    </p>
                </div>
            </div>
        </div>
    </div>`;
  document.body.insertAdjacentHTML("beforeend", modalHtml);
}

// ==========================================
// 2. LOGIKA REGISTER & LOGIN
// ==========================================
export async function handleRegister() {
  const username = document.getElementById("auth-username").value.trim();
  const email = document.getElementById("auth-email").value.trim();
  const password = document.getElementById("auth-password").value;
  const errorEl = document.getElementById("auth-error");

  if (username.length < 3)
    return showError(errorEl, "Username minimal 3 karakter!");
  if (password.length < 6)
    return showError(errorEl, "Password minimal 6 karakter!");

  errorEl.classList.add("hidden");
  showLoading(true);

  try {
    const res = await fetchWithFallback("/register", USER_API, USER_API_BACKUP, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });
    const data = await res.json();

    if (data.status === "success") {
      showPopup("Success!", "Registrasi berhasil, silakan login.", "success");
      showAuthModal(true);
    } else {
      showError(errorEl, data.message);
    }
  } catch (err) {
    showError(errorEl, "Koneksi backend bermasalah.");
  }
  showLoading(false);
}

export async function handleLogin() {
  const email = document.getElementById("auth-email").value;
  const password = document.getElementById("auth-password").value;
  const errorEl = document.getElementById("auth-error");

  showLoading(true);
  try {
    const res = await fetchWithFallback("/login", USER_API, USER_API_BACKUP, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();

    if (data.status === "success") {
      localStorage.setItem("kuzen_token", data.token);
      localStorage.setItem("kuzen_user", JSON.stringify(data.user));

      if (document.getElementById("auth-modal"))
        document.getElementById("auth-modal").remove();

      // Update UI & Reload jika perlu
      checkAuthUI();

      showPopup(
        "Success!",
        `Halo ${data.user.username}, selamat datang kembali!`,
        "success",
      );

      const currentPath = window.location.pathname;
      if (currentPath === "/mylist" || currentPath === "/history") {
        setTimeout(() => window.location.reload(), 500);
      }
    } else {
      showError(errorEl, data.message);
    }
  } catch (err) {
    showError(errorEl, "Gagal terhubung ke API.");
  }
  showLoading(false);
}

function showError(el, msg) {
  el.innerText = msg;
  el.classList.remove("hidden");
}

// ==========================================
// 3. LOGIKA LOGOUT
// ==========================================
window.handleLogout = () => {
  Swal.fire({
    title: "Logout?",
    text: "Semua sesi akan dihentikan.",
    icon: "warning",
    background: "#121212",
    color: "#ffffff",
    showCancelButton: true,
    confirmButtonColor: "#ff6600",
    cancelButtonColor: "#333",
    confirmButtonText: "Ya, Keluar",
    customClass: { popup: "rounded-3xl border border-gray-800" },
  }).then((result) => {
    if (result.isConfirmed) {
      localStorage.removeItem("kuzen_token");
      localStorage.removeItem("kuzen_user");

      checkAuthUI();

      Swal.fire({
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 2000,
        icon: "info",
        title: "Logged Out",
        background: "#121212",
        color: "#ffffff",
      });

      setTimeout(() => {
        window.location.replace("/");
      }, 500);
    }
  });
};

// ==========================================
// 4. RENDER NAVBAR (DENGAN FOTO CLOUDINARY)
// ==========================================
export async function checkAuthUI() {
  const token = localStorage.getItem("kuzen_token");
  const loginBtnDesktop = document.getElementById("nav-login-btn");
  const loginBtnMobile = document.getElementById("nav-login-btn-mobile");

  if (token) {
    try {
      // Ambil data terbaru dari server (agar foto profil terbaru terload)
      const res = await fetchWithFallback("/profile", USER_API, USER_API_BACKUP, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        const username = data.username || "User";
        const photo = data.photo || "";

        // Template Foto Profil
        const avatarHtml = photo
          ? `<img src="${photo}" class="w-8 h-8 rounded-full object-cover border border-gray-700 shadow-sm" onerror="this.onerror=null; this.src='/img/default-avatar.png';">`
          : `<div class="w-8 h-8 bg-gradient-to-tr from-[#ff6600] to-orange-400 rounded-full flex items-center justify-center text-[10px] text-white font-black">${username.charAt(0).toUpperCase()}</div>`;

        // Render Desktop
        if (loginBtnDesktop) {
          loginBtnDesktop.classList.remove(
            "uppercase",
            "tracking-widest",
            "bg-gray-800",
            "border-gray-700",
          );
          loginBtnDesktop.classList.add(
            "bg-transparent",
            "border-transparent",
            "p-0",
            "flex",
            "items-center",
            "gap-2.5",
          );
          loginBtnDesktop.innerHTML = `
            <span class="text-[11px] font-bold text-gray-300 hover:text-white transition-colors tracking-tight">${username}</span>
            <div class="hover:scale-105 transition-transform">${avatarHtml}</div>
          `;
          loginBtnDesktop.onclick = (e) => {
            e.preventDefault();
            window.app.loadProfile();
          };
        }

        // Render Mobile Menu
        if (loginBtnMobile) {
          loginBtnMobile.innerHTML = `
            <div class="flex items-center gap-3 w-full py-1">
                ${photo ? `<img src="${photo}" class="w-7 h-7 rounded-full object-cover border border-gray-800" onerror="this.onerror=null; this.src='/img/default-avatar.png';">` : `<i class="fas fa-user-circle w-7 text-center text-[#ff6600] text-lg"></i>`}
                <span class="font-['Poppins'] font-bold text-white tracking-tight text-xs">${username}</span>
            </div>
          `;
          loginBtnMobile.onclick = (e) => {
            e.preventDefault();
            window.app.loadProfile();
            const closeBtn = document.getElementById("mobile-menu-btn");
            if (closeBtn) closeBtn.click();
          };
        }
      } else {
        // Jika token invalid (expired), paksa logout
        localStorage.removeItem("kuzen_token");
        checkAuthUI();
      }
    } catch (err) {
      console.warn("Auth check failed, using fallback UI.");
    }
  } else {
    // --- MODE GUEST (LOGOUT) ---
    const resetLoginButton = (el, isMobile = false) => {
      if (!el) return;
      el.onclick = (e) => {
        e.preventDefault();
        window.app.showAuthModal(true);
        if (isMobile) document.getElementById("mobile-menu-btn").click();
      };

      if (!isMobile) {
        el.className =
          "ml-4 bg-gray-800 hover:bg-[#ff6600] border border-gray-700 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition shadow-sm";
        el.innerHTML = `<i class="fas fa-sign-in-alt mr-1 text-[9px]"></i> Login`;
      } else {
        el.innerHTML = `<i class="fas fa-sign-in-alt w-5 text-center mr-1 text-[#ff6600]"></i> <span class="uppercase tracking-widest">Login</span>`;
      }
    };

    resetLoginButton(loginBtnDesktop, false);
    resetLoginButton(loginBtnMobile, true);
  }
}
