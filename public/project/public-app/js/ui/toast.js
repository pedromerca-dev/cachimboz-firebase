export function showToast(message, type = "success") {
    const toast = document.createElement("div");

    toast.className = `
        fixed top-20 left-1/2 -translate-x-1/2 z-50
        px-6 py-3 rounded-xl shadow-2xl
        font-semibold text-white text-sm
        transition-all duration-300 scale-95 opacity-0
        ${type === "success" ? "bg-green-500" : "bg-red-500"}
    `;

    toast.textContent = message;

    document.body.appendChild(toast);

    // animación entrada
    requestAnimationFrame(() => {
        toast.classList.remove("scale-95", "opacity-0");
        toast.classList.add("scale-100", "opacity-100");
    });

    // salida
    setTimeout(() => {
        toast.classList.add("opacity-0", "scale-95");
    }, 2500);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}