"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "doc", {
  enumerable: true,
  get: function get() {
    return _firebaseFirestore.doc;
  }
});
Object.defineProperty(exports, "getDoc", {
  enumerable: true,
  get: function get() {
    return _firebaseFirestore.getDoc;
  }
});
Object.defineProperty(exports, "updateDoc", {
  enumerable: true,
  get: function get() {
    return _firebaseFirestore.updateDoc;
  }
});
Object.defineProperty(exports, "arrayUnion", {
  enumerable: true,
  get: function get() {
    return _firebaseFirestore.arrayUnion;
  }
});
Object.defineProperty(exports, "arrayRemove", {
  enumerable: true,
  get: function get() {
    return _firebaseFirestore.arrayRemove;
  }
});
exports.auth = exports.verifyEmail = exports.functions = exports.db = exports.app = void 0;

var _firebaseApp = require("https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js");

var _firebaseAuth = require("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js");

var _firebaseFirestore = require("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");

var _firebaseFunctions = require("https://www.gstatic.com/firebasejs/10.12.2/firebase-functions.js");

var firebaseConfig = {
  apiKey: "AIzaSyCvNlUGP2nLPuOXln7azBBUEA8yaED7X-k",
  authDomain: "cachimboz-pro.firebaseapp.com",
  projectId: "cachimboz-pro",
  storageBucket: "cachimboz-pro.firebasestorage.app",
  messagingSenderId: "1071545177311",
  appId: "1:1071545177311:web:078e3a588c63593886456a"
};
var app = (0, _firebaseApp.initializeApp)(firebaseConfig);
exports.app = app;
var db = (0, _firebaseFirestore.initializeFirestore)(app, {
  localCache: (0, _firebaseFirestore.persistentLocalCache)()
});
exports.db = db;
var functions = (0, _firebaseFunctions.getFunctions)(app, "us-central1");
exports.functions = functions;
var verifyEmail = (0, _firebaseFunctions.httpsCallable)(functions, "verifyEmail");
exports.verifyEmail = verifyEmail;
var auth = (0, _firebaseAuth.getAuth)(app);
exports.auth = auth;