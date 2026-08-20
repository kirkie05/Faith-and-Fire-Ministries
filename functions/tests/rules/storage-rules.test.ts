/**
 * Firebase Storage Security Rules — automated test suite.
 *
 * Runs against the Storage emulator with the production rules file
 * (storage.rules) under the production project id (faithandfire-b0455).
 * Proves: member != staff, guest != staff, staff-only uploads, per-user
 * avatar isolation, sermon restrictions, staff deletion, type/size limits.
 *
 * Run with: npm run test:storage
 */
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";
import { initializeTestEnvironment, assertFails, assertSucceeds, RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { ref, uploadString, deleteObject, getDownloadURL } from "@firebase/storage";

const PROJECT_ID = "faithandfire-b0455";
const BUCKET = `${PROJECT_ID}.firebasestorage.app`;
const RULES_PATH = path.resolve(__dirname, "../../../storage.rules");

let testEnv: RulesTestEnvironment;

before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    storage: {
      rules: fs.readFileSync(RULES_PATH, "utf8")
    }
  });
});

after(async () => {
  await testEnv.cleanup();
});

function staffCtx(role: "Admin" | "SuperAdmin" | "Minister" | "Pastor" | "DepartmentLeader" = "Admin") {
  return testEnv.authenticatedContext(`staff-${role}`, { email: `staff@test.com`, email_verified: true, role });
}

function memberCtx(uid = "member1") {
  return testEnv.authenticatedContext(uid, { email: "member@test.com", email_verified: true, role: "Member" });
}

function upload(uid: string | null, path: string, contentType: string, sizeBytes: number, claims?: Record<string, unknown>) {
  const ctx = uid === null ? testEnv.unauthenticatedContext() : testEnv.authenticatedContext(uid, { email_verified: true, ...claims });
  const storage = ctx.storage(BUCKET);
  const fileRef = ref(storage, path);
  const content = "x".repeat(Math.max(1, Math.floor(sizeBytes)));
  return uploadString(fileRef, content, "raw", { contentType }).then(() => ({ storage, fileRef }));
}

// ---- member != staff ----

test("guest cannot upload into the public folder", async () => {
  await assertFails(upload(null, "public/uploads/hack.jpg", "image/jpeg", 1000));
});

test("member cannot upload into the public folder (staff-only content)", async () => {
  await assertFails(upload("member1", "public/uploads/logo.png", "image/png", 1000, { role: "Member" }));
});

test("admin can upload an image into the public folder", async () => {
  await assertSucceeds(upload("staff-Admin", "public/uploads/logo-ok.png", "image/png", 2000, { role: "Admin" }));
});

test("member cannot upload into the staff members directory", async () => {
  await assertFails(upload("member1", "members/m_u1/profile.pdf", "application/pdf", 1000, { role: "Member" }));
});

test("admin can upload a document into the members directory", async () => {
  await assertSucceeds(upload("staff-Admin", "members/m_u1/profile.pdf", "application/pdf", 1000, { role: "Admin" }));
});

// ---- per-user avatar isolation ----

test("member cannot write into another member's avatar directory", async () => {
  await assertFails(upload("member1", "users/member2/avatar/photo.jpg", "image/jpeg", 1000, { role: "Member" }));
});

test("owner may upload their own avatar image", async () => {
  await assertSucceeds(upload("member1", "users/member1/avatar/photo.jpg", "image/jpeg", 1000, { role: "Member" }));
});

test("guest cannot upload an avatar", async () => {
  await assertFails(upload(null, "users/member1/avatar/photo.jpg", "image/jpeg", 1000));
});

// ---- file type and size limits ----

test("public folder rejects non-image files even for staff", async () => {
  await assertFails(upload("staff-Admin", "public/uploads/evil.exe", "application/x-msdownload", 1000, { role: "Admin" }));
});

test("public folder rejects oversized images (>= 15MB)", async () => {
  await assertFails(upload("staff-Admin", "public/uploads/big.png", "image/png", 15 * 1024 * 1024, { role: "Admin" }));
});

