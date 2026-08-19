import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, initializeFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getStorage, connectStorageEmulator } from "firebase/storage";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";
import firebaseConfig from "../../firebase-applet-config.json";

let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

// Initialize Firestore with specific database ID if present in config
export const db = firebaseConfig.firestoreDatabaseId
  ? initializeFirestore(app, {}, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

export const auth = getAuth(app);
export const storage = getStorage(app);
const functions = getFunctions(app);

// Emulator wiring is strictly opt-in at build time (VITE_FIREBASE_EMULATOR=1).
// Without the flag, all traffic goes to the real project so an accidentally
// started dev server can never write test data to production.
if (import.meta.env.VITE_FIREBASE_EMULATOR === "1") {
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  connectStorageEmulator(storage, "127.0.0.1", 9199);
  connectFunctionsEmulator(functions, "127.0.0.1", 5001);
}

export default app;