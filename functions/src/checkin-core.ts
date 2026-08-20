/**
 * Check-in core logic (member + guest), decoupled from the Cloud Functions
 * runtime so it can be unit tested with an in-memory Firestore stand-in.
 *
 * All identity decisions are made server-side:
 *  - the identifier (member id / email / phone) is resolved against the
 *    staff-only members collection;
 *  - an anonymous kiosk caller must present the member's PIN, which is
 *    verified here — never by the client — against the hashed memberPins
 *    document (plaintext PINs are never stored or readable);
 *  - a signed-in caller may only check in members they own or are linked to
 *    by email, unless they hold a staff claim.
 */
import { createHash } from "crypto";
import { isStaffRole } from "./roles";

export function hashPin(pin: string): string {
  return createHash("sha256").update(pin, "utf8").digest("hex");
}

/**
 * Per-member salted PIN hash. The member id is mixed into the hash so a
 * staff reader of the memberPins collection cannot reuse a precomputed
 * table across members (each member must be brute-forced individually).
 * Legacy unsalted hashes (hashPin) remain verifiable for backward
 * compatibility; new PINs are always written salted.
 */
export function hashMemberPin(pin: string, memberId: string): string {
  return createHash("sha256").update(`ff-pin:v1:${memberId}:${pin}`, "utf8").digest("hex");
}

export function isValidPin(pin: string): boolean {
  return /^\d{4,10}$/.test(pin);
}

const PIN_ATTEMPT_WINDOW_MS = 60_000;
const PIN_ATTEMPT_LIMIT = 5;

export interface CheckinDocRef {
  id: string;
  get(): Promise<{ exists: boolean; data(): Record<string, unknown> | undefined }>;
  set?(data: Record<string, unknown>): Promise<unknown>;
  update?(data: Record<string, unknown>): Promise<unknown>;
  delete?(): Promise<unknown>;
}

export interface CheckinQueryResult {
  docs: { ref: CheckinDocRef; data(): Record<string, unknown> | undefined }[];
}

export interface CheckinQuery {
  where(field: string, op: string, value: unknown): CheckinQuery;
  limit(n: number): { get(): Promise<CheckinQueryResult> };
}

export interface CheckinTransaction {
  get(ref: CheckinDocRef): Promise<{ exists: boolean; data(): Record<string, unknown> | undefined }>;
  set(ref: CheckinDocRef, data: Record<string, unknown>): void;
  update(ref: CheckinDocRef, data: Record<string, unknown>): void;
}

export interface CheckinDb {
  collection(name: string): {
    doc(id: string): CheckinDocRef;
    add(data: Record<string, unknown>): Promise<{ id: string }>;
    where(field: string, op: string, value: unknown): CheckinQuery;
  };
  // Optional atomic transaction support (present on firebase-admin Firestore).
  // When absent, a non-atomic read-modify-write fallback is used.
  runTransaction?: <T>(fn: (tx: CheckinTransaction) => Promise<T>) => Promise<T>;
}

export class CheckinError extends Error {
  code: "invalid-argument" | "not-found" | "permission-denied" | "resource-exhausted";
  constructor(code: CheckinError["code"], message: string) {
    super(message);
    this.code = code;
  }
}

export interface MemberCheckinCaller {
  uid: string | null;
  role: string | null;
  email: string | null;
}

export interface MemberCheckinInput {
  identifier: string;
  serviceName: string;
  pin?: string;
}

export interface GuestCheckinInput {
  name: string;
  email: string;
  phone: string;
  serviceName: string;
}

const GUEST_RATE_WINDOW_MS = 60_000;
const GUEST_RATE_LIMIT = 3;

/**
 * Resolves a member identifier (member id / email / phone) to the member
 * document server-side. Returns null when no member matches.
 */
