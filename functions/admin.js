// functions/admin.js
import admin from "firebase-admin";

// Sólo inicializamos una vez
if (!admin.apps.length) {
  admin.initializeApp();
}

export const db = admin.firestore();
export const auth = admin.auth();
export default admin;
