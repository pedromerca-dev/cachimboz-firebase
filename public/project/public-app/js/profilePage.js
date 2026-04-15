import { initHeader, renderHeader } from "./ui/header.js";
import { store } from "./core/store.js";
import { setState } from "./core/store.js";
import { Storage } from "./storage.js";

window.Storage = Storage;

const cachedUser = localStorage.getItem("user");

if (cachedUser) {
    setState({
        user: JSON.parse(cachedUser),
        authLoaded: true
    });
}
initHeader({ variant: "home" });
renderHeader({ variant: "home" });

const module = await import("./features/profile.js");
const user = store.user || JSON.parse(localStorage.getItem("user"));

if (user) {
    module.renderProfile(user);
} else {
    console.warn("No user found");
}