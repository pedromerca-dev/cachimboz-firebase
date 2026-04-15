import { showConfirmModal, showSuccessModal } from "./ui/modal.js";
import { Storage } from "./storage.js";
import { auth, db } from "./services/firebase.js";
import { setState, store } from "./core/store.js";
import {
    loadCourses,
    renderCourses,
    updateCoursesUI,
    bindCourseGridEvents,
    loadLastCourse
} from "./features/courses.js";

import {
    GoogleAuthProvider,
    signInWithPopup,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    doc,
    getDoc,
    setDoc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { setPersistence, browserLocalPersistence }
    from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import { initHeader } from "./ui/header.js";
setState({ authChecking: true });

const cachedUser = localStorage.getItem("user");

if (cachedUser) {
    setState({
        user: JSON.parse(cachedUser),
        authLoaded: true
    });
}

setPersistence(auth, browserLocalPersistence)
    .then(() => {
        console.log("✅ persistence OK");
    })
    .catch(err => {
        console.error("❌ persistence error:", err);
    });

// appState en el store global para mayor consistencia
setState({ loading: false, error: null, formData: Storage.getFormData() });

export function getAppRoot() {
    return document.getElementById("app");
}

async function initApp() {
    setState({ loading: true, error: null, view: 'home', formData: Storage.getFormData() });
    renderInitialLoading();
    initHeader({ variant: "home" });
    try {
       
        renderHome();
        loadCourses().then(() => {
            updateCoursesUI();
        });
       
       
    } catch (err) {
        console.error('loadCourses falló:', err);
        setState({ error: 'No se pudieron cargar los cursos. Reintenta.' });
        renderError();
    } finally {
        setState({ loading: false });
    }
}

function renderHome() {
    const app = getAppRoot();
    if (!app) return;

    const userName = (store.formData?.Nombre || 'Cachimbo').split(' ')[0];
    const streak = calculateStreak();

    app.innerHTML = `
        <div class="max-w-7xl mx-auto p-6 sm:p-8">
            <div class="space-y-6 sm:space-y-8">
                <header class="flex justify-between items-center gap-4">
                    <div class="flex-1">
                        <p class="text-slate-300">¡Hola de nuevo!</p>
                        <h1 class="text-3xl sm:text-4xl font-extrabold text-white">${userName}</h1>
                    </div>
                    <div class="flex items-center gap-2 text-right">
                        <div>
                            <div class="font-bold text-lg sm:text-xl text-white">${streak} Días</div>
                            <div class="text-xs text-amber-300 font-medium">Racha Activa</div>
                        </div>
                        <span class="text-3xl sm:text-4xl">🔥</span>
                    </div>
                </header>

                <section id="continue-section">
                    <div class="bg-gradient-to-r from-cachimboz-mid to-cachimboz-light p-6 rounded-2xl shadow-xl text-white relative overflow-hidden">
                        <div class="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full"></div>
                        <p class="text-sm font-medium opacity-80 uppercase tracking-wider">Continuar Curso</p>
                        <h2 id="last-course-name" class="text-3xl font-bold mt-2 mb-4">Selecciona un curso</h2>
                        <a id="last-course-link" href="#" class="inline-block mt-4 font-semibold text-sm bg-white text-cachimboz-mid hover:bg-slate-100 px-5 py-2.5 rounded-lg transition-colors shadow">
                            Ir a la lección →
                        </a>
                    </div>
                </section>

                <section>
                    <h3 class="text-xl font-bold text-white mb-4">Cursos completos</h3>
                    <div id="courses-grid" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
                        ${renderCourses()}
                    </div>
                </section>

                <div class="h-16"></div>
            </div>
        </div>
    `;

    requestAnimationFrame(() => {
        loadLastCourse();
        updateCoursesUI();
        bindCourseGridEvents();
    });
}

function renderError() {
    const app = getAppRoot();
    if (!app) return;

    app.innerHTML = `
        <div class="max-w-3xl mx-auto p-6 text-center">
            <h2 class="text-2xl font-bold mb-3">Error</h2>
            <p class="mb-4 text-slate-300">${store.error || 'Ocurrió un problema.'}</p>
            <button id="retry-btn" class="bg-purple-600 text-white px-4 py-2 rounded">Reintentar</button>
        </div>
    `;

    document.getElementById('retry-btn').onclick = () => {
        initApp();
    };
}

function calculateStreak() {
    return Storage.getStreak();
}

function saveLastCourse(name, link) {
    Storage.saveLastCourse(name, link);
}

const provider = new GoogleAuthProvider();

async function loginWithGoogle() {
    showLoading();

    const result = await signInWithPopup(auth, provider);

    const user = result.user;

    await saveUserIfNew(user);

    checkOnboarding(user);

}


async function saveUserIfNew(user){

    const ref = doc(db, "users", user.uid);

    const snap = await getDoc(ref);

    if(!snap.exists()){

        await setDoc(ref, {
            name: user.displayName,
            email: user.email,
            university: null,
            area: null,
            favorites: [],
            isPremium: false,
            created_at: new Date()
        });

    }

}

async function loadUserProfile(user) {
    if (!user?.uid) return null;
    const ref = doc(db, "users", user.uid);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
        return null;
    }

    const profileData = snap.data();

    const combined = {
        ...user,
        ...profileData
    };

    setState({ user: combined });

    return combined;
}

