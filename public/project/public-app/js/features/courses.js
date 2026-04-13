import { setState, store } from "../core/store.js";
import { Storage } from "../storage.js";
import { db } from "../services/firebase.js";
import { collection, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const CACHE_KEY = "courses_v1";
let lastCoursesHash = "";

export function renderCourses() {
    if (!store.courses?.length) {
        return `<p class="text-slate-400 col-span-full">Cargando cursos...</p>`;
    }

    return store.courses.map(course => `
        <a href="${course.link}" class="bg-black/20 p-4 rounded-2xl shadow-sm hover:bg-black/30 transition-all group backdrop-blur-sm course-link" data-name="${course.name}" data-link="${course.link}">
            <div class="w-12 h-12 bg-cachimboz-light/20 rounded-lg flex items-center justify-center mb-3 group-hover:bg-cachimboz-light/30 transition-colors">
                <span class="text-2xl">${course.icon}</span>
            </div>
            <h4 class="font-bold text-white text-lg">${course.name}</h4>
            <span class="text-xs font-semibold bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full">Disponible</span>
        </a>
    `).join('');
}

export function updateCoursesUI() {
    const container = document.getElementById("courses-grid");
    if (!container) {
        console.warn("⚠️ esperando DOM...");
        return;
    }

    container.innerHTML = renderCourses();
}

export function bindCourseGridEvents() {
    const grid = document.getElementById('courses-grid');
    if (!grid) return;

    grid.removeEventListener('click', onCourseGridClick);
    grid.addEventListener('click', onCourseGridClick);
}

function onCourseGridClick(event) {
    const link = event.target.closest('.course-link');
    if (!link) return;

    const name = link.dataset.name;
    const url = link.dataset.link;

    if (name && url) {
        Storage.saveLastCourse(name, url);
    }
}

export function loadLastCourse() {
    const last = Storage.getLastCourse();
    const nameEl = document.getElementById("last-course-name");
    const linkEl = document.getElementById("last-course-link");

    if (!nameEl || !linkEl) {
        console.warn("last-course elements not found yet");
        return;
    }

    if (!last || !last.name || !last.link) {
        nameEl.textContent = "Selecciona un curso";
        linkEl.href = "#";
        linkEl.textContent = "Ir a la lección →";
        return;
    }

    nameEl.textContent = last.name;
    linkEl.href = last.link;
    linkEl.textContent = "Continuar " + last.name + " →";
}

export async function loadCourses() {
    console.log("🚀 loadCourses ejecutado");

    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
        setState({ courses: JSON.parse(cached) });
        updateCoursesUI();
    }

    try {
        onSnapshot(
            collection(db, "courses"),
            { includeMetadataChanges: true },
            (snapshot) => {
                if (snapshot.metadata.fromCache) {
                    console.log("📦 usando cache");
                }

                const freshCourses = snapshot.docs.map(doc => {
                    const data = doc.data();
                    const name = data.nombre || data.curso || doc.id;
                    const total = Array.isArray(data.index) ? data.index.length : 0;

                    return {
                        id: doc.id,
                        name,
                        total,
                        link: `clase.html?id=${doc.id}`,
                        icon: getCourseIcon(name)
                    };
                });

                const hash = JSON.stringify(freshCourses);
                if (hash === lastCoursesHash) return;
                lastCoursesHash = hash;

                localStorage.setItem(CACHE_KEY, hash);
                setState({ courses: freshCourses });
                requestAnimationFrame(() => updateCoursesUI());
            },
            (err) => {
                console.error('Error onSnapshot courses:', err);
                setState({ error: 'No se pudieron cargar los cursos desde servidor.' });
            }
        );
    } catch (err) {
        console.error('loadCourses catch:', err);
        setState({ error: 'Error al inicializar la suscripción de cursos.' });
        throw err;
    }
}

function getCourseIcon(name) {
    if (!name) return "📘";
    const n = name.toLowerCase();

    if (n.includes("arit")) return "🧮";
    if (n.includes("alge")) return "📐";
    if (n.includes("leng")) return "✍️";
    if (n.includes("fis")) return "⚛️";
    if (n.includes("quim")) return "🧪";
    if (n.includes("geo")) return "🌍";
    if (n.includes("hist")) return "📜";
    if (n.includes("eco")) return "📊";
    if (n.includes("bio")) return "🧬";
    if (n.includes("civ")) return "🏛️";
    if (n.includes("psi")) return "🧠";
    if (n.includes("fil")) return "🤔";

    return "📘";
}
