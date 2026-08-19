/**
 * Role-policy decision logic for Faith & Fire.
 *
 * Pure, side-effect-free authorization rules used by the Cloud Function
 * handlers (setUserRole / createAdminInvite). Kept separate from the handlers
 * so every escalation scenario can be unit-tested without touching
 * firebase-admin.
 *
 * Custom claims (request.auth.token.role) are the ONLY source of truth for a
 * caller's privilege. Firestore user documents are never consulted for
 * authorization.
 */

import { AppRole, ALLOWED_ROLES, isAppRole, ROLE_LEVELS } from "./roles";

export type SetRoleDecision =
  | { allowed: true; reason: "ok" }
  | { allowed: false; reason: "no-auth" }
  | { allowed: false; reason: "unverified-email" }
  | { allowed: false; reason: "caller-role-missing-or-forged" }
  | { allowed: false; reason: "missing-target-uid" }
  | { allowed: false; reason: "self-promotion" }
  | { allowed: false; reason: "invalid-role" }
  | { allowed: false; reason: "target-exceeds-caller" }
  | { allowed: false; reason: "target-outranks-caller" }
  | { allowed: false; reason: "target-not-found" };

export interface SetRoleInput {
  callerUid: string | undefined;
  callerRole: unknown;
  callerEmailVerified: boolean;
  targetUid: unknown;
  requestedRole: unknown;
  targetCurrentRole: unknown;
  targetExists: boolean;
}

/**
 * Authorization gate for the setUserRole callable.
 *
 *  - the caller must be authenticated with a verified email and an Admin-level
 *    claim (SuperAdmin or Admin) — a forged/missing claim is denied;
 *  - a user can never change their own role;
 *  - the requested role must be a known role and may never exceed the
 *    caller's privilege level (an Admin can never grant SuperAdmin);
 *  - the caller may never modify the role of a user who currently outranks
 *    them;
 *  - the target must exist.
 */
export function evaluateSetRole(input: SetRoleInput): SetRoleDecision {
  if (!input.callerUid) return { allowed: false, reason: "no-auth" };
  if (input.callerEmailVerified !== true) return { allowed: false, reason: "unverified-email" };
  if (!isAppRole(input.callerRole)) return { allowed: false, reason: "caller-role-missing-or-forged" };
  // Role changes are an Admin-level privilege. A lower (staff/member) claim
  // can never invoke this path.
  if (ROLE_LEVELS[input.callerRole] < ROLE_LEVELS.Admin) return { allowed: false, reason: "caller-role-missing-or-forged" };
  if (typeof input.targetUid !== "string" || !input.targetUid) {
    return { allowed: false, reason: "missing-target-uid" };
  }
  if (input.targetUid === input.callerUid) return { allowed: false, reason: "self-promotion" };
  if (typeof input.requestedRole !== "string" || !ALLOWED_ROLES.includes(input.requestedRole as AppRole)) {
    return { allowed: false, reason: "invalid-role" };
  }
  if (!input.targetExists) return { allowed: false, reason: "target-not-found" };
  if (ROLE_LEVELS[input.requestedRole as AppRole] > ROLE_LEVELS[input.callerRole as AppRole]) {
    return { allowed: false, reason: "target-exceeds-caller" };
  }
  if (
    input.targetCurrentRole != null &&
    (!isAppRole(input.targetCurrentRole) || ROLE_LEVELS[input.targetCurrentRole] > ROLE_LEVELS[input.callerRole as AppRole])
  ) {
    return { allowed: false, reason: "target-outranks-caller" };
  }
  return { allowed: true, reason: "ok" };
}

export type CreateInviteDecision =
  | { allowed: true; reason: "ok" }
  | { allowed: false; reason: "no-auth" }
  | { allowed: false; reason: "unverified-email" }
  | { allowed: false; reason: "caller-role-missing-or-forged" }
  | { allowed: false; reason: "invalid-email" }
  | { allowed: false; reason: "invalid-role" }
  | { allowed: false; reason: "target-exceeds-caller" };

export interface CreateInviteInput {
  callerUid: string | undefined;
  callerRole: unknown;
  callerEmailVerified: boolean;
  email: string;
  requestedRole: unknown;
}

/**
 * Authorization gate for the createAdminInvite callable.
 *
 *  - the caller must be a verified Admin-level user;
 *  - the invite role must be a known role and may never exceed the caller's
 *    privilege level (an Admin can never invite a SuperAdmin);
 *  - only a SuperAdmin can therefore create SuperAdmin invitations.
 */
export function evaluateCreateInvite(input: CreateInviteInput): CreateInviteDecision {
  if (!input.callerUid) return { allowed: false, reason: "no-auth" };
  if (input.callerEmailVerified !== true) return { allowed: false, reason: "unverified-email" };
  if (!isAppRole(input.callerRole)) return { allowed: false, reason: "caller-role-missing-or-forged" };
  // Invites are an Admin-level privilege. A lower (staff/member) claim can
  // never invoke this path.
  if (ROLE_LEVELS[input.callerRole] < ROLE_LEVELS.Admin) return { allowed: false, reason: "caller-role-missing-or-forged" };
  if (!input.email || !input.email.includes("@") || input.email.length > 150) {
    return { allowed: false, reason: "invalid-email" };
  }
  if (typeof input.requestedRole !== "string" || !ALLOWED_ROLES.includes(input.requestedRole as AppRole)) {
    return { allowed: false, reason: "invalid-role" };
  }
  if (ROLE_LEVELS[input.requestedRole as AppRole] > ROLE_LEVELS[input.callerRole as AppRole]) {
    return { allowed: false, reason: "target-exceeds-caller" };
  }
  return { allowed: true, reason: "ok" };
}