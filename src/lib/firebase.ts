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
const firebaseConfigAny = firebaseConfig as unknown as { firestoreDatabaseId?: string };
export const db = firebaseConfigAny.firestoreDatabaseId
  ? initializeFirestore(app, {}, firebaseConfigAny.firestoreDatabaseId)
  : getFirestore(app);

export const auth = getAuth(app);
export const storage = getStorage(app);
// Callables are deployed to the africa-south1 region (see setGlobalOptions in
// functions/src/index.ts) — the client must target the same region.
export const functions = getFunctions(app, "africa-south1");

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