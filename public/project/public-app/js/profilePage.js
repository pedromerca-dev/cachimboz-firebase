
import { initHeader, renderHeader } from "./ui/header.js";
import { setState } from "./core/store.js";
import { Storage } from "./storage.js";
import { auth } from "./services/firebase.js";
import {
    onAuthStateChanged,
    setPersistence,
    browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "./services/firebase.js";


window.Storage = Storage;

await setPersistence(auth, browserLocalPersistence);

onAuthStateChanged(auth, async (user) => {


    if (!user) {
        console.warn("No autenticado");
        window.location.href = "index.html";
        return;
    }

    const ref = doc(db, "users", user.uid);
    const snap = await getDoc(ref);
    const data = snap.data();
    const fullUser = {
        ...user,
        ...data
    };

    setState({
        user,
        authLoaded: true
    });

    initHeader({ variant: "home" });
    renderHeader({ variant: "home" });

    const module = await import("./features/profile.js");
    module.renderProfile(fullUser);

});