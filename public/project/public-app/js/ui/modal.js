let isModalOpen = false;

export function showConfirmModal(message) {

    if (isModalOpen) return Promise.resolve(false);
    isModalOpen = true;

    return new Promise((resolve) => {

        const root = document.getElementById("modal-root");

        if (!root) {
            console.error("❌ modal-root no existe");
            resolve(false);
            return;
        }

        // 🔥 ESTE ES EL OVERLAY REAL (NO WRAPPER)
        const overlay = document.createElement("div");

        overlay.style.position = "fixed";
        overlay.style.top = "0";
        overlay.style.left = "0";
        overlay.style.width = "100vw";
        overlay.style.height = "100vh";
        overlay.style.background = "rgba(0,0,0,0.85)";
        overlay.style.display = "flex";
        overlay.style.alignItems = "center";
        overlay.style.justifyContent = "center";
        overlay.style.zIndex = "999999"; // 🔥 más alto que todo
        overlay.innerHTML = `
            <div style="
                background:#1e1b2e;
                padding:24px;
                border-radius:16px;
                width:340px;
                text-align:center;
                box-shadow:0 25px 80px rgba(0,0,0,0.7);
            ">
                <div style="font-size:32px;margin-bottom:10px;">⚠️</div>

                <h3 style="font-weight:bold;margin-bottom:6px;">
                    Confirmar acción
                </h3>

                <p style="opacity:0.7;margin-bottom:20px;">
                    ${message}
                </p>

                <div style="display:flex;gap:10px;justify-content:center;">
                    <button id="cancel-btn">Cancelar</button>
                    <button id="confirm-btn" style="
    background:#22c55e;
    color:white;
    padding:8px 16px;
    border-radius:8px;
    font-weight:600;
">
    Confirmar
</button>
                </div>
            </div>
        `;

        root.innerHTML = ""; // limpia
        root.appendChild(overlay);

        document.body.style.overflow = "hidden";

        const close = (val) => {
            root.innerHTML = "";
            document.body.style.overflow = "auto";
            isModalOpen = false;
            resolve(val);
        };

        overlay.querySelector("#cancel-btn").onclick = () => close(false);
        overlay.querySelector("#confirm-btn").onclick = () => close(true);
    });
}

export function showSuccessModal(message) {
    return new Promise((resolve) => {

        const root = document.getElementById("modal-root");

        const overlay = document.createElement("div");

        overlay.style.position = "fixed";
        overlay.style.top = "0";
        overlay.style.left = "0";
        overlay.style.width = "100vw";
        overlay.style.height = "100vh";
        overlay.style.background = "rgba(0,0,0,0.85)";
        overlay.style.display = "flex";
        overlay.style.alignItems = "center";
        overlay.style.justifyContent = "center";
        overlay.style.zIndex = "999999";

        overlay.innerHTML = `
            <div style="
                background:#1e1b2e;
                padding:28px;
                border-radius:16px;
                width:340px;
                text-align:center;
                box-shadow:0 25px 80px rgba(0,0,0,0.7);
            ">
                <div style="font-size:40px;margin-bottom:12px;">✅</div>

                <h3 style="font-weight:bold;margin-bottom:6px;">
                    Todo listo
                </h3>

                <p style="opacity:0.7;margin-bottom:20px;">
                    ${message}
                </p>

                <button id="ok-btn" style="
                    background:#22c55e;
                    color:white;
                    padding:10px 18px;
                    border-radius:8px;
                    font-weight:600;
                ">
                    Continuar
                </button>
            </div>
        `;

        root.innerHTML = "";
        root.appendChild(overlay);

        document.body.style.overflow = "hidden";

        const close = () => {
            root.innerHTML = "";
            document.body.style.overflow = "auto";
            resolve(true);
        };

        overlay.querySelector("#ok-btn").onclick = close;
    });
}