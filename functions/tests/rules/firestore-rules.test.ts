/**
 * Firestore Security Rules — automated test suite.
 *
 * Runs against the Firestore emulator with the production rules file
 * (firestore.rules) under the production project id (bustling-reflector-h4dh4).
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

const PROJECT_ID = "bustling-reflector-h4dh4";
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

test("assert environment used the production project id", () => {
  assert.equal(PROJECT_ID, "bustling-reflector-h4dh4");
});