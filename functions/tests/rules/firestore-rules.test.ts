/**
 * Firestore Security Rules — automated test suite.
 *
 * Runs against the Firestore emulator with the production rules file
 * (firestore.rules) under the production project id (faithandfire-b0455).
 * Covers the "Dirty Dozen" threat payloads from security_spec.md plus the
 * SuperAdmin privilege-escalation scenarios at the rules layer.
 *
 * Run with: npm run test:rules
 */
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";
import { initializeTestEnvironment, assertFails, assertSucceeds, RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { serverTimestamp as ServerTimestamp, Timestamp } from "firebase/firestore";

const PROJECT_ID = "faithandfire-b0455";
const RULES_PATH = path.resolve(__dirname, "../../../firestore.rules");

let testEnv: RulesTestEnvironment;

before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: fs.readFileSync(RULES_PATH, "utf8")
    }
  });
});

after(async () => {
  await testEnv.cleanup();
});

function ctx(uid: string, claims: Record<string, unknown> = {}) {
  return testEnv.authenticatedContext(uid, { email_verified: true, ...claims });
}

function memberPayload(overrides: Record<string, unknown> = {}) {
  return {
    id: "m_u1",
    firstName: "Jane",
    lastName: "Doe",
    email: "jane@example.com",
    phone: "0820000000",
    suburb: "Rosettenville",
    joinedDate: "2026-01-01",
    ministries: ["m1"],
    status: "Active",
    archived: false,
    createdAt: ServerTimestamp(),
    updatedAt: ServerTimestamp(),
    ...overrides
  };
}

test("Payload 1: client cannot create a user document with role SuperAdmin", async () => {
  const db = ctx("attacker123", { role: "Member" }).firestore();
  await assertFails(db.collection("users").doc("attacker123").set({
    role: "SuperAdmin",
    email: "attacker@test.com",
    createdAt: ServerTimestamp()
  }));
});

test("Payload 1b: user self-provisioning is forced to role Member", async () => {
  const db = ctx("member1", { role: "Member" }).firestore();
  await assertSucceeds(db.collection("users").doc("member1").set({
    role: "Member",
    email: "member1@test.com",
    createdAt: ServerTimestamp()
  }));
});

test("Payload 1c: self-provisioning with a forged role claim on the doc is denied", async () => {
  const db = ctx("member1", { role: "Member" }).firestore();
  await assertFails(db.collection("users").doc("member1").set({
    role: "Admin",
    email: "member1@test.com",
    createdAt: ServerTimestamp()
  }));
});

test("Payload 2: prayer request with spoofed ownerId is denied", async () => {
  const db = ctx("userA", { role: "Member" }).firestore();
  await assertFails(db.collection("prayerRequests").add({
    requestText: "Please pray",
    requesterName: "User A",
    isAnonymous: false,
    isPrivate: true,
    permissionToContact: false,
    ownerId: "victimUserB",
    status: "New",
    createdAt: ServerTimestamp(),
    updatedAt: ServerTimestamp()
  }));
});

test("Payload 2b: prayer request with own ownerId is allowed", async () => {
  const db = ctx("userA", { role: "Member" }).firestore();
  await assertSucceeds(db.collection("prayerRequests").add({
    requestText: "Please pray",
    requesterName: "User A",
    isAnonymous: false,
    isPrivate: true,
    permissionToContact: false,
    ownerId: "userA",
    status: "New",
    createdAt: ServerTimestamp(),
    updatedAt: ServerTimestamp()
  }));
});

test("Payload 3: guest cannot list the members collection", async () => {
  const db = ctx("guestUser", { role: "Guest" }).firestore();
  await assertFails(db.collection("members").get());
});

test("Payload 3b: Admin can list the members collection", async () => {
  const db = ctx("adminUser", { role: "Admin" }).firestore();
  await assertSucceeds(db.collection("members").get());
});

test("Payload 4: ghost-field injection on a users update is denied", async () => {
  const db = ctx("superAdmin", { role: "SuperAdmin" }).firestore();
  const ref = db.collection("users").doc("someuser");
  await testEnv.withSecurityRulesDisabled(async (env) => {
    await env.firestore().collection("users").doc("someuser").set({
      role: "Member",
      email: "some@test.com",
      createdAt: Timestamp.now()
    });
  });
  await assertFails(ref.update({
    email: "some@test.com",
    role: "Member",
    updatedAt: ServerTimestamp(),
    approvedByAdmin: true
  }));
});

test("Payload 5: audit log deletion is denied for every client", async () => {
  const db = ctx("adminUser", { role: "Admin" }).firestore();
  await assertFails(db.collection("auditLogs").doc("log123").delete());
});

test("Payload 5b: audit log client creation is denied", async () => {
  const db = ctx("adminUser", { role: "Admin" }).firestore();
  await assertFails(db.collection("auditLogs").add({ action: "FORGE", resource: "x", timestamp: ServerTimestamp() }));
});

test("Payload 6: donation records can only be written by the server", async () => {
  const db = ctx("member1", { role: "Member" }).firestore();
  await assertFails(db.collection("donations").add({
    amount: 1000,
    fund: "Tithes",
    firstName: "Jane",
    lastName: "Doe",
    email: "jane@example.com",
    type: "One-off",
    status: "SUCCESS",
    ownerId: "member1",
    createdAt: ServerTimestamp(),
    updatedAt: ServerTimestamp()
  }));
});

test("Payload 6b: an Admin cannot forge a donation either", async () => {
  const db = ctx("adminUser", { role: "Admin" }).firestore();
  await assertFails(db.collection("donations").add({
    amount: 5000,
    fund: "Tithes",
    status: "SUCCESS",
    createdAt: ServerTimestamp()
  }));
});

test("Payload 7: oversized document ids are denied", async () => {
  const db = ctx("adminUser", { role: "Admin" }).firestore();
  const hugeId = "m".repeat(200);
  await assertFails(db.collection("members").doc(hugeId).set(memberPayload()));
});

test("Payload 8: client transaction forgery is denied", async () => {
  const db = ctx("adminUser", { role: "Admin" }).firestore();
  await assertFails(db.collection("transactions").doc("DON-FORGED").set({
    amount: 5000,
    gateway: "payfast",
    status: "SUCCESS",
    reference: "fake_ref",
    createdAt: ServerTimestamp()
  }));
});

test("Payload 9: archived member records cannot be resurrected", async () => {
  const db = ctx("adminUser", { role: "Admin" }).firestore();
  const ref = db.collection("members").doc("m_archived");
  await testEnv.withSecurityRulesDisabled(async (env) => {
    await env.firestore().collection("members").doc("m_archived").set(memberPayload({ archived: true }));
  });
  await assertFails(ref.update({ ...memberPayload({ archived: false }) }));
  await assertSucceeds(ref.update({ ...memberPayload({ archived: true }), updatedBy: "adminUser" }));
});

test("Payload 9b: staff cannot resurrect an archived member either", async () => {
  const db = ctx("ministerUser", { role: "Minister" }).firestore();
  const ref = db.collection("members").doc("m_archived2");
  await testEnv.withSecurityRulesDisabled(async (env) => {
    await env.firestore().collection("members").doc("m_archived2").set(memberPayload({ archived: true }));
  });
  await assertFails(ref.update({ ...memberPayload({ archived: false }) }));
});

test("Payload 10: anonymous read of settings/global is denied", async () => {
  const db = testEnv.unauthenticatedContext().firestore();
  await assertFails(db.collection("settings").doc("global").get());
});

test("Payload 10b: public settings remain readable anonymously", async () => {
  const db = testEnv.unauthenticatedContext().firestore();
  await assertSucceeds(db.collection("settings").doc("church_info").get());
});

