/**
 * ⚠️ DANGEROUS — DESTRUCTIVE MAINTENANCE SCRIPT ⚠️
 *
 * Deletes documents from PRODUCTION collections in the Faith & Fire
 * Firestore project (faithandfire-b0455).
 *
 * This script is NOT part of any build, deploy or test pipeline and must
 * NEVER run automatically. It requires an explicit `--yes` flag; any other
 * invocation exits without touching data.
 *
 * Usage: node scripts/maintenance/clear_db.js --yes
 */
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, deleteDoc } from "firebase/firestore";
import fs from "fs";

if (!process.argv.includes("--yes")) {
  console.error("ABORT: this script deletes PRODUCTION data. Re-run with --yes to confirm.");
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync("firebase-applet-config.json"));
const app = initializeApp(config);
const db = getFirestore(app);

const toDelete = [
  "events",
  "ministries",
  "sermons",
  "members",
  "donations"
];

async function run() {
  for (const coll of toDelete) {
    console.log(`Checking ${coll}...`);
    try {
      const snap = await getDocs(collection(db, coll));
      for (const d of snap.docs) {
        if (d.id.length < 5 || d.id.startsWith("v") || d.id.startsWith("m") || d.id.startsWith("e") || d.id.startsWith("d")) {
          // It's probably scaffold data like e1, m1, v1
          if (d.id !== "church_info" && !d.id.startsWith("evt_")) {
            await deleteDoc(doc(db, coll, d.id));
            console.log(`Deleted ${coll}/${d.id}`);
          }
        }
      }
    } catch (e) {
      console.log(`Error in ${coll}`, e.message);
    }
  }
  console.log("Done");
  process.exit(0);
}
run();