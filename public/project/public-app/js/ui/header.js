import { store, subscribe } from "../core/store.js";
import { showConfirmModal, showSuccessModal } from "./modal.js";
import { navigate } from "../core/router.js";
import { auth } from "../services/firebase.js";
import {
    GoogleAuthProvider,
    signInWithPopup,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


export function initHeader({ variant = "home" } = {}) {
    let lastUserId = null;

    subscribe(() => {
        const currentUserId = store.user?.uid || null;

        if (currentUserId !== lastUserId) {
            lastUserId = currentUserId;
            renderHeader({ variant });
        }
    });
}
function getCourseTitle() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    if (!id) return "";
    return id.charAt(0).toUpperCase() + id.slice(1);
}
const provider = new GoogleAuthProvider();

window.startLogin = async function () {
     await signInWithPopup(auth, provider);
};

window.logoutUser = async function () {

   const ok = await showConfirmModal("¿Seguro que quieres cerrar sesión?");
    
    if (!ok) return; 
   await signOut(auth);

        await showSuccessModal("Sesión cerrada correctamente 👋");
      
      
   
};

window.goToProfile = function () {
    window.location.href = "profile.html";
};

function showLoading() {
    const app = document.getElementById("app");

    app.innerHTML = `
        <div class="max-w-7xl mx-auto px-6 py-8 space-y-6">

            <!-- spinner -->
            <div class="flex justify-center">
                <div class="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
            </div>

            <!-- skeleton -->
            <div class="animate-pulse space-y-4">
                <div class="h-6 w-40 bg-white/10 rounded"></div>
                <div class="h-40 bg-white/10 rounded-2xl"></div>

                <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    ${Array(6).fill(`
                        <div class="h-28 bg-white/10 rounded-xl"></div>
                    `).join("")}
                </div>
            </div>

        </div>
    `;
}



window.toggleAuthMenu = function () {
    const menu = document.getElementById("profile-dropdown");
    if (!menu) return;
    menu.classList.toggle("show");
};

export function renderHeader({ variant = "home" } = {}) {
    const container = document.getElementById("shared-header") || document.getElementById("auth-section");
    if (!container) return;

    const courseName = getCourseTitle();

    const user = store.user;

    let authHtml = "";


    if (!store.user && (store.authChecking || !store.authLoaded)) {
        authHtml = ` <div class="class-auth-btn" style="opacity:0.6">
        <span class="class-auth-avatar shimmer"></span>
        <span class="w-12 h-3 bg-white/10 rounded shimmer"></span>
    </div>`;
    } else if (!user) {
        authHtml = `<button class="class-login-btn" onclick="startLogin()"><i class="fas fa-user"></i> Iniciar sesión</button>`;
    } else {
        const first = user.displayName ? user.displayName.split(" ")[0] : "Usuario";
        const isPremium = window.Storage?.hasAccess();
        const premiumLabel = isPremium ? "✔ Premium" : "❌ Sin premium";

        authHtml = `
            <div class="class-auth-user">
                <button class="class-auth-btn" onclick="toggleAuthMenu()">
                    <span class="class-auth-avatar">${user.displayName ? user.displayName[0].toUpperCase() : "U"}</span>
                    <span>${first}</span>
                    <i class="fas fa-caret-down"></i>
                </button>
                <div id="profile-dropdown" class="class-auth-dropdown">
                    <div class="class-auth-status">${premiumLabel}</div>
                    <button class="class-auth-item" onclick="goToProfile()">Mi perfil</button>
                    ${isPremium ? "" : "<button class=\"class-auth-item\" onclick=\"window.location.href='paywalloficial.html'\">Contratar Premium</button>"}
                    <button class="class-auth-item" onclick="logoutUser()">Cerrar sesión</button>
                </div>
            </div>
        `;
    }

    const favCount = document.getElementById('header-fav-count')?.textContent || 0;
    let extraButtons = "";

    if (variant === "course" ) {
        extraButtons = `
     <a href="index.html" class="back-home-btn" title="Volver">
                    <i class="fas fa-arrow-left"></i>
                </a>

                <button class="menu-toggle" onclick="toggleSidebar()">
                    <i class="fas fa-bars"></i>
                    <span>${courseName || 'Curso'}</span>
                </button>

                <button class="ai-nav-btn" onclick="window.handleTutorClick?.()">
                    <i class="fas fa-robot"></i> Preguntar AI
                </button>

                <button class="favorites-btn" onclick="window.openFavorites?.()">
                    <i class="fas fa-heart"></i>
                    <div class="fav-count" id="header-fav-count">${favCount}</div>
                </button> `
            ;
    }

    container.innerHTML = `
        <div class="nav-container">
            <div class="left-nav">
                <a href="index.html" class="logo" style="font-weight:900; color:white; display:flex; align-items:center; gap:8px; text-decoration:none;">
                    <img src="images/unnamed.png" alt="Cachimboz" style="height:26px;" />
                    Cachimboz
                </a>
           ${extraButtons}
            </div>

            <div class="right-nav">
                ${authHtml}
            </div>
        </div>
    `;

  
}
