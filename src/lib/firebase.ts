// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;
let isFirebaseConfigured = false;

// Check if the config values are populated and are not the placeholder/test values.
const hasValidLookingCredentials = 
    firebaseConfig.apiKey && 
    !firebaseConfig.apiKey.includes('YOUR_API_KEY') &&
    firebaseConfig.projectId &&
    !firebaseConfig.projectId.includes('YOUR_PROJECT_ID');

if (hasValidLookingCredentials) {
    try {
        app = getApps().length ? getApp() : initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);
        isFirebaseConfigured = true;
    } catch (error) {
        console.error("Firebase initialization failed. This is likely due to invalid credentials in .env. The app will run in a degraded mode.");
        app = undefined;
        auth = undefined;
        db = undefined;
        isFirebaseConfigured = false;
    }
}

export { app, auth, db, isFirebaseConfigured };
