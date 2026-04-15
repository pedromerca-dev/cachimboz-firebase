import { initializeApp }
    from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
    getAuth
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    initializeFirestore,
    persistentLocalCache,
    doc,
    getDoc,
    updateDoc,
    arrayUnion,
    arrayRemove
}
    from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
    getFunctions,
    httpsCallable
}
    from "https://www.gstatic.com/firebasejs/10.12.2/firebase-functions.js";




const firebaseConfig = {
   //credenciales
};

export const app = initializeApp(firebaseConfig);


export const db = initializeFirestore(app, {
    localCache: persistentLocalCache()
});

export const functions = getFunctions(app, "us-central1");

export const verifyEmail = httpsCallable(functions, "verifyEmail");

export const auth = getAuth(app);

export { doc, getDoc, updateDoc, arrayUnion, arrayRemove };