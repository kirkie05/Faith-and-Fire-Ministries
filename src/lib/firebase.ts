import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, initializeFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
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
export default app;
