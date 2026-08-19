import { test } from "node:test";
import assert from "node:assert/strict";
import { evaluateCreateInvite, evaluateSetRole } from "../src/role-policy";

const verified = true;

function invite(
  callerRole: string,
  requestedRole: string,
  overrides: Partial<Parameters<typeof evaluateCreateInvite>[0]> = {}
) {
  return evaluateCreateInvite({
    callerUid: "caller-1",
    callerRole,
    callerEmailVerified: verified,
    email: "target@example.com",
    requestedRole,
    ...overrides
  });
}

function setRole(
  callerRole: string,
  requestedRole: string,
  overrides: Partial<Parameters<typeof evaluateSetRole>[0]> = {}
) {
  return evaluateSetRole({
    callerUid: "caller-1",
    callerRole,
    callerEmailVerified: verified,
    targetUid: "target-1",
    requestedRole,
    targetCurrentRole: null,
    targetExists: true,
    ...overrides
  });
}

// ---- createAdminInvite scenarios ----

test("SuperAdmin creates a SuperAdmin invitation -> allowed", () => {
  const d = invite("SuperAdmin", "SuperAdmin");
  assert.equal(d.allowed, true);
});

test("Admin creates a SuperAdmin invitation -> denied", () => {
  const d = invite("Admin", "SuperAdmin");
  assert.equal(d.allowed, false);
  assert.equal(d.reason, "target-exceeds-caller");
});

test("SuperAdmin creates an Admin invitation -> allowed", () => {
  assert.equal(invite("SuperAdmin", "Admin").allowed, true);
});

test("Admin creates an Admin invitation -> allowed (peer invite)", () => {
  assert.equal(invite("Admin", "Admin").allowed, true);
});

test("Admin creates a Staff (Minister) invitation -> allowed", () => {
  assert.equal(invite("Admin", "Minister").allowed, true);
});

test("Staff (Pastor) creates an Admin invitation -> denied", () => {
  const d = invite("Pastor", "Admin");
  assert.equal(d.allowed, false);
  assert.equal(d.reason, "caller-role-missing-or-forged");
});

test("Member attempts to create any invitation -> denied (no admin claim)", () => {
  const d = invite("Member", "Member");
  assert.equal(d.allowed, false);
  assert.equal(d.reason, "caller-role-missing-or-forged");
});

test("Staff (Pastor) attempts to create an invite -> denied (no admin claim)", () => {
  const d = invite("Pastor", "Minister");
  assert.equal(d.allowed, false);
  assert.equal(d.reason, "caller-role-missing-or-forged");
});

test("Forged client role on invitation -> denied", () => {
  assert.equal(invite("SuperAdmin" as string, "Admin", { callerRole: "hacker" }).allowed, false);
  assert.equal(invite("SuperAdmin", "Owner").allowed, false);
  assert.equal(invite("SuperAdmin", "").allowed, false);
  assert.equal(invite("SuperAdmin", "SUPER ADMIN").allowed, false);
});

test("Invitation without auth / unverified email -> denied", () => {
  assert.equal(invite("Admin", "Admin", { callerUid: undefined }).allowed, false);
  assert.equal(invite("Admin", "Admin", { callerEmailVerified: false }).allowed, false);
});

// ---- setUserRole scenarios ----

test("SuperAdmin assigns SuperAdmin role -> allowed", () => {
  assert.equal(setRole("SuperAdmin", "SuperAdmin").allowed, true);
});

test("SuperAdmin assigns Admin role to a member -> allowed", () => {
  assert.equal(setRole("SuperAdmin", "Admin", { targetCurrentRole: "Member" }).allowed, true);
});

test("Admin promotes another user to SuperAdmin -> denied", () => {
  const d = setRole("Admin", "SuperAdmin", { targetCurrentRole: "Member" });
  assert.equal(d.allowed, false);
  assert.equal(d.reason, "target-exceeds-caller");
});

test("Admin promotes themselves -> denied", () => {
  const d = setRole("Admin", "Admin", { targetUid: "caller-1" });
  assert.equal(d.allowed, false);
  assert.equal(d.reason, "self-promotion");
});

test("SuperAdmin self-assignment still denied (no self-modification ever)", () => {
  const d = setRole("SuperAdmin", "SuperAdmin", { targetUid: "caller-1" });
  assert.equal(d.allowed, false);
  assert.equal(d.reason, "self-promotion");
});

test("Admin promotes a Member to Staff (Minister) -> allowed", () => {
  assert.equal(setRole("Admin", "Minister", { targetCurrentRole: "Member" }).allowed, true);
});

test("Admin promotes a Member to Admin -> allowed (peer promotion)", () => {
  assert.equal(setRole("Admin", "Admin", { targetCurrentRole: "Member" }).allowed, true);
});

test("Admin demotes or modifies a user who currently outranks them -> denied", () => {
  const d = setRole("Admin", "Member", { targetCurrentRole: "SuperAdmin" });
  assert.equal(d.allowed, false);
  assert.equal(d.reason, "target-outranks-caller");
});

test("Staff (Pastor) cannot promote anyone to Admin -> denied", () => {
  assert.equal(setRole("Pastor", "Admin").allowed, false);
  assert.equal(setRole("Minister", "SuperAdmin").allowed, false);
});

test("Forged client role on setUserRole -> denied", () => {
  const forged = setRole("SuperAdmin", "Admin", { callerRole: "SuperAdmin " });
  assert.equal(forged.allowed, false);
  assert.equal(forged.reason, "caller-role-missing-or-forged");
  assert.equal(setRole("SuperAdmin", "Admin", { callerRole: undefined }).allowed, false);
  assert.equal(setRole("Admin", "SuperAdmin", { requestedRole: "super admin" }).allowed, false);
  assert.equal(setRole("Admin", "Admin", { requestedRole: 42 }).allowed, false);
});

test("setUserRole without auth / unverified email -> denied", () => {
  assert.equal(setRole("Admin", "Admin", { callerUid: undefined }).allowed, false);
  assert.equal(setRole("Admin", "Admin", { callerEmailVerified: false }).allowed, false);
});

test("setUserRole for missing target -> denied", () => {
  const d = setRole("SuperAdmin", "Admin", { targetExists: false });
  assert.equal(d.allowed, false);
  assert.equal(d.reason, "target-not-found");
});