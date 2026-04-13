import { store } from "../core/store.js";

export function renderHome(container) {

    container.innerHTML = `
        <div class="p-6">
            <h1 class="text-3xl font-bold">Inicio</h1>

            <div class="grid grid-cols-3 gap-4 mt-6">
                ${store.courses.map(c => `
                    <div class="bg-white/10 p-4 rounded">
                        ${c.name}
                    </div>
                `).join("")}
            </div>
        </div>
    `;
}