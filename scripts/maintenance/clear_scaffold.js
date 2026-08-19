/**
 * ⚠️ DANGEROUS — MAINTENANCE SCRIPT ⚠️
 *
 * Deletes scaffold documents (e1..e4, m1..m4, v1..v6, mem1..mem2, don1..don3)
 * from PRODUCTION Firestore collections.
 *
 * This script is NOT part of any build, deploy or test pipeline and must
 * NEVER run automatically. It requires an explicit `--yes` flag; any other
 * invocation exits without touching data.
 *
 * Usage: node scripts/maintenance/clear_scaffold.js --yes
 */
import { initializeApp } from "firebase/app";
import { getFirestore, doc, deleteDoc } from "firebase/firestore";
import fs from "fs";

if (!process.argv.includes("--yes")) {
  console.error("ABORT: this script deletes PRODUCTION data. Re-run with --yes to confirm.");
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync("firebase-applet-config.json"));
const app = initializeApp(config);
const db = getFirestore(app);

const toDelete = [
  { coll: "events", ids: ["e1", "e2", "e3", "e4"] },
  { coll: "ministries", ids: ["m1", "m2", "m3", "m4"] },
  { coll: "sermons", ids: ["v1", "v2", "v3", "v4", "v5", "v6"] },
  { coll: "members", ids: ["mem1", "mem2"] },
  { coll: "donations", ids: ["don1", "don2", "don3"] },
];

async function run() {
  for (const group of toDelete) {
    for (const id of group.ids) {
      try {
        await deleteDoc(doc(db, group.coll, id));
        console.log(`Deleted ${group.coll}/${id}`);
      } catch (e) {
        console.log(`Failed to delete ${group.coll}/${id}`, e.message);
      }
    }
  }
  console.log("Done");
  process.exit(0);
}
run();