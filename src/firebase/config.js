/**
 * Firebase client SDK initialization.
 *
 * Setup:
 *   1. https://console.firebase.google.com -> Create project -> Add a Web App
 *   2. Copy the config object it gives you into client/.env (see .env.example)
 *   3. Enable Firestore Database (test mode is fine for the prototype)
 *
 * See /database/firestore.rules for example security rules to tighten this
 * before any real deployment (test mode is open to anyone).
 */
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
