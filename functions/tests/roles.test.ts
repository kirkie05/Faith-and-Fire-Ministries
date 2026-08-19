import { test } from "node:test";
import assert from "node:assert/strict";
import {
  canAssignRole,
  isAdminRole,
  isAppRole,
  isStaffRole,
  ROLE_LEVELS
} from "../src/roles";

test("role hierarchy levels", () => {
  assert.equal(ROLE_LEVELS.SuperAdmin, 4);
  assert.equal(ROLE_LEVELS.Admin, 3);
  assert.equal(ROLE_LEVELS.Pastor, 2);
  assert.equal(ROLE_LEVELS.Minister, 2);
  assert.equal(ROLE_LEVELS.DepartmentLeader, 2);
  assert.equal(ROLE_LEVELS.Volunteer, 1);
  assert.equal(ROLE_LEVELS.Member, 1);
  assert.equal(ROLE_LEVELS.Guest, 0);
});

test("isAppRole validates only known roles", () => {
  assert.ok(isAppRole("SuperAdmin"));
  assert.ok(isAppRole("Guest"));
  assert.ok(!isAppRole("SUPER ADMIN"));
  assert.ok(!isAppRole("Editor"));
  assert.ok(!isAppRole(""));
  assert.ok(!isAppRole(42));
  assert.ok(!isAppRole(null));
});

test("isAdminRole and isStaffRole", () => {
  assert.ok(isAdminRole("SuperAdmin"));
  assert.ok(isAdminRole("Admin"));
  assert.ok(!isAdminRole("Pastor"));
  assert.ok(!isAdminRole("Member"));
  assert.ok(isStaffRole("SuperAdmin"));
  assert.ok(isStaffRole("DepartmentLeader"));
  assert.ok(!isStaffRole("Volunteer"));
  assert.ok(!isStaffRole("Guest"));
});

test("canAssignRole: SuperAdmin can grant any role", () => {
  assert.ok(canAssignRole("SuperAdmin", "SuperAdmin"));
  assert.ok(canAssignRole("SuperAdmin", "Admin"));
  assert.ok(canAssignRole("SuperAdmin", "Member"));
});

test("canAssignRole: Admin can never grant SuperAdmin", () => {
  assert.ok(!canAssignRole("Admin", "SuperAdmin"));
  assert.ok(canAssignRole("Admin", "Admin"));
  assert.ok(canAssignRole("Admin", "Pastor"));
});

test("canAssignRole: lower roles cannot grant higher roles", () => {
  assert.ok(!canAssignRole("Pastor", "Admin"));
  assert.ok(!canAssignRole("Pastor", "SuperAdmin"));
  assert.ok(!canAssignRole("Member", "DepartmentLeader"));
  assert.ok(canAssignRole("Volunteer", "Member"));
  assert.ok(!canAssignRole("Guest", "Member"));
  assert.ok(canAssignRole("Guest", "Guest"));
});

test("canAssignRole: cannot modify a user who currently outranks you", () => {
  assert.ok(!canAssignRole("Admin", "Member", "SuperAdmin"));
  assert.ok(!canAssignRole("Admin", "Admin", "SuperAdmin"));
  assert.ok(canAssignRole("Admin", "Member", "Member"));
  assert.ok(canAssignRole("SuperAdmin", "Guest", "SuperAdmin"));
});

test("canAssignRole: invalid inputs rejected", () => {
  assert.ok(!canAssignRole("hacker", "Admin"));
  assert.ok(!canAssignRole("Admin", "Owner"));
  assert.ok(!canAssignRole(undefined, "Admin"));
  assert.ok(!canAssignRole("Admin", undefined));
  assert.ok(!canAssignRole("Admin", "Admin", "OWNER"));
});