import { store } from "../core/store.js";
import { showSuccessModal } from "../ui/modal.js";
// import {getAppRoot} from "../app.js";
import { doc, updateDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../services/firebase.js";



let isEditing = false;

export function renderProfile(user) {
    const root =
        document.getElementById("profile-view") ||
        document.getElementById("app");
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
            }, { merge: true });

            // sync local
            user.university = universityEl.value;
            user.area = areaEl.value;

            await showSuccessModal("Perfil actualizado");

            isEditing = false;
            renderProfile(user);
        };
    }
}