test("Payload 10c: payfast_credentials is not readable anonymously", async () => {
  const db = testEnv.unauthenticatedContext().firestore();
  await assertFails(db.collection("settings").doc("payfast_credentials").get());
});

test("Payload 10d: payfast_credentials is readable by an Admin", async () => {
  const db = ctx("adminUser", { role: "Admin" }).firestore();
  await testEnv.withSecurityRulesDisabled(async (env) => {
    await env.firestore().collection("settings").doc("payfast_credentials").set({
      merchantId: "10000100",
      merchantKey: "sekret",
      createdAt: Timestamp.now()
    });
  });
  await assertSucceeds(db.collection("settings").doc("payfast_credentials").get());
});

test("Payload 11: cross-user notification read is denied", async () => {
  const db = ctx("userA", { role: "Member" }).firestore();
  const ref = db.collection("notifications").doc("notif_for_userB");
  await testEnv.withSecurityRulesDisabled(async (env) => {
    await env.firestore().collection("notifications").doc("notif_for_userB").set({
      recipient: "userb@test.com",
      recipientUid: "userB",
      title: "hi",
      body: "hello",
      createdAt: Timestamp.now()
    });
  });
  await assertFails(ref.get());
});

test("Payload 11b: own notification (by recipientUid) is readable", async () => {
  const db = ctx("userB", { role: "Member" }).firestore();
  const ref = db.collection("notifications").doc("notif_for_userB");
  await assertSucceeds(ref.get());
});

test("Payload 12: private prayer request of another member is denied", async () => {
  const db = ctx("memberX", { role: "Member" }).firestore();
  const ref = db.collection("prayerRequests").doc("private_req_memberY");
  await testEnv.withSecurityRulesDisabled(async (env) => {
    await env.firestore().collection("prayerRequests").doc("private_req_memberY").set({
      requestText: "secret",
      isPrivate: true,
      ownerId: "memberY",
      status: "New",
      createdAt: Timestamp.now()
    });
  });
  await assertFails(ref.get());
});

test("Payload 12b: public prayer request of another member is still denied (member isolation)", async () => {
  const db = ctx("memberX", { role: "Member" }).firestore();
  const ref = db.collection("prayerRequests").doc("public_req_memberY");
  await testEnv.withSecurityRulesDisabled(async (env) => {
    await env.firestore().collection("prayerRequests").doc("public_req_memberY").set({
      requestText: "public",
      isPrivate: false,
      ownerId: "memberY",
      status: "New",
      createdAt: Timestamp.now()
    });
  });
  await assertFails(ref.get());
});

// ---- Phase 2: privilege escalation at the rules layer ----

test("escalation: Admin cannot write to admin_invites at all", async () => {
  const db = ctx("adminUser", { role: "Admin" }).firestore();
  await assertFails(db.collection("admin_invites").doc("victim@test.com").set({
    role: "SuperAdmin",
    invitedBy: "adminUser",
    invitedAt: ServerTimestamp(),
    redeemed: false
  }));
});

test("escalation: Admin cannot write to admin_invites (create) as SuperAdmin either", async () => {
  const db = ctx("adminUser", { role: "Admin" }).firestore();
  await assertFails(db.collection("admin_invites").doc("victim2@test.com").set({
    role: "SuperAdmin"
  }));
});

test("escalation: role field on users is immutable for clients (SuperAdmin cannot change it)", async () => {
  const db = ctx("superAdmin", { role: "SuperAdmin" }).firestore();
  const ref = db.collection("users").doc("victim");
  await testEnv.withSecurityRulesDisabled(async (env) => {
    await env.firestore().collection("users").doc("victim").set({
      role: "Member",
      email: "victim@test.com",
      createdAt: Timestamp.now()
    });
  });
  await assertFails(ref.update({ role: "SuperAdmin", updatedAt: ServerTimestamp() }));
});

test("escalation: clients can never supply a role on members", async () => {
  const db = ctx("member1", { role: "Member" }).firestore();
  await assertFails(db.collection("members").doc("m_u1").set(memberPayload({ role: "SuperAdmin" })));
});

test("escalation: members cannot write to other users' notifications", async () => {
  const db = ctx("memberX", { role: "Member" }).firestore();
  await assertFails(db.collection("notifications").doc("spoof").set({
    recipient: "victim@test.com",
    title: "spam",
    body: "spam",
    createdAt: ServerTimestamp()
  }));
});

// ---- Schema & authorization sanity at the rules layer ----

test("staff can create a member record without a pin", async () => {
  const db = ctx("adminUser", { role: "Admin" }).firestore();
  await assertSucceeds(db.collection("members").doc("m_u9").set(memberPayload({ createdBy: "adminUser" })));
});

test("members create with a pin field is denied even for staff (PINs live in memberPins only)", async () => {
  const db = ctx("adminUser", { role: "Admin" }).firestore();
  await assertFails(db.collection("members").doc("m_u9").set(memberPayload({ pin: "1234", createdBy: "adminUser" })));
});

test("members update with a pin field is denied even for staff", async () => {
  const admin = ctx("adminUser", { role: "Admin" }).firestore();
  await testEnv.withSecurityRulesDisabled(async (env) => {
    await env.firestore().collection("members").doc("m_u9").set(memberPayload({ createdBy: "adminUser" }));
  });
  await assertFails(admin.collection("members").doc("m_u9").update({ pin: "9999", updatedAt: ServerTimestamp() }));
});

test("non-staff cannot create a member record", async () => {
  const db = ctx("member1", { role: "Member" }).firestore();
  await assertFails(db.collection("members").doc("m_u10").set(memberPayload()));
});

test("members create with ghost fields is denied even for staff", async () => {
  const db = ctx("adminUser", { role: "Admin" }).firestore();
  await assertFails(db.collection("members").doc("m_u11").set(memberPayload({ ghostField: true })));
});

test("visitor cards may be created anonymously with a strict schema", async () => {
  const db = testEnv.unauthenticatedContext().firestore();
  await assertSucceeds(db.collection("visitors").add({
    name: "Visitor One",
    email: "visitor@test.com",
    phone: "0820000000",
    details: "Visitor card",
    type: "FirstTimer",
    status: "New",
    source: "visitor-card",
    ownerId: null,
    createdAt: ServerTimestamp(),
    updatedAt: ServerTimestamp()
  }));
});

test("visitor cards reject ghost fields", async () => {
  const db = testEnv.unauthenticatedContext().firestore();
  await assertFails(db.collection("visitors").add({
    name: "Visitor One",
    details: "Visitor card",
    adminBackdoor: true,
    ownerId: null,
    createdAt: ServerTimestamp(),
    updatedAt: ServerTimestamp()
  }));
});

test("memberPins: staff may store a valid 64-char SHA-256 pin hash", async () => {
  const db = ctx("adminUser", { role: "Admin" }).firestore();
  const validHash = "a".repeat(64);
  await assertSucceeds(db.collection("memberPins").doc("m_u9").set({
    pinHash: validHash,
    updatedAt: ServerTimestamp()
  }));
});

test("memberPins: malformed pin hash length is denied even for staff", async () => {
  const db = ctx("adminUser", { role: "Admin" }).firestore();
  await assertFails(db.collection("memberPins").doc("m_u9").set({
    pinHash: "1234",
    updatedAt: ServerTimestamp()
  }));
});

test("memberPins: ghost fields are denied even for staff", async () => {
  const db = ctx("adminUser", { role: "Admin" }).firestore();
  await assertFails(db.collection("memberPins").doc("m_u9").set({
    pinHash: "a".repeat(64),
    pin: "1234",
    updatedAt: ServerTimestamp()
  }));
});

