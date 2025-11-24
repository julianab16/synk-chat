import admin from "firebase-admin";
import path from "path";
import fs from "fs";

const serviceAccountPath = path.join(__dirname, "..", "serviceAccountKey.json");

if (!fs.existsSync(serviceAccountPath)) {
  throw new Error(
    `serviceAccountKey.json no encontrado en: ${serviceAccountPath}\n` +
    `Coloca el archivo en la raíz del proyecto.`
  );
}

const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export const db = admin.firestore();