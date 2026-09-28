// -------------------------------------------------------------
// SHADOW ASCENSION - FIREBASE CLIENT CONFIGURATION
// Re-exports the single Firebase app instance, Auth, and Firestore
// to ensure zero duplicate initializeApp() invocations.
// -------------------------------------------------------------

export { app, auth, db, default } from './config';
