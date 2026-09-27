// -------------------------------------------------------------
// SHADOW ASCENSION - FIREBASE CONFIGURATION
// Multi-user authentication & persistent cloud store
// -------------------------------------------------------------

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyB63dXav-PnSWkqlbrjpyrWllCbCkEl1uM',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'foodexpress-cc86b.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'foodexpress-cc86b',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'foodexpress-cc86b.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '192471303769',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:192471303769:web:5039d8de6cb90a9bb91348',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-X39YBYYDBB'
};

// Initialize Firebase singleton
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
