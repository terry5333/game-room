import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
  type Auth,
  type User
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  type Firestore
} from 'firebase/firestore';
import {
  getDatabase,
  ref,
  set,
  get,
  child,
  onValue,
  onDisconnect,
  remove,
  serverTimestamp as rtdbServerTimestamp,
  type Database
} from 'firebase/database';
import type { UserProfile } from '../types';

export interface FirebaseCustomConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
  databaseURL?: string;
  measurementId?: string;
}

// User-provided Firebase Configuration
export const DEFAULT_FIREBASE_CONFIG: FirebaseCustomConfig = {
  apiKey: "AIzaSyDN5CE2SY1-1-QDMkG8ADh0DsAkNqDd_P4",
  authDomain: "game-d7c86.firebaseapp.com",
  databaseURL: "https://game-d7c86-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "game-d7c86",
  storageBucket: "game-d7c86.firebasestorage.app",
  messagingSenderId: "774168021478",
  appId: "1:774168021478:web:46bba59c6efc510384ee27",
  measurementId: "G-N04FQKRGHV"
};

export function getStoredFirebaseConfig(): FirebaseCustomConfig {
  try {
    const custom = localStorage.getItem('duo_custom_firebase_config');
    if (custom) return JSON.parse(custom);
  } catch {}
  return DEFAULT_FIREBASE_CONFIG;
}

export function saveCustomFirebaseConfig(config: FirebaseCustomConfig) {
  try {
    localStorage.setItem('duo_custom_firebase_config', JSON.stringify(config));
    window.location.reload();
  } catch {}
}

export function clearCustomFirebaseConfig() {
  try {
    localStorage.removeItem('duo_custom_firebase_config');
    window.location.reload();
  } catch {}
}

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let rtdb: Database | null = null;

try {
  app = getApps().length > 0 ? getApp() : initializeApp(DEFAULT_FIREBASE_CONFIG);
  auth = getAuth(app);
  db = getFirestore(app);
  if (DEFAULT_FIREBASE_CONFIG.databaseURL) {
    rtdb = getDatabase(app, DEFAULT_FIREBASE_CONFIG.databaseURL);
  } else {
    rtdb = getDatabase(app);
  }
} catch (err) {
  console.warn('Firebase initialization error:', err);
}

export function isFirebaseConfigured(): boolean {
  return app !== null && auth !== null;
}

export {
  app,
  auth,
  db,
  rtdb,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  ref,
  set,
  get,
  child,
  onValue,
  onDisconnect,
  remove,
  rtdbServerTimestamp
};
