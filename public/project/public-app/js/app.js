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
            <div class="space-y-4 sm:space-y-5">
                <header class="flex justify-between items-center gap-4">
                    <div class="flex-1">
                        <p class="text-slate-300">¡Hola de nuevo!</p>
                        <h1 class="text-2xl sm:text-3xl font-extrabold text-white">${userName}</h1>
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
                    <div class="bg-gradient-to-r from-cachimboz-mid to-cachimboz-light p-3 rounded-2xl shadow-xl text-white relative overflow-hidden">
                        <div class="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full"></div>
                        <p class="text-sm font-medium opacity-80 uppercase tracking-wider">Continuar Curso</p>
                        <h2 id="last-course-name" class="text-xl font-bold mt-1 mb-2">Selecciona un curso</h2>
                        <a id="last-course-link" href="#" class="inline-block mt-4 font-semibold text-sm bg-white text-cachimboz-mid hover:bg-slate-100 px-5 py-2.5 rounded-lg transition-colors shadow">
                            Ir a la lección →
                        </a>
                    </div>
                </section>

                <section>
                    <h3 class="text-xl font-bold text-white mb-4">Cursos completos</h3>
                    <div id="courses-grid" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
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
    const user = store.user;
    if (!user) return 0;

    return Storage.getStreak(user.uid);
}

function saveLastCourse(name, link) {
    Storage.saveLastCourse(name, link);
}

const provider = new GoogleAuthProvider();


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
            onboardingCompleted: false,
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

    if (!data.onboardingCompleted) {

        renderOnboarding(user);

    } else {

        initApp(); // tu home actual

    }

}

function renderOnboarding(user) {
    const app = getAppRoot();
    if (!app) return;
    app.innerHTML = `
    
    <!-- OVERLAY -->
    <div style="
        position: fixed;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
     background: linear-gradient(
    to bottom,
    rgba(10,5,30,0.4) 0px,
    rgba(10,5,30,0.6) 61px,
    rgba(20,10,40,0.95) 10px,
    rgba(45,27,78,0.95) 50%,
    rgba(76,29,149,0.95) 100%
);
backdrop-filter: blur(6px);
        z-index: 9999;
    ">

    <div style="
        position:absolute;
        inset:0;
        background-image: url('https://grainy-gradients.vercel.app/noise.svg');
        opacity: 0.2;
        pointer-events:none;
    "></div>

        <!-- CARD -->
        <div style="
            width: 100%;
            max-width: 420px;
            background: #2d1b4e;
            border-radius: 16px;
            padding: 28px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.6);
        ">

            <h2 style="
                text-align: center;
                color: white;
                margin-bottom: 20px;
                font-size: 20px;
                font-weight: bold;
            ">
                Configura tu perfil
            </h2>

            <div style="display:flex; flex-direction:column; gap:12px;">

                <select id="university" style="
                    padding:10px;
                    border-radius:8px;
                    background:#1a0b2e;
                    color:white;
                    border:1px solid rgba(255,255,255,0.1);
                ">
                   <option value="" disabled selected hidden>Selecciona universidad</option>
                   <option value="UNSAAC">UNSAAC</option>
                   <option value="UNSA">UNSA</option>
                   <option value="otros">Otros</option>
                </select>

                <select id="area" style="
                    padding:10px;
                    border-radius:8px;
                    background:#1a0b2e;
                    color:white;
                    border:1px solid rgba(255,255,255,0.1);
                ">
                    <option value="" disabled selected hidden>Selecciona área</option>
                    <option value="ingenieria">Ingeniería</option>
                     <option value="biomedicas">Biomédicas</option>
                     <option value="otros">Otros</option>
                </select>

                <button id="save-onboarding" style="
                    margin-top:10px;
                    padding:10px;
                    border:none;
                    border-radius:8px;
                    background:#7c3aed;
                    color:white;
                    font-weight:bold;
                    cursor:pointer;
                ">
                    Continuar
                </button>

            </div>

        </div>
    </div>
    `;


    document.getElementById("save-onboarding").onclick = async () => {
      

        const university = document.getElementById("university").value;
        const area = document.getElementById("area").value;

        renderInitialLoading();

        await updateDoc(doc(db, "users", user.uid), {
            university,
            area,
            onboardingCompleted: true
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
        localStorage.removeItem("user");
        setState({ user: null, authLoaded: true });
        initApp();
        return;
    }

    await saveUserIfNew(user);
    const enrichedUser = await loadUserProfile(user);
    localStorage.setItem("user", JSON.stringify(enrichedUser));
    if (!localStorage.getItem(`streak_${user.uid}`)) {
        localStorage.setItem(`streak_${user.uid}`, "1");
    }

    setState({ user: enrichedUser, authLoaded: true });
    

    if (authInitPending) {
        authInitPending = false;
        await checkOnboarding(user);
        return;
    }

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