export async function resolveMember(
  db: CheckinDb,
  identifier: string
): Promise<{ memberId: string; data: Record<string, unknown> } | null> {
  const term = identifier.trim().slice(0, 128);
  if (!term) return null;

  let memberSnap = await db.collection("members").doc(term).get();
  let memberId = term;
  if (!memberSnap.exists) {
    const byEmail = await db.collection("members").where("email", "==", term.toLowerCase()).limit(1).get();
    if (byEmail.docs[0]) {
      memberId = byEmail.docs[0].ref.id;
      memberSnap = await byEmail.docs[0].ref.get();
    }
  }
  if (!memberSnap.exists) {
    const byPhone = await db.collection("members").where("phone", "==", term.replace(/\s+/g, "")).limit(1).get();
    if (byPhone.docs[0]) {
      memberId = byPhone.docs[0].ref.id;
      memberSnap = await byPhone.docs[0].ref.get();
    }
  }
  if (!memberSnap.exists) {
    // Brand-new signups live in memberApplications until an admin approves
    // them into the members collection, so fall back there for the same
    // identifier lookups (by id, email, then phone).
    let appSnap = await db.collection("memberApplications").doc(term).get();
    if (!appSnap.exists) {
      const byEmail = await db.collection("memberApplications").where("email", "==", term.toLowerCase()).limit(1).get();
      if (byEmail.docs[0]) {
        memberId = byEmail.docs[0].ref.id;
        appSnap = await byEmail.docs[0].ref.get();
      } else {
        const byPhone = await db.collection("memberApplications").where("phone", "==", term.replace(/\s+/g, "")).limit(1).get();
        if (byPhone.docs[0]) {
          memberId = byPhone.docs[0].ref.id;
          appSnap = await byPhone.docs[0].ref.get();
        }
      }
    }
    if (appSnap.exists) {
      memberSnap = appSnap;
    }
  }
  if (!memberSnap.exists) return null;
  return { memberId, data: memberSnap.data() || {} };
}

/**
 * Verifies a candidate PIN against the member's hashed PIN document.
 * Returns true only when the memberPins document exists, contains a
 * 64-char hex hash, and the hash of the candidate matches (salted hash
 * preferred, legacy unsalted hash accepted).
 */
export async function verifyMemberPinHash(
  db: CheckinDb,
  memberId: string,
  candidate: string
): Promise<boolean> {
  const pin = (candidate || "").trim();
  if (!pin) return false;
  const pinDoc = await db.collection("memberPins").doc(memberId).get();
  const storedHash = pinDoc.data()?.pinHash;
  if (typeof storedHash !== "string" || storedHash.length !== 64) return false;
  return hashMemberPin(pin, memberId) === storedHash || hashPin(pin) === storedHash;
}

/**
 * Brute-force throttle shared by every PIN entry point (member dashboard
 * unlock AND anonymous kiosk check-in): at most PIN_ATTEMPT_LIMIT attempts
 * per member per rolling minute. Uses an atomic transaction when the db
 * supports it (firebase-admin), otherwise a non-atomic fallback. Each
 * call consumes one attempt; success callers should call clearPinAttempts.
 */
export async function pinAttemptAllowed(db: CheckinDb, memberId: string): Promise<boolean> {
  const attemptsRef = db.collection("memberPinAttempts").doc(memberId);
  const windowStart = Date.now() - PIN_ATTEMPT_WINDOW_MS;
  const bump = (data: Record<string, unknown>, set: (d: Record<string, unknown>) => void) => {
    const count = typeof data.count === "number" ? data.count : 0;
    const start = typeof data.windowStart === "number" ? data.windowStart : Date.now();
    if (start < windowStart) {
      set({ count: 1, windowStart: Date.now() });
      return true;
    }
    if (count >= PIN_ATTEMPT_LIMIT) return false;
    set({ count: count + 1, windowStart: start });
    return true;
  };

  if (db.runTransaction) {
    try {
      return await db.runTransaction(async (tx) => {
        const snap = await tx.get(attemptsRef);
        return bump(snap.exists ? snap.data() || {} : {}, (d) => tx.set(attemptsRef, d));
      });
    } catch {
      return false;
    }
  }

  const snap = await attemptsRef.get();
  const result = bump(snap.exists ? snap.data() || {} : {}, async (d) => {
    if (attemptsRef.set) await attemptsRef.set(d);
    else if (attemptsRef.update) await attemptsRef.update(d);
  });
  return result;
}

/** Clears the attempt counter after a successful PIN verification. */
export async function clearPinAttempts(db: CheckinDb, memberId: string): Promise<void> {
  const attemptsRef = db.collection("memberPinAttempts").doc(memberId);
  if (attemptsRef.delete) {
    await attemptsRef.delete().catch(() => undefined);
  }
}

