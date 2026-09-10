import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
  Unsubscribe,
} from 'firebase/auth';
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

// Test Firestore connection on boot
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline.');
    } else {
      console.warn('Firestore connection check notice:', error);
    }
    return false;
  }
}

// Google Provider for Teacher Authentication
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

/**
 * Sign in teacher using Firebase Auth with Google Sign-In popup
 */
export async function signInTeacherWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

/**
 * Sign out teacher
 */
export async function signOutTeacher(): Promise<void> {
  await signOut(auth);
}

/**
 * Get current authenticated user
 */
export async function ensureAuth(): Promise<User | null> {
  return auth.currentUser;
}

/**
 * Listen to teacher authentication state
 */
export function subscribeTeacherAuth(callback: (user: User | null) => void): Unsubscribe {
  return onAuthStateChanged(auth, callback);
}

// Test connection on boot
testConnection();

