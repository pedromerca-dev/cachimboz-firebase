"use strict";

var _header = require("./ui/header.js");

var _store = require("./core/store.js");

var _storage = require("./storage.js");

var _firebase = require("./services/firebase.js");

var _firebaseAuth = require("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js");

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function _getRequireWildcardCache() { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

window.Storage = _storage.Storage;
(0, _firebaseAuth.onAuthStateChanged)(_firebase.auth, function _callee(user) {
  var module;
  return regeneratorRuntime.async(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          if (user) {
            _context.next = 3;
            break;
          }

          console.warn("No autenticado");
          return _context.abrupt("return");

        case 3:
          if (!user) {
            window.location.href = "index.html";
          }

          (0, _store.setState)({
            user: user,
            authLoaded: true
          });
          (0, _header.initHeader)({
            variant: "home"
          });
          _context.next = 8;
          return regeneratorRuntime.awrap(Promise.resolve().then(function () {
            return _interopRequireWildcard(require("./features/profile.js"));
          }));

        case 8:
          module = _context.sent;
          module.renderProfile(user);

        case 10:
        case "end":
          return _context.stop();
      }
    }
  });
});