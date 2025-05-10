// lib/firebaseAdmin.js
import admin from 'firebase-admin';
import serviceAccount from '@/config/soo-ri-firebase-adminsdk-fbsvc-f0ea9c9b4b.json'; // Replace with the actual path to your service account key file

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