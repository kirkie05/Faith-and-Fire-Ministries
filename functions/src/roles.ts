/**
 * Authoritative role model for Faith & Fire.
 *
 * Privilege hierarchy (higher wins):
 *   SuperAdmin (4) > Admin (3) > Pastor/Minister/DepartmentLeader (2) > Volunteer/Member (1) > Guest (0)
 *
 * The ONLY place roles may be granted is server-side (Cloud Functions) via
 * Firebase Auth custom claims. Clients can never supply a role.
 */

export const ALLOWED_ROLES = [
  "SuperAdmin",
  "Admin",
  "Pastor",
  "Minister",
  "DepartmentLeader",
  "Volunteer",
  "Member",
  "Guest",
] as const;

export type AppRole = (typeof ALLOWED_ROLES)[number];

export const ROLE_LEVELS: Record<AppRole, number> = {
  SuperAdmin: 4,
  Admin: 3,
  Pastor: 2,
  Minister: 2,
  DepartmentLeader: 2,
  Volunteer: 1,
  Member: 1,
  Guest: 0,
};

export const STAFF_ROLES: AppRole[] = ["SuperAdmin", "Admin", "Pastor", "Minister", "DepartmentLeader"];
export const ADMIN_ROLES: AppRole[] = ["SuperAdmin", "Admin"];

export function isAppRole(value: unknown): value is AppRole {
  return typeof value === "string" && (ALLOWED_ROLES as readonly string[]).includes(value);
}

export function isStaffRole(value: unknown): boolean {
  return typeof value === "string" && (STAFF_ROLES as readonly string[]).includes(value as AppRole);
}

export function isAdminRole(value: unknown): boolean {
  return typeof value === "string" && (ADMIN_ROLES as readonly string[]).includes(value as AppRole);
}

export function isSuperAdminRole(value: unknown): boolean {
  return value === "SuperAdmin";
}

/**
 * Returns true when `callerRole` may assign `targetRole` to a user whose current
 * role is `currentTargetRole`.
 *
 * Rules:
 *  - The caller must hold a recognized role.
 *  - The caller may never grant a role ranked higher than their own privilege
 *    level (an Admin can never grant SuperAdmin).
 *  - The caller may never modify the role of a user who currently outranks them.
 */
export function canAssignRole(
  callerRole: unknown,
  targetRole: unknown,
  currentTargetRole?: unknown
): boolean {
  if (!isAppRole(callerRole) || !isAppRole(targetRole)) return false;
  if (ROLE_LEVELS[targetRole] > ROLE_LEVELS[callerRole]) return false;
  // An unrecognized current role is ambiguous — deny rather than assume it is
  // low-ranked. This function never receives attacker-controlled current
  // roles (they come from Auth claims), but conservative is safer.
  if (currentTargetRole != null && (!isAppRole(currentTargetRole) || ROLE_LEVELS[currentTargetRole] > ROLE_LEVELS[callerRole])) {
    return false;
  }
  return true;
}
