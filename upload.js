const admin = require("firebase-admin");
const fs = require("fs");

admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: "cachimboz-pro"
});

const db = admin.firestore();

async function upload() {

    const raw = fs.readFileSync("./data/filosofia.json", "utf8");
    const json = JSON.parse(raw);

    await db.collection("courses")
        .doc("filosofia")
        .set({ content: json });

    console.log("✅ filosofia subido correctamente");
}

upload();