test("public folder accepts an image just under 15MB", async () => {
  await assertSucceeds(upload("staff-Admin", "public/uploads/big-ok.png", "image/png", 15 * 1024 * 1024 - 1, { role: "Admin" }));
});

test("avatar folder rejects non-image files", async () => {
  await assertFails(upload("member1", "users/member1/avatar/photo.pdf", "application/pdf", 1000, { role: "Member" }));
});

test("avatar folder rejects files over 5MB", async () => {
  await assertFails(upload("member1", "users/member1/avatar/huge.jpg", "image/jpeg", 5 * 1024 * 1024 + 1, { role: "Member" }));
});

// ---- sermons ----

test("member cannot upload sermons", async () => {
  await assertFails(upload("member1", "sermons/june-message.mp4", "video/mp4", 10 * 1024 * 1024, { role: "Member" }));
});

test("staff can upload a sermon video under 500MB", async () => {
  await assertSucceeds(upload("staff-Admin", "sermons/june-message-ok.mp4", "video/mp4", 10 * 1024 * 1024, { role: "Admin" }));
});

test("staff cannot upload a sermon over 500MB (static bound check)", async () => {
  const rulesSource = fs.readFileSync(RULES_PATH, "utf8");
  const sermonBlock = rulesSource.match(/match \/sermons\/\{[^}]+\} \{[\s\S]*?\n    \}/);
  assert.ok(sermonBlock, "sermons match block present");
  assert.match(sermonBlock[0], /underLimit\(500\)/);
  assert.match(rulesSource, /function underLimit\(mb\) \{\n\s+return request\.resource\.size < mb \* 1024 \* 1024;/);
});

test("sermon files are publicly readable", async () => {
  const { storage, fileRef } = await upload("staff-Admin", "sermons/public-read.mp4", "video/mp4", 1000, { role: "Admin" });
  const guestStorage = testEnv.unauthenticatedContext().storage(BUCKET);
  await assertSucceeds(getDownloadURL(ref(guestStorage, "sermons/public-read.mp4")));
});

// ---- staff deletion ----

test("admin can delete from the public folder", async () => {
  const { fileRef } = await upload("staff-Admin", "public/uploads/to-delete.png", "image/png", 1000, { role: "Admin" });
  await assertSucceeds(deleteObject(fileRef));
});

test("guest cannot delete from the public folder", async () => {
  const { fileRef } = await upload("staff-Admin", "public/uploads/stay.png", "image/png", 1000, { role: "Admin" });
  const guestStorage = testEnv.unauthenticatedContext().storage(BUCKET);
  await assertFails(deleteObject(ref(guestStorage, "public/uploads/stay.png")));
});

test("member cannot delete from the public folder", async () => {
  const { fileRef } = await upload("staff-Admin", "public/uploads/stay2.png", "image/png", 1000, { role: "Admin" });
  const memberStorage = memberCtx().storage(BUCKET);
  await assertFails(deleteObject(ref(memberStorage, "public/uploads/stay2.png")));
});

test("owner can delete their own avatar", async () => {
  const { fileRef } = await upload("member1", "users/member1/avatar/mine.jpg", "image/jpeg", 1000, { role: "Member" });
  await assertSucceeds(deleteObject(fileRef));
});

test("another member cannot delete someone else's avatar", async () => {
  await upload("member2", "users/member2/avatar/other.jpg", "image/jpeg", 1000, { role: "Member" });
  const attackerStorage = memberCtx("attacker").storage(BUCKET);
  await assertFails(deleteObject(ref(attackerStorage, "users/member2/avatar/other.jpg")));
});

test("default deny: unknown paths are not accessible", async () => {
  await assertFails(upload("staff-Admin", "ghost/folder/file.png", "image/png", 1000, { role: "Admin" }));
});

test("assert environment used the production project id", () => {
  assert.equal(PROJECT_ID, "faithandfire-b0455");
});