import { CallableRequest, HttpsError, onCall, onRequest } from "firebase-functions/v2/https";
import { onDocumentCreated, onDocumentWritten } from "firebase-functions/v2/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { logger } from "firebase-functions/v2";
import * as admin from "firebase-admin";
import { recordNotification } from "./notifications";
import {
  AppRole,
  ALLOWED_ROLES,
  isAppRole,
  isStaffRole,
  isAdminRole
} from "./roles";
import { sanitizeRedirectUrl } from "./redirect-policy";
import { processPayFastItn, ItnDb, buildPayFastSignature } from "./payfast-core";
import { evaluateSetRole, evaluateCreateInvite, SetRoleDecision, CreateInviteDecision } from "./role-policy";
import { processMemberCheckIn, processGuestCheckIn, resolveMember, verifyMemberPinHash, hashMemberPin, isValidPin, CheckinError, pinAttemptAllowed, clearPinAttempts } from "./checkin-core";
import * as seedSettings from "./seed-settings.json";

admin.initializeApp();
const db = admin.firestore();

function getCallerRole(request: CallableRequest): AppRole | null {
  const raw = request.auth?.token?.role;
  return isAppRole(raw) ? raw : null;
}

function requireVerifiedAdmin(request: CallableRequest): AppRole {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Authentication required.");
  }
  if (request.auth.token.email_verified !== true) {
    throw new HttpsError("permission-denied", "A verified email address is required for this action.");
  }
  const role = getCallerRole(request);
  if (!role || !isAdminRole(role)) {
    throw new HttpsError("permission-denied", "Admin privileges are required.");
  }
  return role;
}

async function writeAudit(entry: Record<string, unknown>): Promise<void> {
  await db.collection("auditLogs").add({
    ...entry,
    timestamp: admin.firestore.FieldValue.serverTimestamp()
  });
}

/**
 * PayFast credentials are read from the admin-protected settings document
 * (settings/payfast_credentials) with a fallback to environment variables.
 * They are never exposed to browsers.
 */
interface PayFastCredentials {
  merchantId: string;
  merchantKey: string;
  passphrase: string;
  sandbox: boolean;
  notifyUrl: string;
}

async function getPayFastCredentials(): Promise<PayFastCredentials> {
  try {
    const snap = await db.collection("settings").doc("payfast_credentials").get();
    if (snap.exists) {
      const d = snap.data() || {};
      if (d.merchantId && d.merchantKey) {
        return {
          merchantId: String(d.merchantId),
          merchantKey: String(d.merchantKey),
          passphrase: d.passphrase ? String(d.passphrase) : "",
          sandbox: d.sandbox !== false,
          notifyUrl: typeof d.notifyUrl === "string" && d.notifyUrl ? d.notifyUrl : (process.env.PAYFAST_ITN_URL || "")
        };
      }
    }
  } catch (err) {
    logger.warn("payfast_credentials doc unavailable, falling back to env", err);
  }
  return {
    merchantId: process.env.PAYFAST_MERCHANT_ID || "",
    merchantKey: process.env.PAYFAST_MERCHANT_KEY || "",
    passphrase: process.env.PAYFAST_PASSPHRASE || "",
    sandbox: process.env.PAYFAST_SANDBOX !== "false",
    notifyUrl: process.env.PAYFAST_ITN_URL || ""
  };
}

/**
 * 1. SET USER ROLE & CUSTOM CLAIMS (Privileged Cloud Function)
 *    This is the ONLY sanctioned path for role changes.
 *
 * Hardening:
 *  - caller must be a verified Admin or SuperAdmin;
 *  - a user can never change their own role (no self-promotion);
 *  - the target role can never exceed the caller's privilege level;
 *  - the caller can never modify the role of a user who currently outranks them.
 */
