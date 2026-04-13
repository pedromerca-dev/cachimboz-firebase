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
      
            renderHeader({ variant });
        
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

window.goToProfile = async function () {
    const module = await import("../features/profile.js");
    module.renderProfile(store.user);
    return;
    
       
   
const root = document.getElementById("app");
    if (!root) return;

    const university = user?.university || "UNSAAC";
    const area = user?.area || "ingenieria";
    const streak = Storage.getStreak() || 0;
    const isPremium = Boolean(user?.isPremium);
    const favoritesCount = Array.isArray(user?.favorites) ? user.favorites.length : 0;
    const courses = store.courses || [];

    const courseProgressRows = courses.map(course => {
        const completedSet = Storage.getCompleted(course.id, user?.uid);
        const completed = completedSet.size;
        const total = course.total || 0;
        const percent = total ? Math.round((completed / total) * 100) : 0;

        return `
            <div class="rounded-lg border border-white/15 bg-black/25 p-3 mb-3">
                <div class="flex justify-between items-center mb-1">
                    <span class="font-semibold">${course.name}</span>
                    <span class="text-xs text-white/70">${completed}/${total || '?'}</span>
                </div>
                <div class="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                    <div class="h-full bg-gradient-to-r from-purple-500 to-pink-500" style="width: ${total ? percent : 0}%"></div>
                </div>
                <p class="text-[11px] text-right mt-1 text-white/70">${total ? percent + '% completado' : 'Curso sin datos de lecciones'}</p>
            </div>
        `;
    }).join("");

    root.innerHTML = `
        <div class="max-w-4xl mx-auto px-4 py-8 text-white">
            <div class="grid gap-6 lg:grid-cols-2">
                <section class="rounded-2xl border border-white/10 bg-white/10 p-6 shadow-xl backdrop-blur-sm">
                    <div class="flex items-center gap-4 mb-6">
                        ${user?.photoURL ? `<img src="${user.photoURL}" class="w-14 h-14 rounded-full object-cover border border-white/20" />` : `<div class="w-14 h-14 rounded-full bg-purple-600 flex items-center justify-center text-xl font-bold">${(user?.displayName || "U")[0] || "U"}</div>`}
                        <div>
                            <h2 class="text-lg font-bold">${user?.displayName || "Usuario"}</h2>
                            <p class="text-xs text-white/60">${user?.email || "(no registrado)"}</p>
                        </div>
                    </div>

                    <div class="rounded-xl border border-white/10 p-4 bg-black/20 mb-4">
                        <h3 class="text-white/80 font-semibold mb-2">Info personal</h3>
                        <div class="grid grid-cols-2 gap-2 text-sm">
                            <span class="text-white/70">Universidad:</span><strong>${university}</strong>
                            <span class="text-white/70">Área:</span><strong>${area}</strong>
                        </div>
                    </div>

                    <div class="text-right">
                        <button id="toggle-profile-btn" class="w-full bg-purple-600 hover:bg-purple-700 py-2 rounded-lg font-bold transition">Mostrar perfil</button>
                    </div>
                </section>

                <section class="rounded-2xl border border-white/10 bg-white/10 p-6 shadow-xl backdrop-blur-sm">
                    <h3 class="text-white/80 font-semibold mb-4">Info plataforma</h3>
                    <div class="space-y-2 text-sm">
                        <div class="flex justify-between"><span class="text-white/70">Racha</span><strong>${streak} días</strong></div>
                        <div class="flex justify-between"><span class="text-white/70">Premium</span><strong>${isPremium ? "✔️ Sí" : "❌ No"}</strong></div>
                        <div class="flex justify-between"><span class="text-white/70">Favoritos</span><strong>${favoritesCount}</strong></div>
                    </div>
                    ${isPremium ? "" : `
                    <div class="mt-4">
                        <a href="paywalloficial.html" class="block text-center bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white font-bold py-2 rounded-lg transition">Hazte Premium</a>
                    </div>
                    `}
                </section>

                <main id="profile-edit-panel" class="lg:col-span-2 rounded-2xl border border-white/10 bg-[#1f163b] p-6 shadow-xl hidden">
                    <h2 class="text-2xl font-extrabold mb-4">Editar perfil</h2>
                    <div class="grid gap-4 md:grid-cols-2">
                        <div>
                            <label class="block text-sm text-white/70 mb-1">Universidad</label>
                            <select id="university" class="w-full p-3 rounded-lg bg-black/30 border border-white/10 focus:border-purple-400 focus:outline-none transition">
                                <option value="UNSAAC" ${university === "UNSAAC" ? "selected" : ""}>UNSAAC</option>
                                <option value="UNSA" ${university === "UNSA" ? "selected" : ""}>UNSA</option>
                            </select>
                        </div>

                        <div>
                            <label class="block text-sm text-white/70 mb-1">Área</label>
                            <select id="area" class="w-full p-3 rounded-lg bg-black/30 border border-white/10 focus:border-purple-400 focus:outline-none transition">
                                <option value="ingenieria" ${area === "ingenieria" ? "selected" : ""}>Ingeniería</option>
                                <option value="biomedicas" ${area === "biomedicas" ? "selected" : ""}>Biomédicas</option>
                            </select>
                        </div>
                    </div>

                    <button id="save-profile" class="mt-6 w-full bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 py-3 rounded-lg font-bold shadow-xl transition-all">Guardar cambios</button>
                </main>
            </div>
        </div>
    `;

    const toggleBtn = document.getElementById('toggle-profile-btn');
    const editPanel = document.getElementById('profile-edit-panel');

    if (toggleBtn && editPanel) {
        toggleBtn.onclick = () => {
            const isHidden = editPanel.classList.toggle('hidden');
            toggleBtn.textContent = isHidden ? 'Mostrar perfil' : 'Ocultar perfil';
        };
    }


    const btnSave = document.getElementById("save-profile");

    if (btnSave) {
        btnSave.onclick = async () => {
           
            const ok = await showConfirmModal("¿Guardar cambios en tu perfil?");

            if (!ok) return; // 🔥 evita loading

            

            const universityEl = document.getElementById("university");
            const areaEl = document.getElementById("area");

            if (!universityEl || !areaEl) return;

            await updateDoc(doc(db, "users", user.uid), {
                university: universityEl.value,
                area: areaEl.value
            });

           

            await showSuccessModal("Perfil actualizado correctamente");

          
            initApp();

            
        };
    }
}

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