async function checkOnboarding(user) {

    const snap = await getDoc(doc(db, "users", user.uid));

    const data = snap.data();

    if (!data.university || !data.area) {

        renderOnboarding(user);

    } else {

        initApp(); // tu home actual

    }

}

function renderOnboarding(user) {
    const app = getAppRoot();
    if (!app) return;

    app.innerHTML = `
        <div class="flex flex-col items-center justify-center min-h-screen gap-4">
            
            <h2 class="text-xl font-bold text-white">Configura tu perfil</h2>

            <select id="university" class="p-2 rounded">
                <option value="">Selecciona universidad</option>
                <option value="UNSAAC">UNSAAC</option>
                <option value="UNSA">UNSA</option>
            </select>

            <select id="area" class="p-2 rounded">
                <option value="">Selecciona área</option>
                <option value="ingenieria">Ingeniería</option>
                <option value="biomedicas">Biomédicas</option>
            </select>

            <button id="save-onboarding"
                class="bg-purple-600 text-white px-6 py-2 rounded">
                Continuar
            </button>

        </div>
    `;

    document.getElementById("save-onboarding").onclick = async () => {
        showLoading();

        const university = document.getElementById("university").value;
        const area = document.getElementById("area").value;

        await updateDoc(doc(db, "users", user.uid), {
            university,
            area
        });

        initApp();

    };

}
let authReady = false;
let authInitPending = true;

onAuthStateChanged(auth, async (user) => {
    authReady = true;
    setState({ authChecking: false });

    if (!user) {
        setState({ user: null, authLoaded: true });
        
      
        initApp();
        return;
    }

    await saveUserIfNew(user);
    const enrichedUser = await loadUserProfile(user);
    localStorage.setItem("user", JSON.stringify(enrichedUser));

    setState({ user: enrichedUser, authLoaded: true });
   


    if (authInitPending) {
        authInitPending = false;
        await checkOnboarding(user);
        return;
    }

    // Si ya cargó al menos una vez, solo reacciona al cambio de sesión
    await checkOnboarding(user);
});