export const setUserRole = onCall(async (request: CallableRequest<{ targetUid?: unknown; role?: unknown }>) => {
  const callerUid = request.auth?.uid;

  const targetUid = request.data?.targetUid;
  const role = request.data?.role;

  let currentRole: AppRole | null = null;
  let targetEmail = "";
  let targetExists = false;
  if (typeof targetUid === "string" && targetUid) {
    try {
      const targetUser = await admin.auth().getUser(targetUid);
      currentRole = isAppRole(targetUser.customClaims?.role) ? targetUser.customClaims?.role : null;
      targetEmail = targetUser.email || "";
      targetExists = true;
    } catch {
      targetExists = false;
    }
  }

  const decision = evaluateSetRole({
    callerUid,
    callerRole: getCallerRole(request),
    callerEmailVerified: request.auth?.token?.email_verified === true,
    targetUid,
    requestedRole: role,
    targetCurrentRole: currentRole,
    targetExists
  });

  if (!decision.allowed) {
    const messages: Partial<Record<SetRoleDecision["reason"], string>> = {
      "no-auth": "Authentication required.",
      "unverified-email": "A verified email address is required for this action.",
      "caller-role-missing-or-forged": "Admin privileges are required. Roles come from verified server-assigned claims only.",
      "missing-target-uid": "targetUid is required.",
      "self-promotion": "You cannot change your own role.",
      "invalid-role": "Invalid role specified.",
      "target-exceeds-caller": "You may not assign a role higher than your own.",
      "target-outranks-caller": "You may not modify the role of a user who outranks you.",
      "target-not-found": "Target user does not exist."
    };
    const code = decision.reason === "no-auth" ? "unauthenticated"
      : decision.reason === "target-not-found" ? "not-found"
      : decision.reason === "invalid-role" || decision.reason === "missing-target-uid" ? "invalid-argument"
      : "permission-denied";
    throw new HttpsError(code, messages[decision.reason] || "Access denied.");
  }

  const assignedRole = role as AppRole;

  await admin.auth().setCustomUserClaims(targetUid as string, { role: assignedRole });

  await db.collection("users").doc(targetUid as string).set({
    role: assignedRole,
    email: targetEmail,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  await writeAudit({
    action: "ASSIGN_ROLE_CLAIM",
    resource: `users/${targetUid}`,
    userId: callerUid,
    roleAssigned: assignedRole,
    previousRole: currentRole,
    status: "SUCCESS"
  });

  return { success: true, message: `Role ${assignedRole} assigned to user ${targetUid}` };
});

/**
 * 1a. CREATE ADMIN INVITE (Privileged Cloud Function)
 *     Admins invite staff by email through this callable. The role granted is
 *     capped by the inviter's privilege level (an Admin can never invite a
 *     SuperAdmin). Invites live in admin_invites/{email}; clients may not
 *     write to that collection at all (see firestore.rules).
 */
export const createAdminInvite = onCall(async (request: CallableRequest<{ email?: unknown; role?: unknown }>) => {
  const callerUid = request.auth?.uid;

  const email = typeof request.data?.email === "string" ? request.data.email.trim().toLowerCase() : "";
  const requestedRole: unknown = typeof request.data?.role === "string" && ALLOWED_ROLES.includes(request.data.role as AppRole)
    ? (request.data.role as AppRole)
    : "Admin";

  const decision = evaluateCreateInvite({
    callerUid,
    callerRole: getCallerRole(request),
    callerEmailVerified: request.auth?.token?.email_verified === true,
    email,
    requestedRole
  });

if (!decision.allowed) {
    const messages: Partial<Record<CreateInviteDecision["reason"], string>> = {
      "no-auth": "Authentication required.",
      "unverified-email": "A verified email address is required for this action.",
      "caller-role-missing-or-forged": "Admin privileges are required. Roles come from verified server-assigned claims only.",
      "invalid-email": "A valid email address is required.",
      "invalid-role": "Invalid role specified.",
      "target-exceeds-caller": "You may not invite a user with a role higher than your own."
    };
    const code = decision.reason === "no-auth" ? "unauthenticated"
      : decision.reason === "invalid-email" || decision.reason === "invalid-role" ? "invalid-argument"
      : "permission-denied";
    if (callerUid) {
      await writeAudit({
        action: "CREATE_ADMIN_INVITE",
        resource: `admin_invites/${email || "(no-email)"}`,
        userId: callerUid,
        detail: `Denied: ${decision.reason}`,
        status: "DENIED"
      });
    }
    throw new HttpsError(code, messages[decision.reason] || "Access denied.");
  }

  await db.collection("admin_invites").doc(email).set({
    role: requestedRole,
    invitedBy: callerUid,
    invitedAt: admin.firestore.FieldValue.serverTimestamp(),
    redeemed: false
  });

  await writeAudit({
    action: "CREATE_ADMIN_INVITE",
    resource: `admin_invites/${email}`,
    userId: callerUid,
    roleAssigned: requestedRole,
    status: "SUCCESS"
  });

  return { success: true, message: `Invite created for ${email} (${requestedRole}).` };
});

/**
 * 1b. REDEEM ADMIN INVITE (server-side role assignment)
 *     The invited user (matching the invite email) redeems it here so the role
 *     is applied via custom claims — never client-side. Requires a verified
 *     email address.
 */
export const redeemAdminInvite = onCall(async (request: CallableRequest) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Authentication required.");
  }
  if (request.auth.token.email_verified !== true) {
    throw new HttpsError("permission-denied", "Verify your email address before redeeming an invite.");
  }

  const uid = request.auth.uid;
  const email = ((request.auth.token.email || "") as string).toLowerCase();
  if (!email) {
    throw new HttpsError("failed-precondition", "Account has no email address.");
  }

  const inviteRef = db.collection("admin_invites").doc(email);
  const invite = await inviteRef.get();
  if (!invite.exists) {
    await writeAudit({
      action: "REDEEM_ADMIN_INVITE",
      resource: `admin_invites/${email}`,
      userId: uid,
      detail: "Denied: no invite exists for this email.",
      status: "DENIED"
    });
    throw new HttpsError("permission-denied", "No admin invite exists for this email.");
  }

  const inviteData = invite.data() || {};
  if (inviteData.redeemed) {
    await writeAudit({
      action: "REDEEM_ADMIN_INVITE",
      resource: `admin_invites/${email}`,
      userId: uid,
      detail: "Denied: invite already redeemed.",
      status: "DENIED"
    });
    throw new HttpsError("failed-precondition", "This invite has already been redeemed.");
  }

  // Legacy invites written before the callable-only policy may contain
  // display labels ("EDITOR", "MEDIA", "SUPER ADMIN"). Those are capped at
  // Admin — a legacy invite can NEVER grant SuperAdmin. The only way to
  // create a SuperAdmin invite today is via createAdminInvite as a
  // SuperAdmin, and the server-side role policy enforces that.
  const legacyRoleMap: Record<string, AppRole> = {
    "SUPER ADMIN": "Admin",
    EDITOR: "Admin",
    MEDIA: "Admin",
    ADMIN: "Admin"
  };
  const role: AppRole = isAppRole(inviteData.role)
    ? inviteData.role
    : (legacyRoleMap[String(inviteData.role)] || "Admin");

  // Role is derived only from isAppRole / legacyRoleMap above; a legacy
  // invite label can never resolve to SuperAdmin, and modern invites are
  // capped server-side by createAdminInvite at creation time.
  await admin.auth().setCustomUserClaims(uid, { role });
  await db.collection("users").doc(uid).set({
    role,
    email,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });
  await inviteRef.update({
    redeemed: true,
    redeemedBy: uid,
    redeemedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  await writeAudit({
    action: "REDEEM_ADMIN_INVITE",
    resource: `admin_invites/${email}`,
    userId: uid,
    roleAssigned: role,
    status: "SUCCESS"
  });

  return { success: true, role };
});

/**
 * 1c. BOOTSTRAP SUPERADMIN (first-run only)
 *     Allows the FIRST verified user of a brand-new installation to become
 *     SuperAdmin. Succeeds only while no user in the project holds a
 *     SuperAdmin claim, so it can never be used to escalate an existing
 *     installation. This mirrors the standard "first admin" bootstrap pattern.
 */
export const bootstrapSuperAdmin = onCall(async (request: CallableRequest) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Authentication required.");
  }
  if (request.auth.token.email_verified !== true) {
    throw new HttpsError("permission-denied", "A verified email address is required.");
  }
  const uid = request.auth.uid;
  const email = String(request.auth.token.email || "").toLowerCase();

  let pageToken: string | undefined;
  let existingSuperAdmin = false;
  do {
    const page = await admin.auth().listUsers(1000, pageToken);
    existingSuperAdmin = page.users.some((u) => u.customClaims?.role === "SuperAdmin");
    pageToken = page.pageToken;
  } while (pageToken && !existingSuperAdmin);

  if (existingSuperAdmin) {
    throw new HttpsError("failed-precondition", "Bootstrap already completed. A SuperAdmin exists.");
  }

  // Atomic bootstrap claim. The marker document serializes concurrent
  // bootstraps: only the caller that creates it may proceed, so two
  // verified users racing on a fresh installation cannot both escalate.
  // If the claim succeeds but the follow-up fails, the marker is rolled
  // back so the installation can be bootstrapped again.
  const markerRef = db.collection("_bootstrap").doc("superadmin");
  try {
    await markerRef.create({
      uid,
      email,
      claimedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  } catch (err: unknown) {
    if ((err as { code?: string })?.code === "already-exists") {
      throw new HttpsError("failed-precondition", "Bootstrap already completed. A SuperAdmin exists.");
    }
    throw err;
  }

  try {
    await admin.auth().setCustomUserClaims(uid, { role: "SuperAdmin" });
  } catch (err) {
    await markerRef.delete().catch(() => undefined);
    throw err;
  }
  await db.collection("users").doc(uid).set({
    role: "SuperAdmin",
    email,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  await writeAudit({
    action: "BOOTSTRAP_SUPERADMIN",
    resource: `users/${uid}`,
    userId: uid,
    roleAssigned: "SuperAdmin",
    status: "SUCCESS"
  });

  return { success: true, role: "SuperAdmin" };
});

/**
 * 2. PAYFAST ONLINE GIVING (server-side signature generation)
 *     Credentials never reach the browser. A PENDING transaction is recorded
 *     and only the verified ITN webhook can mark it SUCCESS. Redirect URLs are
 *     restricted to app-owned origins (open-redirect protection).
 */
export const createPayFastPayment = onCall(async (request: CallableRequest<Record<string, unknown>>) => {
  const amount = Number(request.data?.amount);
  if (!isFinite(amount) || amount <= 0 || amount > 1000000) {
    throw new HttpsError("invalid-argument", "A valid amount is required.");
  }
  const firstName = typeof request.data?.firstName === "string" ? request.data.firstName.trim() : "";
  const lastName = typeof request.data?.lastName === "string" ? request.data.lastName.trim() : "";
  const email = typeof request.data?.email === "string" ? request.data.email.trim() : "";
  if (!firstName || firstName.length > 100) {
    throw new HttpsError("invalid-argument", "A valid first name is required.");
  }
  if (!email || !email.includes("@") || email.length > 150) {
    throw new HttpsError("invalid-argument", "A valid email address is required.");
  }
  const fund = typeof request.data?.fund === "string" && request.data.fund.trim() ? request.data.fund.trim().slice(0, 100) : "Tithes & Offerings";
  const type = request.data?.type === "Recurring" ? "Recurring" : "One-off";
  const returnUrl = sanitizeRedirectUrl(
    typeof request.data?.returnUrl === "string" && request.data.returnUrl ? request.data.returnUrl : null
  );
  const cancelUrl = sanitizeRedirectUrl(
    typeof request.data?.cancelUrl === "string" && request.data.cancelUrl ? request.data.cancelUrl : returnUrl
  );

  const creds = await getPayFastCredentials();
  if (!creds.merchantId || !creds.merchantKey) {
    throw new HttpsError("failed-precondition", "Online giving is not configured yet.");
  }

  const uid = request.auth?.uid || null;
  const mPaymentId = `DON-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

  const pfData: Record<string, string> = {
    merchant_id: creds.merchantId,
    return_url: returnUrl,
    cancel_url: cancelUrl,
    name_first: firstName,
    name_last: lastName,
    email_address: email,
    m_payment_id: mPaymentId,
    amount: amount.toFixed(2),
    item_name: `Seed: ${fund}`,
    item_description: `Faith & Fire Ministries Online Giving - ${type}`
  };
  if (creds.notifyUrl) {
    pfData.notify_url = creds.notifyUrl;
  }
  pfData.signature = buildPayFastSignature(pfData, creds.passphrase);

  await db.collection("transactions").doc(mPaymentId).set({
    userUid: uid,
    amount,
    fund,
    firstName,
    lastName,
    email,
    type,
    status: "PENDING",
    gateway: "payfast",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  await writeAudit({
    action: "PAYMENT_INITIATED",
    resource: `transactions/${mPaymentId}`,
    userId: uid || "guest",
    detail: `Amount: ${amount.toFixed(2)} ${type} — ${fund}`,
    status: "PENDING"
  });

  const postUrl = creds.sandbox
    ? "https://sandbox.payfast.co.za/eng/process"
    : "https://www.payfast.co.za/eng/process";

  return { success: true, transactionId: mPaymentId, postUrl, formData: pfData };
});

/**
 * 3. PAYFAST ITN WEBHOOK
 *     Delegates to the testable payfast-core processor. Idempotent: a
 *     transaction that is no longer PENDING is acknowledged but never
 *     re-processed, so duplicate ITN callbacks cannot double-credit a
 *     donation. The donations document id equals the transaction id, making
 *     double-crediting structurally impossible.
 */
export const payfastItn = onRequest(async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).send("Method Not Allowed");
    return;
  }
  try {
    const creds = await getPayFastCredentials();
    const result = await processPayFastItn(
      db as unknown as ItnDb,
      (req.body || {}) as Record<string, unknown>,
      { merchantId: creds.merchantId, passphrase: creds.passphrase }
    );
    if (result.duplicate) {
      logger.info("Duplicate PayFast ITN acknowledged", { m_payment_id: req.body?.m_payment_id });
    }
    res.status(result.code).send(result.body);
  } catch (err) {
    logger.error("PayFast ITN handler error:", err);
    res.status(500).send("Error");
  }
});

/**
 * 3.5 RECORD OFFLINE / SELF-REPORTED GIVING (server-side)
 *     Members may record a self-reported offline donation. The record is
 *     server-stamped with status PENDING (never SUCCESS — only the PayFast
 *     ITN webhook can mark a donation SUCCESS). The caller must be a
 *     verified user linked to the donation email or a staff member, and the
 *     submission is rate-limited per user.
 */
export const recordOfflineDonation = onCall(async (request: CallableRequest<{ amount?: unknown; fund?: unknown; email?: unknown; firstName?: unknown; lastName?: unknown }>) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Authentication required.");
  }
  if (request.auth.token.email_verified !== true) {
    throw new HttpsError("permission-denied", "A verified email address is required for this action.");
  }
  const uid = request.auth.uid;

  const amount = Number(request.data?.amount);
  if (!isFinite(amount) || amount <= 0 || amount > 1000000) {
    throw new HttpsError("invalid-argument", "A valid amount is required.");
  }
  const fund = typeof request.data?.fund === "string" && request.data.fund.trim() ? request.data.fund.trim().slice(0, 100) : "Tithes & Offerings";
  const email = typeof request.data?.email === "string" ? request.data.email.trim().toLowerCase() : "";
  const firstName = typeof request.data?.firstName === "string" ? request.data.firstName.trim().slice(0, 100) : "";
  const lastName = typeof request.data?.lastName === "string" ? request.data.lastName.trim().slice(0, 100) : "";
  if (!email || !email.includes("@") || email.length > 150) {
    throw new HttpsError("invalid-argument", "A valid email address is required.");
  }

  const callerEmail = String(request.auth.token.email || "").toLowerCase();
  const callerIsStaff = isStaffRole(getCallerRole(request));
  if (!callerIsStaff && email !== callerEmail) {
    throw new HttpsError("permission-denied", "You may only record giving for your own account.");
  }

  const recentSnap = await db.collection("donations")
    .where("ownerId", "==", uid)
    .where("createdAt", ">", admin.firestore.Timestamp.fromMillis(Date.now() - 60000))
    .get();
  if (recentSnap.size >= 5) {
    throw new HttpsError("resource-exhausted", "Too many records. Please wait a minute before trying again.");
  }

  const docRef = await db.collection("donations").add({
    amount,
    fund,
    firstName,
    lastName,
    email,
    type: "One-off",
    status: "PENDING",
    gateway: "manual",
    transactionId: null,
    ownerId: uid,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  await writeAudit({
    action: "RECORD_OFFLINE_DONATION",
    resource: `donations/${docRef.id}`,
    userId: uid,
    status: "SUCCESS"
  });

  return { success: true, donationId: docRef.id };
});

/**
 * 4. RECORD ATTENDANCE (server-side)
 *     The member's name/email are stamped from the members document by the
 *     server — clients can never spoof attendance records. Allowed for:
 *      - any verified staff member;
 *      - the linked member themselves (member.ownerId or member.email
 *        matching the authenticated account);
 *      - an anonymous kiosk that proves the member's PIN (verified
 *        server-side against the member record — the client PIN is never
 *        trusted).
 */
export const recordAttendance = onCall(async (request: CallableRequest<{ identifier?: unknown; serviceName?: unknown; pin?: unknown }>) => {
  const caller = {
    uid: request.auth?.uid || null,
    role: getCallerRole(request),
    email: request.auth?.token?.email ? String(request.auth.token.email) : null
  };
  try {
    const result = await processMemberCheckIn(db, {
      identifier: typeof request.data?.identifier === "string" ? request.data.identifier : "",
      serviceName: typeof request.data?.serviceName === "string" ? request.data.serviceName : "",
      pin: typeof request.data?.pin === "string" ? request.data.pin : ""
    }, caller);
    await writeAudit({
      action: "MEMBER_CHECKIN",
      resource: `attendance/${result.attendanceId}`,
      userId: caller.uid || "kiosk-anonymous",
      detail: `Service: ${typeof request.data?.serviceName === "string" ? request.data.serviceName.slice(0, 100) : ""}`,
      status: "SUCCESS"
    });
    return result;
  } catch (err) {
    if (err instanceof CheckinError) {
      throw new HttpsError(err.code, err.message);
    }
    throw err;
  }
});

/**
 * 5. GUEST CHECK-IN (server-side, anonymous callers allowed)
 *     Creates the visitor record AND the attendance record server-side with
 *     server-stamped fields. Basic rate limiting per email address prevents
 *     abuse of the public form.
 */
export const guestCheckIn = onCall(async (request: CallableRequest<Record<string, unknown>>) => {
  try {
    const result = await processGuestCheckIn(db, {
      name: typeof request.data?.name === "string" ? request.data.name : "",
      email: typeof request.data?.email === "string" ? request.data.email : "",
      phone: typeof request.data?.phone === "string" ? request.data.phone : "",
      serviceName: typeof request.data?.serviceName === "string" ? request.data.serviceName : ""
    });
    await writeAudit({
      action: "GUEST_CHECKIN",
      resource: `visitors/${result.visitorId}`,
      userId: "guest",
      detail: `${String(request.data?.name || "").trim()} checked in via the guest registration form.`,
      status: "SUCCESS"
    });
    return result;
  } catch (err) {
    if (err instanceof CheckinError) {
      throw new HttpsError(err.code, err.message);
    }
    throw err;
  }
});

/**
 * 6. SEED INITIAL DATA (Privileged Cloud Function)
 *     Writes the server-owned settings documents from the shared seed file.
 *     Idempotent and non-destructive: existing documents are never touched.
 *     This replaces all client-side seeding of server-managed settings.
 */
export const seedInitialData = onCall(async (request: CallableRequest) => {
  requireVerifiedAdmin(request);
  const callerUid = request.auth!.uid;

  const settingsDocs: Record<string, unknown> = {
    church_info: seedSettings.church_info,
    website_settings: seedSettings.website_settings,
    homepage_hero: seedSettings.homepage_hero,
    pages_data: seedSettings.pages_data,
    banking_details: seedSettings.banking_details,
    youtube_channels: seedSettings.youtube_channels
  };

  const created: string[] = [];
  const skipped: string[] = [];
  for (const [docId, payload] of Object.entries(settingsDocs)) {
    const ref = db.collection("settings").doc(docId);
    const existing = await ref.get();
    if (existing.exists) {
      skipped.push(docId);
      continue;
    }
    await ref.set({
      ...(payload as Record<string, unknown>),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: callerUid
    });
    created.push(docId);
  }

  await writeAudit({
    action: "SEED_INITIAL_DATA",
    resource: "settings",
    userId: callerUid,
    detail: `Created: [${created.join(", ")}] Skipped: [${skipped.join(", ")}]`,
    status: "SUCCESS"
  });

  return { success: true, created, skipped };
});

/**
 * 7. AUDIT LOGGING (Privileged Cloud Function)
 *     The only sanctioned path for client-triggered audit entries. The caller
 *     identity is stamped server-side; clients can never forge another user's
 *     audit trail. Clients have no write access to auditLogs (firestore.rules).
 *     Restricted to admins, and only a fixed server-defined action set and a
 *     collection/doc resource shape are accepted.
 */
const AUDIT_ACTIONS = new Set([
  "MEMBER_CONTACTED",
  "MEMBER_UPDATED",
  "FOLLOWUP_CREATED",
  "FOLLOWUP_COMPLETED",
  "CARE_CASE_UPDATED",
  "CARE_VISIT_LOGGED",
  "DATA_EXPORTED",
  "SETTINGS_UPDATED",
  "CONTENT_PUBLISHED",
  "MESSAGE_SENT"
]);

const AUDIT_RESOURCE_PATTERN = /^[a-z][a-z0-9_]*\/[A-Za-z0-9._:+/=-]{1,200}$/;

export const logAuditAction = onCall(async (request: CallableRequest<{ action?: unknown; resource?: unknown; detail?: unknown }>) => {
  requireVerifiedAdmin(request);
  const callerUid = request.auth!.uid;

  const action = typeof request.data?.action === "string" ? request.data.action.trim() : "";
  const resource = typeof request.data?.resource === "string" ? request.data.resource.trim() : "";
  const detail = typeof request.data?.detail === "string" ? request.data.detail.trim().slice(0, 1000) : "";
  if (!AUDIT_ACTIONS.has(action)) {
    throw new HttpsError("invalid-argument", "Unknown audit action.");
  }
  if (!AUDIT_RESOURCE_PATTERN.test(resource)) {
    throw new HttpsError("invalid-argument", "resource must be a collection/docId path.");
  }

  await writeAudit({
    action,
    resource,
    userId: callerUid,
    detail,
    status: "SUCCESS"
  });

  return { success: true };
});

/**
 * 8. ADMIN SEND PASSWORD RESET (Privileged Cloud Function)
 *     Admins can generate a password-reset link for a member account without
 *     exposing the member identity flow. The link is returned to the admin
 *     to relay privately.
 */
export const adminSendPasswordReset = onCall(async (request: CallableRequest<{ email?: unknown }>) => {
  requireVerifiedAdmin(request);
  const callerUid = request.auth!.uid;

  const email = typeof request.data?.email === "string" ? request.data.email.trim().toLowerCase() : "";
  if (!email || !email.includes("@") || email.length > 150) {
    throw new HttpsError("invalid-argument", "A valid email address is required.");
  }

  let link: string;
  try {
    link = await admin.auth().generatePasswordResetLink(email);
  } catch {
    throw new HttpsError("not-found", "No account exists for this email address.");
  }

  await writeAudit({
    action: "PASSWORD_RESET_LINK",
    resource: `users/${email}`,
    userId: callerUid,
    status: "SUCCESS"
  });

  return { success: true, link };
});

/**
 * 8b. SET MEMBER SECURITY PIN (server-side)
 *     Stores only the SHA-256 hash of the PIN in the staff-only memberPins
 *     collection. The plaintext PIN is never written to a member record and
 *     is never returned to the client. Callers must be staff or linked to
 *     the member (owner or matching verified email).
 */
export const setMemberPin = onCall(async (request: CallableRequest<{ memberId?: unknown; pin?: unknown }>) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Authentication required.");
  }
  if (request.auth.token.email_verified !== true) {
    throw new HttpsError("permission-denied", "A verified email address is required for this action.");
  }
  const uid = request.auth.uid;
  const memberId = typeof request.data?.memberId === "string" ? request.data.memberId.trim() : "";
  const pin = typeof request.data?.pin === "string" ? request.data.pin.trim() : "";
  if (!memberId || memberId.length > 128) {
    throw new HttpsError("invalid-argument", "A member id is required.");
  }
  if (!isValidPin(pin)) {
    throw new HttpsError("invalid-argument", "The PIN must be 4 to 10 digits.");
  }

  const memberSnap = await db.collection("members").doc(memberId).get();
  const member = memberSnap.exists ? memberSnap.data() || {} : {};
  const callerIsStaff = isStaffRole(getCallerRole(request));
  const callerEmail = String(request.auth.token.email || "").toLowerCase();
  const linkedByOwner = member.ownerId === uid;
  const linkedByEmail = typeof member.email === "string" && member.email.toLowerCase() === callerEmail;

  // Pending members (application not yet approved) may register their PIN
  // against the application record — the applicant is linked via createdBy
  // or ownerId. This lets self-registered members unlock their dashboard
  // with the PIN shown at signup before staff approve the application.
  let applicationLinked = false;
  if (!memberSnap.exists) {
    const appSnap = await db.collection("memberApplications").doc(memberId).get();
    if (appSnap.exists) {
      const app = appSnap.data() || {};
      applicationLinked = app.createdBy === uid || app.ownerId === uid;
    }
  }

  if (!callerIsStaff && !linkedByOwner && !linkedByEmail && !applicationLinked) {
    throw new HttpsError("permission-denied", "You may only set the PIN for your own member record.");
  }

  await db.collection("memberPins").doc(memberId).set({
    pinHash: hashMemberPin(pin, memberId),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  await writeAudit({
    action: "SET_MEMBER_PIN",
    resource: `members/${memberId}`,
    userId: uid,
    status: "SUCCESS"
  });

  return { success: true, memberId };
});

/**
 * 8c. VERIFY MEMBER SECURITY PIN (server-side)
 *     Used by the member dashboard unlock gate. The identifier is resolved
 *     server-side and the PIN is compared against the hashed memberPins
 *     document. Brute force is throttled to 5 attempts per member per
 *     minute using an atomic transaction counter.
 */
export const verifyMemberPin = onCall(async (request: CallableRequest<{ identifier?: unknown; pin?: unknown }>) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Authentication required.");
  }
  const identifier = typeof request.data?.identifier === "string" ? request.data.identifier : "";
  const pin = typeof request.data?.pin === "string" ? request.data.pin : "";
  if (!identifier.trim() || !pin.trim()) {
    throw new HttpsError("invalid-argument", "Member identifier and Security PIN are required.");
  }

  const resolved = await resolveMember(db, identifier);
  if (!resolved) {
    throw new HttpsError("not-found", "Member profile not found. Please check your details or register a new profile.");
  }
  const { memberId } = resolved;

  // Brute-force throttle (shared with the anonymous kiosk path in
  // checkin-core): at most 5 PIN attempts per member per minute, tracked
  // atomically in memberPinAttempts.
  if (!(await pinAttemptAllowed(db, memberId))) {
    await writeAudit({
      action: "PIN_VERIFY_FAILURE",
      resource: `memberPinAttempts/${memberId}`,
      userId: request.auth.uid,
      detail: "Rate limit exceeded (5 attempts per minute).",
      status: "DENIED"
    });
    throw new HttpsError("resource-exhausted", "Too many PIN attempts. Please wait a minute and try again.");
  }

  if (!(await verifyMemberPinHash(db, memberId, pin))) {
    await writeAudit({
      action: "PIN_VERIFY_FAILURE",
      resource: `members/${memberId}`,
      userId: request.auth.uid,
      status: "DENIED"
    });
    throw new HttpsError("permission-denied", "Incorrect Security PIN. If you have never set one, use the PIN shown when your profile was created.");
  }

  await clearPinAttempts(db, memberId);

  await writeAudit({
    action: "PIN_VERIFY_SUCCESS",
    resource: `members/${memberId}`,
    userId: request.auth.uid,
    status: "SUCCESS"
  });

  return { success: true, memberId };
});
// ============ PART2: triggers ============

/**
 * A visitor card creates a staff-owned follow-up record and attempts the
 * configured welcome notification channels. Unconfigured channels are logged
 * as such; they are never reported to staff as sent.
 */
export const onVisitorCreated = onDocumentCreated("visitors/{visitorId}", async (event) => {
  const snap = event.data;
  if (!snap) return;
  const visitor = snap.data();
  const visitorId = event.params.visitorId;
  await db.collection("followUps").doc(visitorId).set({
    visitorId,
    personName: visitor.name,
    email: visitor.email || null,
    phone: visitor.phone || null,
    status: "New",
    assignedWorkerId: null,
    notes: [],
    lastContactAt: null,
    nextFollowUpAt: null,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  const sequenceDays = [0, 1, 3, 7, 14, 30];
  const sequenceMessages = [
    "Thank you for worshipping with us.",
    "How was your experience?",
    "We would love to get to know you.",
    "Here are some ways to get connected.",
    "Have you joined us again?",
    "Can we help you take your next step?"
  ];
  const batch = db.batch();
  sequenceDays.forEach((daysAfterVisit, index) => {
    const dueAt = new Date(Date.now() + daysAfterVisit * 24 * 60 * 60 * 1000);
    batch.set(db.collection("followUpTasks").doc(), {
      visitorId,
      personName: visitor.name,
      channel: visitor.preferredContactMethod || "Email",
      message: sequenceMessages[index],
      sequenceDay: daysAfterVisit,
      status: "Pending",
      dueAt,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
  });
  await batch.commit();
  if (visitor.email) {
    await recordNotification({
      channel: "email",
      recipient: visitor.email,
      template: "visitor-welcome",
      relatedId: visitorId,
      payload: { name: visitor.name, churchName: "Faith & Fire Ministries" }
    });
  }
});

/**
 * 8b. WRITE-AUDIT TRIGGER (M5)
 *     Every client-facing collection write (create/update/delete) is recorded
 *     into the append-only auditLogs collection by the server. Server-owned
 *     collections and callable-audited paths are excluded to avoid noise:
 *       - auditLogs            (would self-trigger)
 *       - users                (self-provision + role writes already audited)
 *       - attendance/donations/transactions/followUps/followUpTasks
 *                             (written exclusively by callables/triggers that
 *                              already audit their own actions)
 *       - notifications        (provider-managed)
 *       - admin_invites        (callable-audited)
 *     No document content is copied into the audit entry — only the changed
 *     field names, so PII and credentials never reach the audit trail.
 */
const TRACKED_WRITE_EXCLUDED = new Set([
  "auditLogs", "users", "attendance", "donations", "transactions",
  "followUps", "followUpTasks", "notifications", "admin_invites",
  "memberPins", "memberPinAttempts"
]);

export const onTrackedWrite = onDocumentWritten("{collection}/{docId}", async (event) => {
  const coll = String(event.params.collection);
  if (TRACKED_WRITE_EXCLUDED.has(coll)) return;

  const before = event.data?.before?.data() ?? null;
  const after = event.data?.after?.data() ?? null;
  if (!before && !after) return;

  const action = !before ? "CREATE" : !after ? "DELETE" : "UPDATE";
  const changed = before && after
    ? Object.keys(after).filter((k) => JSON.stringify(after[k]) !== JSON.stringify(before[k]))
    : [];

  // Attribution comes from the trigger's authenticated caller (event.uid),
  // never from client-set createdBy/updatedBy fields, which a client could
  // set to impersonate another actor. The firebase-functions typings omit
  // uid, but v2 Firestore events carry it at runtime; Admin SDK writes have
  // no uid and attribute to null.
  const actor = (event as unknown as { uid?: string | null }).uid || null;

  await db.collection("auditLogs").add({
    action,
    resource: `${coll}/${String(event.params.docId)}`,
    userId: actor,
    detail: changed.length > 0 ? `Changed fields: ${changed.slice(0, 12).join(", ")}` : "Document written",
    source: "rules-trigger",
    status: "SUCCESS",
    timestamp: admin.firestore.FieldValue.serverTimestamp()
  });
});

/**
 * 9. RATE-LIMITED SUBMISSION API (Prayer Requests)
 */
export const submitPrayerRequest = onCall(async (request: CallableRequest<{ requestText?: unknown; isAnonymous?: unknown; isPrivate?: unknown }>) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Authentication required.");
  }

  const uid = request.auth.uid;
  const recentSnap = await db.collection("prayerRequests")
    .where("ownerId", "==", uid)
    .where("createdAt", ">", admin.firestore.Timestamp.fromMillis(Date.now() - 60000))
    .get();

  if (recentSnap.size >= 3) {
    throw new HttpsError("resource-exhausted", "Rate limit exceeded. Please wait 1 minute before submitting again.");
  }

  const { requestText, isAnonymous, isPrivate } = request.data || {};
  if (!requestText || typeof requestText !== "string" || requestText.length > 2000) {
    throw new HttpsError("invalid-argument", "Invalid prayer request length.");
  }

  const docRef = await db.collection("prayerRequests").add({
    requestText,
    isAnonymous: !!isAnonymous,
    isPrivate: !!isPrivate,
    ownerId: uid,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    status: "Active"
  });

  return { success: true, id: docRef.id };
});

/**
 * 10. SCHEDULED SOFT-DELETE ARCHIVAL (Runs Daily)
 */
export const archiveSoftDeletedRecords = onSchedule("every 24 hours", async () => {
  const ninetyDaysAgo = admin.firestore.Timestamp.fromMillis(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const BATCH_LIMIT = 400;
  let purged = 0;

  for (;;) {
    const snap = await db.collection("members")
      .where("deleted", "==", true)
      .where("deletedAt", "<=", ninetyDaysAgo)
      .limit(BATCH_LIMIT)
      .get();

    if (snap.empty) break;

    const batch = db.batch();
    snap.docs.forEach((docSnap) => {
      batch.delete(docSnap.ref);
    });
    await batch.commit();
    purged += snap.docs.length;

    if (snap.docs.length < BATCH_LIMIT) break;
  }

  logger.info(`Archived and purged ${purged} soft-deleted member records.`);
});