export async function processMemberCheckIn(
  db: CheckinDb,
  input: MemberCheckinInput,
  caller: MemberCheckinCaller
): Promise<{ success: true; attendanceId: string; status: string }> {
  const identifier = input.identifier.trim().slice(0, 128);
  const serviceName = input.serviceName.trim().slice(0, 100);
  const pin = (input.pin || "").trim();
  if (!identifier) {
    throw new CheckinError("invalid-argument", "A member id, email, or phone number is required.");
  }
  if (!serviceName) {
    throw new CheckinError("invalid-argument", "A service name is required.");
  }

  const resolved = await resolveMember(db, identifier);
  const resolvedByEmail = !resolved && caller.email
    ? await resolveMember(db, String(caller.email))
    : null;
  const resolvedFinal = resolved || resolvedByEmail;
  if (!resolvedFinal) {
    throw new CheckinError("not-found", "Member record not found.");
  }
  const { memberId, data: member } = resolvedFinal;
  const isStaff = caller.uid !== null && isStaffRole(caller.role);
  const linkedByOwner = caller.uid !== null && member.ownerId === caller.uid;
  const linkedByEmail = caller.uid !== null &&
    typeof member.email === "string" &&
    member.email.toLowerCase() === String(caller.email || "").toLowerCase();

  if (!isStaff && !linkedByOwner && !linkedByEmail) {
    if (caller.uid === null) {
      // Anonymous kiosk path: the member's PIN is verified server-side
      // against the hashed memberPins document — the client PIN is never
      // trusted and the plaintext PIN is never stored on the member record.
      // Attempts are throttled to PIN_ATTEMPT_LIMIT per minute per member
      // (shared counter with the dashboard unlock path).
      if (!(await pinAttemptAllowed(db, memberId))) {
        throw new CheckinError("resource-exhausted", "Too many PIN attempts. Please wait a minute and try again.");
      }
      if (!(await verifyMemberPinHash(db, memberId, pin))) {
        throw new CheckinError("permission-denied", "Member verification failed. The security PIN is required for check-in.");
      }
      await clearPinAttempts(db, memberId);
    } else {
      throw new CheckinError("permission-denied", "You are not linked to this member record.");
    }
  }

  const now = new Date();
  // Ushers/staff scanning a member QR confirm attendance immediately
  // (Verified). Members checking themselves in are queued as Pending until
  // an usher or administrator verifies the check-in — members can never
  // self-verify.
  const attendanceStatus = isStaff ? "Verified" : "Pending";
  const attendanceRef = await db.collection("attendance").add({
    memberId,
    memberName: String(member.firstName || "") + " " + String(member.lastName || ""),
    memberEmail: member.email ? String(member.email) : "",
    serviceName,
    date: now.toISOString().split("T")[0],
    timestamp: now.toTimeString().split(" ")[0],
    status: attendanceStatus,
    attendeeType: "Member",
    attendeeId: memberId,
    ownerId: member.ownerId || null,
    createdBy: caller.uid,
    source: isStaff ? "usher-checkin" : "member-request",
    createdAt: now.toISOString(),
    updatedAt: now.toISOString()
  });

  return { success: true, attendanceId: attendanceRef.id, status: attendanceStatus };
}

export async function processGuestCheckIn(
  db: CheckinDb,
  input: GuestCheckinInput
): Promise<{ success: true; visitorId: string }> {
  const name = input.name.trim().slice(0, 100);
  const email = input.email.trim().toLowerCase().slice(0, 150);
  const phone = input.phone.trim().slice(0, 30);
  const serviceName = input.serviceName.trim().slice(0, 100);
  if (!name) {
    throw new CheckinError("invalid-argument", "Your name is required.");
  }
  if (email && !email.includes("@")) {
    throw new CheckinError("invalid-argument", "A valid email address is required.");
  }
  if (!serviceName) {
    throw new CheckinError("invalid-argument", "A service name is required.");
  }

  if (email) {
    const recent = await db.collection("visitors")
      .where("source", "==", "guest-checkin")
      .where("email", "==", email)
      .limit(10)
      .get();
    const cutoff = Date.now() - GUEST_RATE_WINDOW_MS;
    const hits = recent.docs.filter((d: { data(): Record<string, unknown> | undefined }) => {
      const createdAt = d.data()?.createdAt;
      if (typeof createdAt === "string") return Date.parse(createdAt) >= cutoff;
      if (createdAt instanceof Date) return createdAt.getTime() >= cutoff;
      return false;
    }).length;
    if (hits >= GUEST_RATE_LIMIT) {
      throw new CheckinError("resource-exhausted", "Too many check-ins. Please wait a minute and try again.");
    }
  }

  const now = new Date();
  const visitorRef = await db.collection("visitors").add({
    name,
    email,
    phone,
    whatsapp: phone,
    firstVisitDate: now.toISOString().split("T")[0],
    followUpStatus: "Pending",
    notes: "",
    source: "guest-checkin",
    serviceName,
    preferredContactMethod: phone ? "Phone" : "Email",
    createdAt: now.toISOString(),
    updatedAt: now.toISOString()
  });

  await db.collection("attendance").add({
    memberId: null,
    memberName: name,
    memberEmail: email,
    serviceName,
    date: now.toISOString().split("T")[0],
    timestamp: now.toTimeString().split(" ")[0],
    status: "Verified",
    attendeeType: "Visitor",
    attendeeId: visitorRef.id,
    ownerId: null,
    createdBy: null,
    source: "guest-checkin",
    createdAt: now.toISOString(),
    updatedAt: now.toISOString()
  });

  return { success: true, visitorId: visitorRef.id };
}