test("memberPins: members cannot read or write other members' PIN hashes", async () => {
  const db = ctx("member1", { role: "Member" }).firestore();
  await assertFails(db.collection("memberPins").doc("m_u9").get());
  await assertFails(db.collection("memberPins").doc("m_u9").set({
    pinHash: "a".repeat(64),
    updatedAt: ServerTimestamp()
  }));
});

test("followUps: staff may update but never create", async () => {
  const staff = ctx("adminUser", { role: "Admin" }).firestore();
  const ref = staff.collection("followUps").doc("fu1");
  await testEnv.withSecurityRulesDisabled(async (env) => {
    await env.firestore().collection("followUps").doc("fu1").set({
      visitorId: "v1",
      personName: "Visitor One",
      email: null,
      phone: null,
      status: "New",
      assignedWorkerId: null,
      notes: [],
      lastContactAt: null,
      nextFollowUpAt: null,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
  });
  await assertSucceeds(ref.update({ status: "Contacted", updatedAt: ServerTimestamp() }));
  await assertFails(staff.collection("followUps").add({
    personName: "Forged",
    status: "New",
    createdAt: ServerTimestamp(),
    updatedAt: ServerTimestamp()
  }));
});

test("users collection list is staff-only", async () => {
  const memberDb = ctx("member1", { role: "Member" }).firestore();
  await assertFails(memberDb.collection("users").get());
  const adminDb = ctx("adminUser", { role: "Admin" }).firestore();
  await assertSucceeds(adminDb.collection("users").get());
});

test("settings updates are admin-only with strict schema", async () => {
  const memberDb = ctx("member1", { role: "Member" }).firestore();
  await assertFails(memberDb.collection("settings").doc("church_info").set({ name: "Hacked" }, { merge: true }));
  const adminDb = ctx("adminUser", { role: "Admin" }).firestore();
  await testEnv.withSecurityRulesDisabled(async (env) => {
    await env.firestore().collection("settings").doc("church_info").set({
      name: "Faith & Fire Ministries",
      createdAt: Timestamp.now()
    });
  });
  await assertSucceeds(adminDb.collection("settings").doc("church_info").update({
    name: "Faith & Fire Ministries",
    updatedAt: ServerTimestamp(),
    updatedBy: "adminUser"
  }));
});

test("settings updates with a forged updatedBy actor are denied", async () => {
  const adminDb = ctx("adminUser", { role: "Admin" }).firestore();
  await assertFails(adminDb.collection("settings").doc("church_info").update({
    name: "Faith & Fire Ministries",
    updatedAt: ServerTimestamp(),
    updatedBy: "someoneElse"
  }));
});

test("settings updates that omit updatedBy are denied", async () => {
  const adminDb = ctx("adminUser", { role: "Admin" }).firestore();
  await testEnv.withSecurityRulesDisabled(async (env) => {
    await env.firestore().collection("settings").doc("church_info").set({
      name: "Faith & Fire Ministries",
      createdAt: Timestamp.now()
    });
  });
  await assertFails(adminDb.collection("settings").doc("church_info").update({
    name: "Faith & Fire Ministries",
    updatedAt: ServerTimestamp()
  }));
});

test("settings: payfast_credentials are admin-only (staff below Admin denied)", async () => {
  await testEnv.withSecurityRulesDisabled(async (env) => {
    await env.firestore().collection("settings").doc("payfast_credentials").set({
      merchantId: "10012345",
      merchantKey: "secret-key",
      passphrase: "secret-passphrase",
      sandbox: true,
      updatedAt: Timestamp.now(),
      updatedBy: "adminUser"
    });
  });
  const pastor = ctx("pastor1", { role: "Pastor" }).firestore();
  await assertFails(pastor.collection("settings").doc("payfast_credentials").get());
  const minister = ctx("ministerUser", { role: "Minister" }).firestore();
  await assertFails(minister.collection("settings").doc("payfast_credentials").get());
  const admin = ctx("adminUser", { role: "Admin" }).firestore();
  await assertSucceeds(admin.collection("settings").doc("payfast_credentials").get());
});

test("settings: notification_credentials are admin-only (staff below Admin denied)", async () => {
  await testEnv.withSecurityRulesDisabled(async (env) => {
    await env.firestore().collection("settings").doc("notification_credentials").set({
      email: { apiKey: "x" },
      sms: { apiKey: "y" },
      whatsapp: { apiKey: "z" },
      updatedAt: Timestamp.now(),
      updatedBy: "adminUser"
    });
  });
  const pastor = ctx("pastor1", { role: "Pastor" }).firestore();
  await assertFails(pastor.collection("settings").doc("notification_credentials").get());
  const admin = ctx("adminUser", { role: "Admin" }).firestore();
  await assertSucceeds(admin.collection("settings").doc("notification_credentials").get());
});

test("settings: public settings remain readable by non-admin staff", async () => {
  const pastor = ctx("pastor1", { role: "Pastor" }).firestore();
  await assertSucceeds(pastor.collection("settings").doc("church_info").get());
});

test("members: a linked member may update only their own profile fields", async () => {
  await testEnv.withSecurityRulesDisabled(async (env) => {
    await env.firestore().collection("members").doc("m_self").set({
      id: "m_self",
      firstName: "Jane",
      lastName: "Doe",
      email: "jane@example.com",
      phone: "0820000000",
      suburb: "Rosettenville",
      joinedDate: "2026-01-01",
      ministries: ["m1"],
      status: "Active",
      ownerId: "member1",
      archived: false,
      createdBy: "adminUser",
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
  });
  const member = ctx("member1", { role: "Member" }).firestore();
  await assertSucceeds(member.collection("members").doc("m_self").update({
    phone: "0831112222",
    suburb: "Johannesburg",
    updatedAt: ServerTimestamp(),
    updatedBy: "member1"
  }));
  await assertFails(member.collection("members").doc("m_self").update({
    status: "Inactive",
    updatedAt: ServerTimestamp(),
    updatedBy: "member1"
  }));
  await assertFails(member.collection("members").doc("m_self").update({
    archived: true,
    updatedAt: ServerTimestamp(),
    updatedBy: "member1"
  }));
  await assertFails(member.collection("members").doc("m_self").update({
    phone: "0831112222",
    updatedAt: ServerTimestamp(),
    updatedBy: "someoneElse"
  }));
  const stranger = ctx("member2", { role: "Member" }).firestore();
  await assertFails(stranger.collection("members").doc("m_self").update({
    phone: "0831112222",
    updatedAt: ServerTimestamp(),
    updatedBy: "member2"
  }));
});

test("members: a member linked by verified email may update their own profile", async () => {
  await testEnv.withSecurityRulesDisabled(async (env) => {
    await env.firestore().collection("members").doc("m_email").set({
      id: "m_email",
      firstName: "Jane",
      lastName: "Doe",
      email: "jane@example.com",
      phone: "0820000000",
      suburb: "Rosettenville",
      joinedDate: "2026-01-01",
      ministries: [],
      status: "Active",
      ownerId: null,
      archived: false,
      createdBy: "adminUser",
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
  });
  const member = ctx("member9", { role: "Member", email: "jane@example.com" }).firestore();
  await assertSucceeds(member.collection("members").doc("m_email").update({
    phone: "0831112222",
    updatedAt: ServerTimestamp(),
    updatedBy: "member9"
  }));
});

test("members create with a forged createdBy actor is denied", async () => {
  const db = ctx("adminUser", { role: "Admin" }).firestore();
  await assertFails(db.collection("members").doc("m_u12").set(memberPayload({ createdBy: "someoneElse" })));
});

test("members update without updatedBy is denied", async () => {
  const admin = ctx("adminUser", { role: "Admin" }).firestore();
  await assertFails(admin.collection("members").doc("m_u9").update({ phone: "0830000000", updatedAt: ServerTimestamp() }));
});

test("members update with a forged updatedBy actor is denied", async () => {
  const admin = ctx("adminUser", { role: "Admin" }).firestore();
  await assertFails(admin.collection("members").doc("m_u9").update({
    phone: "0830000000",
    updatedAt: ServerTimestamp(),
    updatedBy: "someoneElse"
  }));
});

test("members update by the authenticated actor is allowed", async () => {
  const admin = ctx("adminUser", { role: "Admin" }).firestore();
  await assertSucceeds(admin.collection("members").doc("m_u9").update({
    phone: "0830000000",
    updatedAt: ServerTimestamp(),
    updatedBy: "adminUser"
  }));
});

test("member applications: anonymous applicants must leave createdBy null", async () => {
  const anon = testEnv.unauthenticatedContext().firestore();
  await assertSucceeds(anon.collection("memberApplications").doc("app_anon1").set({
    id: "app_anon1",
    firstName: "Jane",
    lastName: "Doe",
    email: "jane@example.com",
    phone: "0820000000",
    suburb: "Rosettenville",
    joinedDate: "2026-01-01",
    ministries: [],
    status: "Pending",
    createdBy: null,
    archived: false,
    createdAt: ServerTimestamp(),
    updatedAt: ServerTimestamp()
  }));
  await assertFails(anon.collection("memberApplications").doc("app_anon2").set({
    id: "app_anon2",
    firstName: "Jane",
    lastName: "Doe",
    email: "jane@example.com",
    phone: "0820000000",
    suburb: "Rosettenville",
    joinedDate: "2026-01-01",
    ministries: [],
    status: "Pending",
    createdBy: "someoneElse",
    archived: false,
    createdAt: ServerTimestamp(),
    updatedAt: ServerTimestamp()
  }));
});

test("member applications: signed-in applicants must use their own uid as createdBy and ownerId", async () => {
  const member = ctx("member1", { role: "Member" }).firestore();
  await assertSucceeds(member.collection("memberApplications").doc("app_u1").set({
    id: "app_u1",
    firstName: "Jane",
    lastName: "Doe",
    email: "jane@example.com",
    phone: "0820000000",
    suburb: "Rosettenville",
    joinedDate: "2026-01-01",
    ministries: [],
    status: "Pending",
    createdBy: "member1",
    ownerId: "member1",
    archived: false,
    createdAt: ServerTimestamp(),
    updatedAt: ServerTimestamp()
  }));
  await assertFails(member.collection("memberApplications").doc("app_u2").set({
    id: "app_u2",
    firstName: "Jane",
    lastName: "Doe",
    email: "jane@example.com",
    phone: "0820000000",
    suburb: "Rosettenville",
    joinedDate: "2026-01-01",
    ministries: [],
    status: "Pending",
    createdBy: "adminUser",
    ownerId: "member1",
    archived: false,
    createdAt: ServerTimestamp(),
    updatedAt: ServerTimestamp()
  }));
});

test("member applications: profile extras (photo, dob, baptismStatus) are accepted", async () => {
  const member = ctx("member1", { role: "Member" }).firestore();
  await assertSucceeds(member.collection("memberApplications").doc("app_u3").set({
    id: "app_u3",
    firstName: "Jane",
    lastName: "Doe",
    email: "jane@example.com",
    phone: "0820000000",
    suburb: "Rosettenville",
    joinedDate: "2026-01-01",
    ministries: ["m1"],
    status: "Pending",
    dob: "1990-01-01",
    baptismStatus: "Baptized",
    photo: "data:image/png;base64,AAAA",
    ownerId: "member1",
    createdBy: "member1",
    archived: false,
    createdAt: ServerTimestamp(),
    updatedAt: ServerTimestamp()
  }));
});

test("member applications: ownerId must match the signed-in applicant", async () => {
  const member = ctx("member1", { role: "Member" }).firestore();
  await assertFails(member.collection("memberApplications").doc("app_u4").set({
    id: "app_u4",
    firstName: "Jane",
    lastName: "Doe",
    email: "jane@example.com",
    phone: "0820000000",
    suburb: "Rosettenville",
    joinedDate: "2026-01-01",
    ministries: [],
    status: "Pending",
    ownerId: "victimUser",
    createdBy: "member1",
    archived: false,
    createdAt: ServerTimestamp(),
    updatedAt: ServerTimestamp()
  }));
  await assertFails(member.collection("memberApplications").doc("app_u5").set({
    id: "app_u5",
    firstName: "Jane",
    lastName: "Doe",
    email: "jane@example.com",
    phone: "0820000000",
    suburb: "Rosettenville",
    joinedDate: "2026-01-01",
    ministries: [],
    status: "Pending",
    ownerId: "member1",
    createdBy: "victimUser",
    archived: false,
    createdAt: ServerTimestamp(),
    updatedAt: ServerTimestamp()
  }));
});

test("attendances are server-written only", async () => {
  const db = ctx("adminUser", { role: "Admin" }).firestore();
  await assertFails(db.collection("attendance").add({
    memberId: "m_u1",
    memberName: "Jane Doe",
    serviceName: "Sunday",
    date: "2026-08-18",
    timestamp: "09:00:00",
    createdAt: ServerTimestamp()
  }));
});

test("transactions and auditLogs lists are admin-only", async () => {
  const memberDb = ctx("member1", { role: "Member" }).firestore();
  await assertFails(memberDb.collection("transactions").get());
  await assertFails(memberDb.collection("auditLogs").get());
  const adminDb = ctx("adminUser", { role: "Admin" }).firestore();
  await assertSucceeds(adminDb.collection("auditLogs").get());
});

test("default deny: an undefined collection is not readable", async () => {
  const db = ctx("adminUser", { role: "Admin" }).firestore();
  await assertFails(db.collection("ghost_collection_xyz").get());
});

test("anonymous users cannot write user documents", async () => {
  const db = testEnv.unauthenticatedContext().firestore();
  await assertFails(db.collection("users").doc("anon").set({
    role: "Member",
    email: "anon@test.com",
    createdAt: ServerTimestamp()
  }));
});

test("ministries/events/sermons: staff creates must carry their own createdBy and updatedBy", async () => {
  const staff = ctx("pastor1", { role: "Pastor" }).firestore();
  await assertSucceeds(staff.collection("ministries").doc("min_1").set({
    id: "min_1",
    name: "Worship Team",
    category: "Music",
    description: "Praise and worship",
    active: true,
    blurb: "",
    archived: false,
    createdBy: "pastor1",
    updatedBy: "pastor1",
    createdAt: ServerTimestamp(),
    updatedAt: ServerTimestamp()
  }));
  await assertSucceeds(staff.collection("events").doc("evt_1").set({
    id: "evt_1",
    title: "Sunday Celebration",
    category: "Sunday",
    date: "2026-09-01",
    description: "",
    archived: false,
    createdBy: "pastor1",
    updatedBy: "pastor1",
    createdAt: ServerTimestamp(),
    updatedAt: ServerTimestamp()
  }));
  await assertSucceeds(staff.collection("sermons").doc("ser_1").set({
    id: "ser_1",
    title: "The Power of Holiness",
    speaker: "Apostle Eric Malaba",
    date: "2026-08-18",
    category: "Sunday",
    description: "",
    archived: false,
    createdBy: "pastor1",
    updatedBy: "pastor1",
    createdAt: ServerTimestamp(),
    updatedAt: ServerTimestamp()
  }));
});

test("ministries/events/sermons: forged createdBy actors are denied", async () => {
  const staff = ctx("pastor1", { role: "Pastor" }).firestore();
  await assertFails(staff.collection("ministries").doc("min_2").set({
    id: "min_2",
    name: "Worship Team",
    category: "Music",
    description: "Praise and worship",
    active: true,
    blurb: "",
    archived: false,
    createdBy: "someoneElse",
    createdAt: ServerTimestamp(),
    updatedAt: ServerTimestamp()
  }));
  await assertFails(staff.collection("events").doc("evt_2").set({
    id: "evt_2",
    title: "Sunday Celebration",
    category: "Sunday",
    date: "2026-09-01",
    description: "",
    archived: false,
    createdBy: "someoneElse",
    createdAt: ServerTimestamp(),
    updatedAt: ServerTimestamp()
  }));
  await assertFails(staff.collection("sermons").doc("ser_2").set({
    id: "ser_2",
    title: "The Power of Holiness",
    speaker: "Apostle Eric Malaba",
    date: "2026-08-18",
    category: "Sunday",
    description: "",
    archived: false,
    createdBy: "someoneElse",
    createdAt: ServerTimestamp(),
    updatedAt: ServerTimestamp()
  }));
});

test("ministries/events/sermons: updates must carry the authenticated updatedBy", async () => {
  const staff = ctx("pastor1", { role: "Pastor" }).firestore();
  await assertSucceeds(staff.collection("ministries").doc("min_1").update({
    description: "Updated description",
    updatedAt: ServerTimestamp(),
    updatedBy: "pastor1"
  }));
  await assertFails(staff.collection("ministries").doc("min_1").update({
    description: "Forged update",
    updatedAt: ServerTimestamp(),
    updatedBy: "someoneElse"
  }));
  await testEnv.withSecurityRulesDisabled(async (env) => {
    await env.firestore().collection("ministries").doc("min_3").set({
      id: "min_3",
      name: "Fresh Ministry",
      category: "Music",
      description: "",
      active: true,
      blurb: "",
      archived: false,
      createdBy: "pastor1",
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
  });
  await assertFails(staff.collection("ministries").doc("min_3").update({
    description: "Missing actor update",
    updatedAt: ServerTimestamp()
  }));
});

test("cellGroups: staff creates with own createdBy/updatedBy; publicly readable", async () => {
  const staff = ctx("pastor1", { role: "Pastor" }).firestore();
  await assertSucceeds(staff.collection("cellGroups").doc("cg_1").set({
    id: "cg_1",
    name: "Rosettenville Central Cell",
    slug: "rosettenville-central-cell",
    suburb: "Rosettenville",
    area: "Johannesburg South",
    day: "Wednesday",
    time: "06:30 PM",
    venue: "Sis. Thandi's Home",
    leaderName: "Elder Eric Malaba",
    leaderTitle: "Cell Leader",
    leaderPhone: "+27 82 000 0000",
    description: "Weekly fellowship in Rosettenville.",
    capacity: 15,
    memberCount: 0,
    active: true,
    archived: false,
    createdBy: "pastor1",
    updatedBy: "pastor1",
    createdAt: ServerTimestamp(),
    updatedAt: ServerTimestamp()
  }));
  const member = ctx("member1", { role: "Member", email: "jane@example.com" }).firestore();
  await assertSucceeds(member.collection("cellGroups").doc("cg_1").get());
  const anon = testEnv.unauthenticatedContext().firestore();
  await assertSucceeds(anon.collection("cellGroups").doc("cg_1").get());
});

test("cellGroups: forged createdBy denied; members cannot create groups", async () => {
  const staff = ctx("pastor1", { role: "Pastor" }).firestore();
  await assertFails(staff.collection("cellGroups").doc("cg_2").set({
    id: "cg_2",
    name: "Forged Cell",
    slug: "forged-cell",
    suburb: "Rosettenville",
    area: "Johannesburg South",
    day: "Wednesday",
    time: "06:30 PM",
    venue: "",
    leaderName: "",
    leaderTitle: "",
    leaderPhone: "",
    description: "",
    capacity: 15,
    memberCount: 0,
    active: true,
    archived: false,
    createdBy: "someoneElse",
    updatedAt: ServerTimestamp()
  }));
  const member = ctx("member1", { role: "Member", email: "jane@example.com" }).firestore();
  await assertFails(member.collection("cellGroups").doc("cg_3").set({
    id: "cg_3",
    name: "Member Group",
    slug: "member-group",
    suburb: "Rosettenville",
    area: "Johannesburg South",
    day: "Wednesday",
    time: "06:30 PM",
    venue: "",
    leaderName: "",
    leaderTitle: "",
    leaderPhone: "",
    description: "",
    capacity: 15,
    memberCount: 0,
    active: true,
    archived: false,
    createdBy: "member1",
    updatedBy: "member1",
    createdAt: ServerTimestamp(),
    updatedAt: ServerTimestamp()
  }));
});

test("members: linked member may set their own cellGroupId (self-edit)", async () => {
  await testEnv.withSecurityRulesDisabled(async (env) => {
    const seed = env.firestore();
    await seed.collection("members").doc("m_own").set({
      id: "m_own",
      firstName: "Jane",
      lastName: "Doe",
      email: "jane@example.com",
      phone: "",
      suburb: "Rosettenville",
      joinedDate: "2026-01-01",
      ministries: ["m1"],
      status: "Active",
      ownerId: "member1",
      archived: false,
      createdBy: "staff1",
      updatedAt: Timestamp.now(),
      updatedBy: "staff1"
    });
    await seed.collection("members").doc("m_other").set({
      id: "m_other",
      firstName: "Other",
      lastName: "Person",
      email: "other@example.com",
      phone: "",
      suburb: "Rosettenville",
      joinedDate: "2026-01-01",
      ministries: [],
      status: "Active",
      ownerId: "otherUser",
      archived: false,
      createdBy: "staff1",
      updatedAt: Timestamp.now(),
      updatedBy: "staff1"
    });
  });
  const member = ctx("member1", { role: "Member", email: "jane@example.com" }).firestore();
  await assertSucceeds(member.collection("members").doc("m_own").update({
    cellGroupId: "cg_1",
    updatedAt: ServerTimestamp(),
    updatedBy: "member1"
  }));
  // A member cannot set the cell group on someone else's record.
  await assertFails(member.collection("members").doc("m_other").update({
    cellGroupId: "cg_1",
    updatedAt: ServerTimestamp(),
    updatedBy: "member1"
  }));
  // A member cannot escalate the change to status via the self-edit path.
  await assertFails(member.collection("members").doc("m_own").update({
    status: "Inactive",
    updatedAt: ServerTimestamp(),
    updatedBy: "member1"
  }));
});

test("memberApplications: linked applicant may set their own cellGroupId", async () => {
  await testEnv.withSecurityRulesDisabled(async (env) => {
    const seed = env.firestore();
    await seed.collection("memberApplications").doc("m_app1").set({
      id: "m_app1",
      firstName: "Jane",
      lastName: "Doe",
      email: "jane@example.com",
      phone: "",
      suburb: "Rosettenville",
      joinedDate: "2026-01-01",
      ministries: [],
      status: "Pending",
      archived: false,
      ownerId: "member1",
      createdBy: "member1",
      updatedAt: Timestamp.now(),
      updatedBy: "member1"
    });
  });
  const member = ctx("member1", { role: "Member", email: "jane@example.com" }).firestore();
  await assertSucceeds(member.collection("memberApplications").doc("m_app1").update({
    cellGroupId: "cg_1",
    updatedAt: ServerTimestamp(),
    updatedBy: "member1"
  }));
  // A non-owner cannot change the application's cell group.
  const other = ctx("intruder", { role: "Member", email: "intruder@example.com" }).firestore();
  await assertFails(other.collection("memberApplications").doc("m_app1").update({
    cellGroupId: "cg_1",
    updatedAt: ServerTimestamp(),
    updatedBy: "intruder"
  }));
});

test("communications: staff broadcast + member-scoped messages; member reads own thread only", async () => {
  const staff = ctx("pastor1", { role: "Pastor", email: "pastor@example.com" }).firestore();
  await assertSucceeds(staff.collection("communications").add({
    type: "notification",
    title: "Sunday Service Reminder",
    body: "Join us this Sunday at 09:00 AM.",
    audience: "all",
    ownerUid: "all",
    senderRole: "staff",
    senderName: "Church Office",
    readBy: [],
    createdAt: ServerTimestamp(),
    updatedAt: ServerTimestamp()
  }));
  await assertSucceeds(staff.collection("communications").add({
    type: "message",
    body: "Hello member, we received your prayer request.",
    audience: "member",
    ownerUid: "member1",
    senderRole: "staff",
    senderName: "Pastor Care",
    readBy: [],
    createdAt: ServerTimestamp(),
    updatedAt: ServerTimestamp()
  }));
  // Members can read broadcasts and their own thread via the in-constraint.
  const member = ctx("member1", { role: "Member", email: "jane@example.com" }).firestore();
  await assertSucceeds(member.collection("communications").where("ownerUid", "in", ["member1", "all"]).get());
  // A member cannot list the whole collection or another member's thread.
  await assertFails(member.collection("communications").get());
  await assertFails(member.collection("communications").where("ownerUid", "==", "otherUser").get());
  // A member can reply to their own thread but never target another uid.
  await assertSucceeds(member.collection("communications").add({
    type: "message",
    body: "Thank you for the reply!",
    audience: "member",
    ownerUid: "member1",
    senderRole: "member",
    senderName: "Jane Doe",
    readBy: [],
    createdAt: ServerTimestamp(),
    updatedAt: ServerTimestamp()
  }));
  await assertFails(member.collection("communications").add({
    type: "message",
    body: "Spoofed target",
    audience: "member",
    ownerUid: "otherUser",
    senderRole: "member",
    senderName: "Jane Doe",
    readBy: [],
    createdAt: ServerTimestamp(),
    updatedAt: ServerTimestamp()
  }));
  // Members cannot forge staff notifications or broadcast to everyone.
  await assertFails(member.collection("communications").add({
    type: "notification",
    title: "Fake",
    body: "Fake broadcast",
    audience: "all",
    senderRole: "member",
    senderName: "Jane",
    readBy: [],
    createdAt: ServerTimestamp(),
    updatedAt: ServerTimestamp()
  }));
  // Members can mark their own thread items read, but not someone else's.
  let otherThreadId = "";
  await testEnv.withSecurityRulesDisabled(async (env) => {
    await env.firestore().collection("communications").add({
      type: "message",
      body: "Existing thread message",
      audience: "member",
      ownerUid: "member1",
      senderRole: "staff",
      senderName: "Church Office",
      readBy: [],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    const otherDoc = await env.firestore().collection("communications").add({
      type: "message",
      body: "Other member thread",
      audience: "member",
      ownerUid: "otherUser",
      senderRole: "staff",
      senderName: "Church Office",
      readBy: [],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    otherThreadId = otherDoc.id;
  });
  const list = await member.collection("communications").where("ownerUid", "==", "member1").get();
  const ownId = list.docs[0].id;
  await assertSucceeds(member.collection("communications").doc(ownId).update({
    readBy: ["member1"],
    updatedAt: ServerTimestamp(),
    updatedBy: "member1"
  }));
  await assertFails(member.collection("communications").doc(otherThreadId).update({
    readBy: ["member1"],
    updatedAt: ServerTimestamp(),
    updatedBy: "member1"
  }));
});

test("memberApplications: linked applicant may now edit profile fields and photo", async () => {
  await testEnv.withSecurityRulesDisabled(async (env) => {
    await env.firestore().collection("memberApplications").doc("m_app2").set({
      id: "m_app2",
      firstName: "Jane",
      lastName: "Doe",
      email: "jane@example.com",
      phone: "",
      suburb: "Rosettenville",
      joinedDate: "2026-01-01",
      ministries: [],
      status: "Pending",
      archived: false,
      ownerId: "member1",
      createdBy: "member1",
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      updatedBy: "member1"
    });
  });
  const member = ctx("member1", { role: "Member", email: "jane@example.com" }).firestore();
  await assertSucceeds(member.collection("memberApplications").doc("m_app2").update({
    firstName: "Jane",
    lastName: "Doe",
    phone: "+27 82 123 4567",
    suburb: "Moffat View",
    photo: "https://firebasestorage.googleapis.com/avatar.png",
    updatedAt: ServerTimestamp(),
    updatedBy: "member1"
  }));
  // The applicant can read their own pending application.
  await assertSucceeds(member.collection("memberApplications").doc("m_app2").get());
  // A stranger cannot read another applicant's record.
  const intruder = ctx("intruder", { role: "Member", email: "intruder@example.com" }).firestore();
  await assertFails(intruder.collection("memberApplications").doc("m_app2").get());
});

test("anonymous users cannot write attendance (guest check-in is server-side only)", async () => {
  const anon = testEnv.unauthenticatedContext().firestore();
  await assertFails(anon.collection("attendance").add({
    memberId: "m_u1",
    memberName: "Jane Doe",
    serviceName: "Sunday",
    date: "2026-08-18",
    timestamp: "09:00:00",
    createdAt: ServerTimestamp()
  }));
  await assertFails(anon.collection("attendance").doc("att_1").delete());
});

test("unauthorized deletes: anonymous users and members cannot delete member records", async () => {
  const anon = testEnv.unauthenticatedContext().firestore();
  await assertFails(anon.collection("members").doc("m_u1").delete());
  const member = ctx("member1", { role: "Member" }).firestore();
  await assertFails(member.collection("members").doc("m_u1").delete());
});

test("unauthorized deletes: staff below Admin cannot delete member records", async () => {
  const minister = ctx("ministerUser", { role: "Minister" }).firestore();
  await assertFails(minister.collection("members").doc("m_u1").delete());
});

test("authorized deletes: Admin may delete a member record", async () => {
  const admin = ctx("adminUser", { role: "Admin" }).firestore();
  await assertSucceeds(admin.collection("members").doc("m_u9").delete());
});

test("M3: members may list only records linked to them (ownerId or verified email)", async () => {
  await testEnv.withSecurityRulesDisabled(async (env) => {
    const seed = env.firestore();
    await seed.collection("attendance").doc("att_m1").set({
      id: "att_m1", memberId: "m_u1", memberName: "Jane", serviceName: "Sunday",
      date: "2026-08-18", timestamp: "09:00:00", ownerId: "member1",
      createdAt: Timestamp.now(), updatedAt: Timestamp.now()
    });
    await seed.collection("attendance").doc("att_email").set({
      id: "att_email", memberId: "m_u3", memberName: "Email Jane", serviceName: "Sunday",
      date: "2026-08-18", timestamp: "09:00:00", ownerId: null, memberEmail: "jane@example.com",
      createdAt: Timestamp.now(), updatedAt: Timestamp.now()
    });
    await seed.collection("attendance").doc("att_other").set({
      id: "att_other", memberId: "m_u2", memberName: "Bob", serviceName: "Sunday",
      date: "2026-08-18", timestamp: "09:00:00", ownerId: "otherUser",
      createdAt: Timestamp.now(), updatedAt: Timestamp.now()
    });
    await seed.collection("donations").doc("don_m1").set({
      id: "don_m1", amount: 500, fund: "Tithes", ownerId: "member1",
      createdAt: Timestamp.now(), updatedAt: Timestamp.now()
    });
    await seed.collection("donations").doc("don_other").set({
      id: "don_other", amount: 900, fund: "Tithes", ownerId: "otherUser",
      createdAt: Timestamp.now(), updatedAt: Timestamp.now()
    });
    await seed.collection("connectSubmissions").doc("cs_m1").set({
      id: "cs_m1", type: "Prayer", name: "Jane", email: "jane@example.com",
      details: "", status: "New", ownerId: "member1",
      createdAt: Timestamp.now(), updatedAt: Timestamp.now()
    });
    await seed.collection("connectSubmissions").doc("cs_other").set({
      id: "cs_other", type: "Prayer", name: "Bob", email: "bob@example.com",
      details: "", status: "New", ownerId: "otherUser",
      createdAt: Timestamp.now(), updatedAt: Timestamp.now()
    });
  });

  const member = ctx("member1", { role: "Member", email: "jane@example.com" }).firestore();
  // Linked records are readable individually.
  await assertSucceeds(member.collection("attendance").doc("att_m1").get());
  await assertSucceeds(member.collection("attendance").doc("att_email").get());
  await assertFails(member.collection("attendance").doc("att_other").get());
  // Unscoped list queries are now denied for members — only scoped queries
  // that return their own records pass (per-document rule evaluation).
  await assertFails(member.collection("attendance").get());
  await assertSucceeds(member.collection("attendance").where("ownerId", "==", "member1").get());
  await assertSucceeds(member.collection("attendance").where("memberEmail", "==", "jane@example.com").get());
  await assertSucceeds(member.collection("donations").doc("don_m1").get());
  await assertFails(member.collection("donations").doc("don_other").get());
  await assertFails(member.collection("donations").get());
  await assertSucceeds(member.collection("donations").where("ownerId", "==", "member1").get());
  await assertSucceeds(member.collection("connectSubmissions").doc("cs_m1").get());
  await assertFails(member.collection("connectSubmissions").doc("cs_other").get());
  await assertFails(member.collection("connectSubmissions").get());
  await assertSucceeds(member.collection("connectSubmissions").where("ownerId", "==", "member1").get());
  await assertSucceeds(member.collection("connectSubmissions").where("email", "==", "jane@example.com").get());

  const staff = ctx("staffUser", { role: "Admin" }).firestore();
  await assertSucceeds(staff.collection("attendance").get());
  await assertSucceeds(staff.collection("donations").get());
  await assertSucceeds(staff.collection("connectSubmissions").get());
  await assertSucceeds(staff.collection("donations").doc("don_other").get());
});

test("M3b: a member can read their own member record (ownerId or verified email) but never the roster", async () => {
  await testEnv.withSecurityRulesDisabled(async (env) => {
    const seed = env.firestore();
    await seed.collection("members").doc("m_u1").set(memberPayload({ ownerId: "member1", createdBy: "adminUser", updatedBy: "adminUser" }));
    await seed.collection("members").doc("m_email").set(memberPayload({ id: "m_email", ownerId: null, createdBy: "adminUser", updatedBy: "adminUser" }));
    await seed.collection("members").doc("m_other").set(memberPayload({ id: "m_other", email: "bob@example.com", ownerId: "otherUser", createdBy: "adminUser", updatedBy: "adminUser" }));
  });

  const owner = ctx("member1", { role: "Member", email: "jane@example.com" }).firestore();
  await assertSucceeds(owner.collection("members").doc("m_u1").get());
  await assertSucceeds(owner.collection("members").doc("m_email").get());
  await assertFails(owner.collection("members").doc("m_other").get());
  await assertFails(owner.collection("members").get());
  await assertSucceeds(owner.collection("members").where("ownerId", "==", "member1").get());
  await assertSucceeds(owner.collection("members").where("email", "==", "jane@example.com").get());

  const anon = testEnv.unauthenticatedContext().firestore();
  await assertFails(anon.collection("members").doc("m_u1").get());
  await assertFails(anon.collection("members").get());
});

test("M4: members may only bump rsvpCount on an event (diff-based update branch)", async () => {
  await testEnv.withSecurityRulesDisabled(async (env) => {
    const seed = env.firestore();
    await seed.collection("events").doc("evt_rsvp").set({
      id: "evt_rsvp", title: "Sunday Celebration", category: "Sunday",
      date: "2026-09-01", description: "", archived: false,
      rsvpCount: 1, createdBy: "staffUser", updatedBy: "staffUser",
      createdAt: Timestamp.now(), updatedAt: Timestamp.now()
    });
  });

  const member = ctx("member1", { role: "Member" }).firestore();
  const evt = member.collection("events").doc("evt_rsvp");
  await assertSucceeds(evt.update({ rsvpCount: 2 }));
  await assertFails(evt.update({ rsvpCount: 3, title: "Renamed" }));
  await assertFails(evt.update({ title: "Renamed" }));
  await assertFails(evt.update({ rsvpCount: 2 }));

  const anon = testEnv.unauthenticatedContext().firestore();
  await assertFails(anon.collection("events").doc("evt_rsvp").update({ rsvpCount: 3 }));
});

test("M4: eventRegistrations are owner-scoped and write-once from the client", async () => {
  const member = ctx("member1", { role: "Member" }).firestore();
  await assertSucceeds(member.collection("eventRegistrations").doc("rsvp_evt1_1_abc").set({
    id: "rsvp_evt1_1_abc", eventId: "evt_rsvp", name: "Jane", email: "jane@example.com",
    status: "Registered", ticketId: "FFM-TKT-123456", ownerId: "member1",
    createdAt: ServerTimestamp(), updatedAt: ServerTimestamp()
  }));
  await assertSucceeds(member.collection("eventRegistrations").doc("rsvp_evt1_1_abc").get());

  const anon = testEnv.unauthenticatedContext().firestore();
  await assertSucceeds(anon.collection("eventRegistrations").doc("rsvp_evt1_2_xyz").set({
    id: "rsvp_evt1_2_xyz", eventId: "evt_rsvp", name: "Guest", email: "guest@example.com",
    status: "Waitlisted", ticketId: "FFM-TKT-654321", ownerId: null,
    createdAt: ServerTimestamp(), updatedAt: ServerTimestamp()
  }));

  const forger = ctx("forger", { role: "Member" }).firestore();
  await assertFails(forger.collection("eventRegistrations").doc("rsvp_evt1_3_forged").set({
    id: "rsvp_evt1_3_forged", eventId: "evt_rsvp", name: "Jane", email: "jane@example.com",
    status: "Registered", ticketId: "FFM-TKT-111111", ownerId: "member1",
    createdAt: ServerTimestamp(), updatedAt: ServerTimestamp()
  }));
  await assertFails(forger.collection("eventRegistrations").doc("rsvp_evt1_2_xyz").get());
  await assertFails(member.collection("eventRegistrations").doc("rsvp_evt1_2_xyz").update({
    status: "CheckedIn"
  }));
  await assertFails(member.collection("eventRegistrations").doc("rsvp_evt1_1_abc").delete());

  const staff = ctx("staffUser", { role: "Admin" }).firestore();
  await assertSucceeds(staff.collection("eventRegistrations").get());
});

test("L3 regression: settings writes require the authenticated updatedBy for EVERY settings id", async () => {
  await testEnv.withSecurityRulesDisabled(async (env) => {
    const seed = env.firestore();
    // Legacy-style doc created before the updatedBy policy (no actor field).
    // On update the merged doc therefore still lacks updatedBy, so the
    // precedence fix (updatedBy required for every settings id) must deny it.
    await seed.collection("settings").doc("website_settings").set({
      churchName: "Faith & Fire", logoUrl: "", faviconUrl: "",
      moduleToggles: {}, visualTokens: {},
      createdAt: Timestamp.now(), updatedAt: Timestamp.now()
    });
  });

  const admin = ctx("adminUser", { role: "Admin" }).firestore();
  const settings = admin.collection("settings").doc("website_settings");
  await assertFails(settings.update({
    churchName: "Faith & Fire Ministries",
    updatedAt: ServerTimestamp()
  }));
  await assertSucceeds(settings.update({
    churchName: "Faith & Fire Ministries",
    updatedBy: "adminUser",
    updatedAt: ServerTimestamp()
  }));
  // Creates must stamp the authenticated actor too — under the old
  // precedence the updatedBy check applied to church_info only.
  await assertFails(admin.collection("settings").doc("payfast_credentials").set({
    merchantId: "10000000", merchantKey: "key", passphrase: "pass", sandbox: true,
    updatedAt: ServerTimestamp()
  }));
  await assertSucceeds(admin.collection("settings").doc("payfast_credentials").set({
    merchantId: "10000000", merchantKey: "key", passphrase: "pass", sandbox: true,
    updatedBy: "adminUser",
    createdAt: ServerTimestamp(),
    updatedAt: ServerTimestamp()
  }));
});

test("assert environment used the production project id", () => {
  assert.equal(PROJECT_ID, "faithandfire-b0455");
});

test("events: weekly repeating services carry the repeat field", async () => {
  const staff = ctx("staffUser", { role: "Pastor" }).firestore();
  await assertSucceeds(staff.collection("events").doc("evt_weekly").set({
    id: "evt_weekly",
    title: "Sunday Glory Service",
    slug: "sunday-glory-service",
    category: "Sunday",
    date: "Aug 20, 2026",
    fullDate: "2026-08-20",
    time: "09:00 AM - 11:30 AM",
    venue: "Main Sanctuary",
    description: "Weekly service",
    image: "https://example.com/x.jpg",
    featured: false,
    rsvpCount: 0,
    dates: ["2026-08-20", "2026-08-27", "2026-09-03"],
    isDateRange: false,
    startTime: "09:00",
    endTime: "11:30",
    repeat: "weekly",
    archived: false,
    createdBy: "staffUser",
    updatedBy: "staffUser",
    createdAt: ServerTimestamp(),
    updatedAt: ServerTimestamp()
  }));
});

test("members: staff create with milestones seeded is accepted", async () => {
  const staff = ctx("staffUser", { role: "Pastor" }).firestore();
  await assertSucceeds(staff.collection("members").doc("m_seeded").set({
    ...memberPayload({ id: "m_seeded", ownerId: "member1", createdBy: "staffUser", updatedBy: "staffUser" }),
    milestones: {
      salvation: "Pending",
      waterBaptism: "Pending",
      believersFoundation: "Pending",
      cellFellowship: "Pending",
      ministryDeployment: "Pending"
    }
  }));
});

test("member applications: milestones seed is accepted from the signed-in applicant", async () => {
  const member = ctx("member1", { role: "Member" }).firestore();
  await assertSucceeds(member.collection("memberApplications").doc("app_m1").set({
    id: "app_m1",
    firstName: "Jane",
    lastName: "Doe",
    email: "jane@example.com",
    phone: "0820000000",
    suburb: "Rosettenville",
    joinedDate: "2026-01-01",
    ministries: [],
    status: "Pending",
    milestones: {
      salvation: "Pending",
      waterBaptism: "Pending",
      believersFoundation: "Pending",
      cellFellowship: "Pending",
      ministryDeployment: "Pending"
    },
    ownerId: "member1",
    createdBy: "member1",
    archived: false,
    createdAt: ServerTimestamp(),
    updatedAt: ServerTimestamp()
  }));
});

test("milestoneRequests: a linked member may submit a Pending confirmation request", async () => {
  await testEnv.withSecurityRulesDisabled(async (env) => {
    const seed = env.firestore();
    await seed.collection("members").doc("m_member1").set({
      id: "m_member1",
      firstName: "Jane",
      lastName: "Doe",
      email: "jane@example.com",
      status: "Active",
      archived: false,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
  });
  const member = ctx("member1", { role: "Member", email: "jane@example.com" }).firestore();
  await assertSucceeds(member.collection("milestoneRequests").doc("ms_m_member1_waterBaptism").set({
    id: "ms_m_member1_waterBaptism",
    memberId: "m_member1",
    memberName: "Jane Doe",
    memberEmail: "jane@example.com",
    milestoneId: "waterBaptism",
    milestoneLabel: "Water Baptism",
    status: "Pending",
    ownerId: "member1",
    createdAt: ServerTimestamp(),
    updatedAt: ServerTimestamp()
  }));
});

test("milestoneRequests: forged status, foreign member, or anonymous requests are denied", async () => {
  const attacker = ctx("attacker123", { role: "Member", email: "attacker@test.com" }).firestore();
  // Status other than Pending is forbidden.
  await assertFails(attacker.collection("milestoneRequests").doc("ms_x1").set({
    id: "ms_x1",
    memberId: "m_member1",
    memberName: "Jane Doe",
    memberEmail: "jane@example.com",
    milestoneId: "waterBaptism",
    milestoneLabel: "Water Baptism",
    status: "Approved",
    ownerId: "attacker123",
    createdAt: ServerTimestamp(),
    updatedAt: ServerTimestamp()
  }));
  // A foreign member cannot submit on behalf of another member's email.
  await assertFails(attacker.collection("milestoneRequests").doc("ms_x2").set({
    id: "ms_x2",
    memberId: "m_member1",
    memberName: "Jane Doe",
    memberEmail: "jane@example.com",
    milestoneId: "waterBaptism",
    milestoneLabel: "Water Baptism",
    status: "Pending",
    ownerId: "attacker123",
    createdAt: ServerTimestamp(),
    updatedAt: ServerTimestamp()
  }));
  const anon = testEnv.unauthenticatedContext().firestore();
  await assertFails(anon.collection("milestoneRequests").doc("ms_x3").set({
    id: "ms_x3",
    memberId: "m_member1",
    memberName: "Jane Doe",
    memberEmail: "jane@example.com",
    milestoneId: "waterBaptism",
    milestoneLabel: "Water Baptism",
    status: "Pending",
    ownerId: "attacker123",
    createdAt: ServerTimestamp(),
    updatedAt: ServerTimestamp()
  }));
});

test("milestoneRequests: staff list all requests; members see only their own", async () => {
  await testEnv.withSecurityRulesDisabled(async (env) => {
    const seed = env.firestore();
    await seed.collection("milestoneRequests").doc("ms_own").set({
      id: "ms_own",
      memberId: "m_member1",
      memberName: "Jane Doe",
      memberEmail: "jane@example.com",
      milestoneId: "waterBaptism",
      milestoneLabel: "Water Baptism",
      status: "Pending",
      ownerId: "member1",
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    await seed.collection("milestoneRequests").doc("ms_other").set({
      id: "ms_other",
      memberId: "m_other",
      memberName: "Other Member",
      memberEmail: "other@example.com",
      milestoneId: "salvation",
      milestoneLabel: "Salvation & Faith Decision",
      status: "Pending",
      ownerId: "otherUser",
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
  });
  const staff = ctx("staffUser", { role: "Pastor", email: "staff@test.com" }).firestore();
  await assertSucceeds(staff.collection("milestoneRequests").get());
  const member = ctx("member1", { role: "Member", email: "jane@example.com" }).firestore();
  await assertSucceeds(member.collection("milestoneRequests").doc("ms_own").get());
  await assertFails(member.collection("milestoneRequests").doc("ms_other").get());
  await assertSucceeds(member.collection("milestoneRequests").where("ownerId", "==", "member1").get());
});