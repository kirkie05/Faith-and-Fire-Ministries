import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, setDoc, doc } from "firebase/firestore";
import fs from "fs";

const config = JSON.parse(fs.readFileSync("firebase-applet-config.json"));
const app = initializeApp(config);
const db = getFirestore(app);

async function run() {
  console.log("Testing Firestore connection...");
  try {
    const snap = await getDocs(collection(db, "events"));
    console.log("Success! Events count:", snap.size);
    process.exit(0);
  } catch (e) {
    console.log("Error:", e);
    process.exit(1);
  }
}
run();
