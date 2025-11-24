"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const serviceAccountPath = path_1.default.join(__dirname, "..", "serviceAccountKey.json");
if (!fs_1.default.existsSync(serviceAccountPath)) {
    throw new Error(`serviceAccountKey.json no encontrado en: ${serviceAccountPath}\n` +
        `Coloca el archivo en la raíz del proyecto.`);
}
const serviceAccount = require(serviceAccountPath);
firebase_admin_1.default.initializeApp({
    credential: firebase_admin_1.default.credential.cert(serviceAccount),
});
exports.db = firebase_admin_1.default.firestore();
