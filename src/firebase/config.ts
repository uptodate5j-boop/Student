import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
export const firebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth
export const auth = getAuth(firebaseApp);

// Initialize Firestore targeting the provisioned database ID
const databaseId = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? firebaseConfig.firestoreDatabaseId
  : '(default)';

export const db = getFirestore(firebaseApp, databaseId);

// Test Firestore connection on boot (as required by system guidelines)
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline, using local storage.');
    } else {
      console.warn('Firestore connection check notice:', error);
    }
    return false;
  }
}

// Ensure an authenticated session (anonymous auth) so request.auth is populated
let currentUser: User | null = null;
let authPromise: Promise<User | null> | null = null;

export function ensureAuth(): Promise<User | null> {
  if (currentUser) return Promise.resolve(currentUser);
  if (authPromise) return authPromise;

  authPromise = new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        currentUser = user;
        unsubscribe();
        resolve(user);
      } else {
        try {
          const cred = await signInAnonymously(auth);
          currentUser = cred.user;
          unsubscribe();
          resolve(cred.user);
        } catch (err) {
          console.warn('Anonymous auth failed or offline:', err);
          unsubscribe();
          resolve(null);
        }
      }
    });
  });

  return authPromise;
}

// Start auth & test connection immediately
ensureAuth().then(() => {
  testConnection();
});
