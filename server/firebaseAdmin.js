// -------------------------------------------------------------
// SHADOW ASCENSION - SERVER-SIDE FIREBASE ADMIN SDK
// Authoritative backend initialization for Firebase Authentication
// and Cloud Firestore. NEVER import this file into frontend client code.
// -------------------------------------------------------------

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeApp, cert, getApps, getApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to load .env if process.env values are not already populated
function ensureEnvLoaded() {
  const envCandidates = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(__dirname, '../.env')
  ];
  for (const envPath of envCandidates) {
    if (fs.existsSync(envPath)) {
      try {
        const lines = fs.readFileSync(envPath, 'utf8').split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) continue;
          const idx = trimmed.indexOf('=');
          if (idx !== -1) {
            const key = trimmed.slice(0, idx).trim();
            const val = trimmed.slice(idx + 1).trim().replace(/^['"](.*)['"]$/, '$1');
            if (!process.env[key]) {
              process.env[key] = val;
            }
          }
        }
      } catch (e) {}
      break;
    }
  }
}

ensureEnvLoaded();

const PROJECT_ID = process.env.VITE_FIREBASE_PROJECT_ID || 'foodexpress-cc86b';

// Locate service account credentials safely
function getServiceAccountPath() {
  const candidates = [
    process.env.GOOGLE_APPLICATION_CREDENTIALS,
    process.env.FIREBASE_SERVICE_ACCOUNT,
    path.resolve(process.cwd(), 'serviceAccountKey.json'),
    path.resolve(__dirname, '../serviceAccountKey.json')
  ];

  for (const p of candidates) {
    if (p && fs.existsSync(p)) {
      return p;
    }
  }
  return null;
}

let app;
const existingApps = getApps();

if (existingApps.length === 0) {
  const serviceAccountPath = getServiceAccountPath();
  if (serviceAccountPath) {
    try {
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
      app = initializeApp({
        credential: cert(serviceAccount),
        projectId: serviceAccount.project_id || PROJECT_ID
      });
      console.log(`[Firebase Admin] Initialized with service account: ${serviceAccount.client_email} (Project: ${serviceAccount.project_id || PROJECT_ID})`);
    } catch (err) {
      console.warn('[Firebase Admin] Warning reading serviceAccountKey, initializing with project ID:', err.message);
      app = initializeApp({ projectId: PROJECT_ID });
    }
  } else {
    console.log(`[Firebase Admin] Initialized with project ID: ${PROJECT_ID}`);
    app = initializeApp({ projectId: PROJECT_ID });
  }
} else {
  app = existingApps[0];
}

export const adminApp = app;
export const adminAuth = getAuth(app);
export const adminDb = getFirestore(app);
export { FieldValue };

export default {
  app: adminApp,
  auth: adminAuth,
  db: adminDb,
  FieldValue
};