function renderInitialLoading() {
    const app = getAppRoot();
    if (!app) return;

    app.innerHTML = `
        <div class="max-w-7xl mx-auto px-6 py-8 space-y-6 animate-pulse">

        <div class="h-8 w-40 bg-white/10 rounded"></div>

        <div class="h-40 skeleton  rounded-2xl"></div>

        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
            ${Array(8).fill(`
                <div class="h-32 bg-white/10 rounded-xl"></div>
            `).join("")}
        </div>

    </div>
    `;
}
/*
let isEditing = false;
export function renderProfile(user) {
    const root = getAppRoot();
    if (!root) return;

    const university = user?.university || "UNSAAC";
    const area = user?.area || "ingenieria";

    const profileContent = isEditing
        ? `
        <div class="rounded-xl border border-white/10 p-4 sm:p-5 bg-black/20 mb-4">
            <h3 class="text-white/80 font-semibold mb-3">Editar perfil</h3>

            <div class="grid gap-3 sm:grid-cols-2">
                <select id="university" class="p-2 rounded bg-black/30 border border-white/10">
                    <option value="UNSAAC" ${university === "UNSAAC" ? "selected" : ""}>UNSAAC</option>
                    <option value="UNSA" ${university === "UNSA" ? "selected" : ""}>UNSA</option>
                </select>

                <select id="area" class="p-2 rounded bg-black/30 border border-white/10">
                    <option value="ingenieria" ${area === "ingenieria" ? "selected" : ""}>Ingeniería</option>
                    <option value="biomedicas" ${area === "biomedicas" ? "selected" : ""}>Biomédicas</option>
                </select>
            </div>
        </div>
        `
        : `
        <div class="rounded-xl border border-white/10 p-4 sm:p-5 bg-black/20 mb-4">
            <h3 class="text-white/80 font-semibold mb-3">Info personal</h3>

            <div class="grid gap-2 text-sm sm:grid-cols-2">
                <div>
                    <span class="text-white/70">Universidad:</span><br>
                    <strong>${university}</strong>
                </div>
                <div>
                    <span class="text-white/70">Área:</span><br>
                    <strong>${area}</strong>
                </div>
            </div>
        </div>
        `;

    const actionButtons = isEditing
        ? `
        <div class="flex flex-col sm:flex-row gap-3 mt-6">
            <button id="save-btn" class="flex-1 sm:flex-none sm:px-6 bg-purple-600 hover:bg-purple-700 py-2 rounded-lg font-bold transition">
                Guardar cambios
            </button>
            <button id="cancel-btn" class="flex-1 sm:flex-none sm:px-6 bg-white/10 hover:bg-white/20 py-2 rounded-lg transition">
                Cancelar
            </button>
        </div>
        `
        : `
        <button id="edit-btn" class="w-full sm:w-auto sm:px-6 bg-purple-600 hover:bg-purple-700 py-2 rounded-lg font-bold mt-4 transition">
            Editar perfil
        </button>
        `;

    root.innerHTML = `
        <div class="max-w-2xl lg:max-w-3xl mx-auto px-4 sm:px-6 py-6 text-white">
            <section class="rounded-xl border border-white/10 bg-white/10 p-4 sm:p-6 lg:p-8 shadow-xl">
                
                <div class="flex items-center gap-4 mb-6">
                    ${user?.photoURL
            ? `<img src="${user.photoURL}" class="w-14 h-14 rounded-full object-cover border border-white/20"/>`
            : `<div class="w-14 h-14 rounded-full bg-purple-600 flex items-center justify-center text-lg font-bold">${(user?.displayName || "U")[0]}</div>`
        }

                    <div>
                        <h2 class="text-lg font-bold">${user?.displayName || "Usuario"}</h2>
                        <p class="text-xs text-white/60">${user?.email || ""}</p>
                    </div>
                </div>

                ${profileContent}
                ${actionButtons}

            </section>
        </div>
    `;

    // 👉 eventos

    const editBtn = document.getElementById("edit-btn");
    const saveBtn = document.getElementById("save-btn");
    const cancelBtn = document.getElementById("cancel-btn");

    if (editBtn) {
        editBtn.onclick = () => {
            isEditing = true;
            renderProfile(user);
        };
    }

    if (cancelBtn) {
        cancelBtn.onclick = () => {
            isEditing = false;
            renderProfile(user);
        };
    }

    if (saveBtn) {
        saveBtn.onclick = async () => {
            const universityEl = document.getElementById("university");
            const areaEl = document.getElementById("area");

            await updateDoc(doc(db, "users", user.uid), {
                university: universityEl.value,
                area: areaEl.value
            });

            // sync local
            user.university = universityEl.value;
            user.area = areaEl.value;

            await showSuccessModal("Perfil actualizado");

            isEditing = false;
            const params = new URLSearchParams(window.location.search);
            if (params.get("view") === "profile") {
                renderProfile(store.user);
            }
        };
    }
}   */

function showLoading() {
    const app = getAppRoot();
    if (!app) return;

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



window.addEventListener("scroll", () => {
    const header = document.getElementById("shared-header");

    if (window.scrollY > 20) {
        header.classList.add("scrolled");
    } else {
        header.classList.remove("scrolled");
    }
});



function bootAppShell() {
    if (!getAppRoot()) return;
    renderInitialLoading();
    initHeader({ variant: "home" });
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootAppShell, { once: true });
} else {
    bootAppShell();
}

export function getRoot() {
    return document.getElementById("app")
        || document.getElementById("main-content")
        || document.body;
}





