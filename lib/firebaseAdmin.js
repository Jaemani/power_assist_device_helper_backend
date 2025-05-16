// lib/firebaseAdmin.js
import { readFileSync } from "fs";
import { join } from "path";

import admin from 'firebase-admin';
const serviceAccount = JSON.parse(
  readFileSync(join(process.cwd(), "config/soo-ri-firebase-adminsdk-fbsvc-fd4fe84326.json"), "utf8")
);

const initializeFirebaseAdmin = () => {
    try {
        if (admin.apps.length === 0) {
            admin.initializeApp({
              credential: admin.credential.cert(serviceAccount),
            });
            console.log("✅ Firebase Admin initialized");
          } else {
            console.log("🔁 Firebase Admin already initialized");
          }
    } catch (error) {
        console.error('Error initializing Firebase Admin with custom app:', error);
    }
};

export default initializeFirebaseAdmin;