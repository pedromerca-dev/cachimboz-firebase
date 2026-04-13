const {onRequest} = require("firebase-functions/v2/https");
const fetch = require("node-fetch");
const crypto = require("crypto");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

exports.verifyEmail = onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  try {
    const email = req.body && req.body.email;
    const course = (req.body && req.body.course) || "";

    if (!email) {
      return res.json({access: false});
    }


    const response = await fetch("https://script.google.com/macros/s/AKfycbzbV7ILE2cRtarBidnOU4X0iY_6ler48hkJuDb4LX00dgsGLKpbPaOwdxHE2bhMqTDAvw/exec" + "?email=" + encodeURIComponent(email)+ "&course=" + encodeURIComponent(course));

    const json = await response.json();
    if (json.access) {
      const token = crypto.createHash("sha256")
          .update(email + Date.now() + Math.random()).digest("hex");

      json.token = token;

      await db.collection("tokens").add({
        email: email,
        token: token,
        exp: json.end || null,
        course: course || null,
        createdAt: admin.firestore.FieldValue.serverTimestamp()});
    }

    res.json(json);
  } catch (err) {
    res.status(500).json({success: false});
  }
});

exports.getSecurePDF = onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  try {
    const {token, pdf} = req.body || {};

    if (!token || !pdf) {
      return res.status(403).json({ok: false});
    }

    const snap = await db
        .collection("tokens")
        .where("token", "==", token)
        .limit(1)
        .get();

    if (snap.empty) {
      return res.status(403).json({ok: false});
    }

    const docData = snap.docs[0].data();

    if (docData.exp) {
      const expDate = new Date(docData.exp);

      if (expDate < new Date()) {
        return res.status(403).json({ok: false});
      }
    }


    if (docData.createdAt) {
      const created = docData.createdAt.toDate();
      const diffHours =
        (Date.now() - created.getTime()) / (1000 * 60 * 60);

      if (diffHours > 24) {
        return res.status(403).json({ok: false});
      }
    }

    return res.json({
      ok: true,
      url: pdf});
  } catch (err) {
    console.error(err);
    res.status(500).json({ok: false});
  }
});


exports.uploadCourse = onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  try {
    const auth = req.headers.authorization;

    if (auth !== "Bearer cachimboz_admin_2026") {
      return res.status(403).json({ok: false, error: "Unauthorized"});
    }

    const course = req.body;

    if (!course || !course.curso) {
      return res.status(400).json({
        ok: false,
        error: "JSON invalido"});
    }

    const id = course.curso.toLowerCase().normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "_");

    await db.collection("courses").doc(id).set({
      content: course});

    res.json({ok: true, id});
  } catch (err) {
    console.error(err);

    res.status(500).json({ok: false});
  }
});
