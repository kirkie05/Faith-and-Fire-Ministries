/**
 * Check-in core logic tests (H2): member + guest check-in paths.
 *
 * Covers: identifier resolution (id / email / phone), server-side PIN
 * verification for the anonymous kiosk, spoofed caller rejection, linked
 * member check-in, malformed input rejection, and guest rate limiting.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  processMemberCheckIn,
  processGuestCheckIn,
  CheckinError,
  CheckinDb,
  CheckinDocRef,
  CheckinQueryResult,
  hashPin,
  hashMemberPin
} from "../src/checkin-core";

interface StoredDoc {
  exists: boolean;
  data: Record<string, unknown>;
}

class FakeDb implements CheckinDb {
  private docs = new Map<string, StoredDoc>();
  public added: { collection: string; data: Record<string, unknown> }[] = [];

  constructor(seed: Record<string, Record<string, unknown>> = {}) {
    for (const [key, data] of Object.entries(seed)) {
      this.docs.set(key, { exists: true, data });
    }
  }

  collection(name: string) {
    return {
      doc: (id: string): CheckinDocRef => ({
        id,
        get: async () => {
          const stored = this.docs.get(`${name}/${id}`);
          return stored ? { exists: true, data: () => stored.data } : { exists: false, data: () => ({}) };
        },
        set: async (data: Record<string, unknown>) => {
          this.docs.set(`${name}/${id}`, { exists: true, data: { ...data } });
        },
        update: async (data: Record<string, unknown>) => {
          const key = `${name}/${id}`;
          const stored = this.docs.get(key);
          this.docs.set(key, { exists: true, data: { ...(stored?.data || {}), ...data } });
        },
        delete: async () => {
          this.docs.delete(`${name}/${id}`);
        }
      }),
      add: async (data: Record<string, unknown>) => {
        const id = `auto-${this.added.length + 1}`;
        this.added.push({ collection: name, data });
        return { id };
      },
      where: (field: string, op: string, value: unknown): CheckinQuery => {
        const filters: { field: string; value: unknown }[] = [{ field, value }];
        const match = () => {
          const docs: CheckinQueryResult["docs"] = [];
          for (const [key, stored] of this.docs.entries()) {
            if (!key.startsWith(`${name}/`) || !stored.exists) continue;
            const ok = filters.every((f) => stored.data[f.field] === f.value);
            if (ok) {
              const id = key.split("/").pop()!;
              docs.push({ ref: { id, get: async () => ({ exists: true, data: () => stored.data }) }, data: () => stored.data });
            }
          }
          return docs;
        };
        const query: CheckinQuery = {
          where: (f: string, _op: string, v: unknown) => {
            filters.push({ field: f, value: v });
            return query;
          },
          limit: (n: number) => ({ get: async () => ({ docs: match().slice(0, n) }) })
        };
        return query;
      }
    };
  }

  addedTo(coll: string): Record<string, unknown>[] {
    return this.added.filter((a) => a.collection === coll).map((a) => a.data);
  }
}

function seedMembers(db: FakeDb) {
  db.collection("members");
  db.docs.set("members/mem_1", {
    exists: true,
    data: {
      id: "mem_1",
      firstName: "Thandi",
      lastName: "Dlamini",
      email: "thandi@example.com",
      phone: "+27821234567",
      ownerId: "user_thandi"
    }
  });
  db.docs.set("members/mem_2", {
    exists: true,
    data: {
      id: "mem_2",
      firstName: "Sipho",
      lastName: "Nkosi",
      email: "sipho@example.com",
      phone: "+27829876543",
      ownerId: "user_sipho"
    }
  });
  // Security PINs live only as SHA-256 hashes in the staff-only memberPins
  // collection — never as plaintext on the member record.
  db.docs.set("memberPins/mem_1", { exists: true, data: { pinHash: hashPin("4321") } });
  db.docs.set("memberPins/mem_2", { exists: true, data: { pinHash: hashPin("1111") } });
  return db;
}

const ANON = { uid: null, role: null, email: null };

test("member check-in by doc id with correct kiosk PIN succeeds", async () => {
  const db = seedMembers(new FakeDb());
  const result = await processMemberCheckIn(db, { identifier: "mem_1", serviceName: "Sunday Glory Service", pin: "4321" }, ANON);
  assert.equal(result.success, true);
  const attendance = db.addedTo("attendance");
  assert.equal(attendance.length, 1);
  assert.equal(attendance[0].memberId, "mem_1");
  assert.equal(attendance[0].attendeeType, "Member");
  assert.equal(attendance[0].createdBy, null);
});

test("anonymous kiosk check-in with WRONG PIN is rejected", async () => {
  const db = seedMembers(new FakeDb());
  await assert.rejects(
    processMemberCheckIn(db, { identifier: "mem_1", serviceName: "Sunday Glory Service", pin: "9999" }, ANON),
    (err: CheckinError) => err.code === "permission-denied"
  );
  assert.equal(db.addedTo("attendance").length, 0);
});

test("anonymous kiosk check-in with MISSING PIN is rejected", async () => {
  const db = seedMembers(new FakeDb());
  await assert.rejects(
    processMemberCheckIn(db, { identifier: "mem_1", serviceName: "Sunday Glory Service" }, ANON),
    (err: CheckinError) => err.code === "permission-denied"
  );
});

test("a plaintext PIN on the member record is NEVER accepted (must be hashed memberPins)", async () => {
  const db = seedMembers(new FakeDb());
  db.docs.set("members/mem_1", {
    exists: true,
    data: {
      id: "mem_1",
      firstName: "Thandi",
      lastName: "Dlamini",
      email: "thandi@example.com",
      phone: "+27821234567",
      pin: "4321",
      ownerId: "user_thandi"
    }
  });
  db.docs.delete("memberPins/mem_1");
  await assert.rejects(
    processMemberCheckIn(db, { identifier: "mem_1", serviceName: "Sunday Glory Service", pin: "4321" }, ANON),
    (err: CheckinError) => err.code === "permission-denied"
  );
  assert.equal(db.addedTo("attendance").length, 0);
});

test("a member with NO stored PIN hash cannot be checked in by the kiosk", async () => {
  const db = seedMembers(new FakeDb());
  db.docs.delete("memberPins/mem_1");
  await assert.rejects(
    processMemberCheckIn(db, { identifier: "mem_1", serviceName: "Sunday Glory Service", pin: "4321" }, ANON),
    (err: CheckinError) => err.code === "permission-denied"
  );
});

test("memberId-salted PIN hash verifies on the kiosk path", async () => {
  const db = seedMembers(new FakeDb());
  db.docs.set("memberPins/mem_1", { exists: true, data: { pinHash: hashMemberPin("4321", "mem_1") } });
  const result = await processMemberCheckIn(db, { identifier: "mem_1", serviceName: "Sunday Glory Service", pin: "4321" }, ANON);
  assert.equal(result.success, true);
});

test("salted PIN hash for another member never matches", async () => {
  const db = seedMembers(new FakeDb());
  db.docs.set("memberPins/mem_1", { exists: true, data: { pinHash: hashMemberPin("4321", "mem_OTHER") } });
  await assert.rejects(
    processMemberCheckIn(db, { identifier: "mem_1", serviceName: "Sunday Glory Service", pin: "4321" }, ANON),
    (err: CheckinError) => err.code === "permission-denied"
  );
});

test("kiosk check-in is throttled at 5 PIN attempts per member per minute", async () => {
  const db = seedMembers(new FakeDb());
  db.docs.set("memberPinAttempts/mem_1", { exists: true, data: { count: 5, windowStart: Date.now() } });
  await assert.rejects(
    processMemberCheckIn(db, { identifier: "mem_1", serviceName: "Sunday Glory Service", pin: "4321" }, ANON),
    (err: CheckinError) => err.code === "resource-exhausted"
  );
  assert.equal(db.addedTo("attendance").length, 0);
});

test("throttle window resets after one minute", async () => {
  const db = seedMembers(new FakeDb());
  db.docs.set("memberPinAttempts/mem_1", { exists: true, data: { count: 5, windowStart: Date.now() - 120_000 } });
  const result = await processMemberCheckIn(db, { identifier: "mem_1", serviceName: "Sunday Glory Service", pin: "4321" }, ANON);
  assert.equal(result.success, true);
});

test("successful kiosk check-in clears the attempt counter", async () => {
  const db = seedMembers(new FakeDb());
  db.docs.set("memberPinAttempts/mem_1", { exists: true, data: { count: 2, windowStart: Date.now() } });
  const result = await processMemberCheckIn(db, { identifier: "mem_1", serviceName: "Sunday Glory Service", pin: "4321" }, ANON);
  assert.equal(result.success, true);
  const attempts = await db.collection("memberPinAttempts").doc("mem_1").get();
  assert.equal(attempts.exists, false);
});

test("member check-in by EMAIL identifier resolves server-side", async () => {
  const db = seedMembers(new FakeDb());
  const result = await processMemberCheckIn(
    db,
    { identifier: "THANDI@EXAMPLE.COM", serviceName: "Sunday Glory Service", pin: "4321" },
    ANON
  );
  assert.equal(result.success, true);
  assert.equal(db.addedTo("attendance")[0].memberId, "mem_1");
});

test("member check-in by PHONE identifier resolves server-side", async () => {
  const db = seedMembers(new FakeDb());
  const result = await processMemberCheckIn(
    db,
    { identifier: "+27 82 123 4567", serviceName: "Sunday Glory Service", pin: "4321" },
    ANON
  );
  assert.equal(result.success, true);
  assert.equal(db.addedTo("attendance")[0].memberId, "mem_1");
});

test("unknown member identifier returns not-found", async () => {
  const db = seedMembers(new FakeDb());
  await assert.rejects(
    processMemberCheckIn(db, { identifier: "ghost@nowhere.com", serviceName: "Sunday Glory Service", pin: "4321" }, ANON),
    (err: CheckinError) => err.code === "not-found"
  );
});

test("spoofed caller (signed-in, unlinked) is rejected even with the PIN", async () => {
  const db = seedMembers(new FakeDb());
  await assert.rejects(
    processMemberCheckIn(
      db,
      { identifier: "mem_2", serviceName: "Sunday Glory Service", pin: "1111" },
      { uid: "user_attacker", role: "Member", email: "attacker@example.com" }
    ),
    (err: CheckinError) => err.code === "permission-denied"
  );
  assert.equal(db.addedTo("attendance").length, 0);
});

test("linked member (ownerId matches uid) can check in without a PIN", async () => {
  const db = seedMembers(new FakeDb());
  const result = await processMemberCheckIn(
    db,
    { identifier: "mem_1", serviceName: "Sunday Glory Service" },
    { uid: "user_thandi", role: "Member", email: "thandi@example.com" }
  );
  assert.equal(result.success, true);
  assert.equal(db.addedTo("attendance")[0].createdBy, "user_thandi");
});

test("member whose email matches the caller email can check in without a PIN", async () => {
  const db = seedMembers(new FakeDb());
  const result = await processMemberCheckIn(
    db,
    { identifier: "mem_2", serviceName: "Sunday Glory Service" },
    { uid: "someone_else", role: "Member", email: "sipho@example.com" }
  );
  assert.equal(result.success, true);
  assert.equal(db.addedTo("attendance")[0].memberId, "mem_2");
});

test("staff caller can check in any member without a PIN", async () => {
  const db = seedMembers(new FakeDb());
  const result = await processMemberCheckIn(
    db,
    { identifier: "mem_2", serviceName: "Sunday Glory Service" },
    { uid: "admin1", role: "Admin", email: "admin@church.org" }
  );
  assert.equal(result.success, true);
});

test("missing identifier is rejected as invalid-argument", async () => {
  const db = seedMembers(new FakeDb());
  await assert.rejects(
    processMemberCheckIn(db, { identifier: "", serviceName: "Sunday Glory Service" }, ANON),
    (err: CheckinError) => err.code === "invalid-argument"
  );
});

test("missing service name is rejected as invalid-argument", async () => {
  const db = seedMembers(new FakeDb());
  await assert.rejects(
    processMemberCheckIn(db, { identifier: "mem_1", serviceName: "", pin: "4321" }, ANON),
    (err: CheckinError) => err.code === "invalid-argument"
  );
});

test("guest check-in creates visitor + attendance records", async () => {
  const db = new FakeDb();
  const result = await processGuestCheckIn(db, {
    name: "Jane Visitor",
    email: "jane@example.com",
    phone: "+27710001111",
    serviceName: "Sunday Glory Service"
  });
  assert.equal(result.success, true);
  const visitors = db.addedTo("visitors");
  assert.equal(visitors.length, 1);
  assert.equal(visitors[0].followUpStatus, "Pending");
  assert.equal(visitors[0].source, "guest-checkin");
  const attendance = db.addedTo("attendance");
  assert.equal(attendance.length, 1);
  assert.equal(attendance[0].attendeeType, "Visitor");
  assert.equal(attendance[0].attendeeId, "auto-1");
});

test("guest check-in with empty name is rejected", async () => {
  const db = new FakeDb();
  await assert.rejects(
    processGuestCheckIn(db, { name: "", email: "", phone: "", serviceName: "Sunday Glory Service" }),
    (err: CheckinError) => err.code === "invalid-argument"
  );
});

test("guest check-in with malformed email is rejected", async () => {
  const db = new FakeDb();
  await assert.rejects(
    processGuestCheckIn(db, { name: "Jane", email: "not-an-email", phone: "", serviceName: "Sunday Glory Service" }),
    (err: CheckinError) => err.code === "invalid-argument"
  );
});

test("guest check-in without a service name is rejected", async () => {
  const db = new FakeDb();
  await assert.rejects(
    processGuestCheckIn(db, { name: "Jane", email: "", phone: "", serviceName: "" }),
    (err: CheckinError) => err.code === "invalid-argument"
  );
});

test("guest check-in is rate limited after 3 hits per email per minute", async () => {
  const db = new FakeDb();
  const now = Date.now();
  const recentIso = new Date(now - 10_000).toISOString();
  const oldIso = new Date(now - 120_000).toISOString();
  db.docs.set("visitors/v1", { exists: true, data: { source: "guest-checkin", email: "spam@example.com", createdAt: recentIso } });
  db.docs.set("visitors/v2", { exists: true, data: { source: "guest-checkin", email: "spam@example.com", createdAt: recentIso } });
  db.docs.set("visitors/v3", { exists: true, data: { source: "guest-checkin", email: "spam@example.com", createdAt: recentIso } });
  db.docs.set("visitors/v4", { exists: true, data: { source: "guest-checkin", email: "spam@example.com", createdAt: oldIso } });
  await assert.rejects(
    processGuestCheckIn(db, { name: "Spammer", email: "spam@example.com", phone: "", serviceName: "Sunday Glory Service" }),
    (err: CheckinError) => err.code === "resource-exhausted"
  );
  assert.equal(db.addedTo("visitors").length, 0);
});

test("guest check-in below the rate limit succeeds", async () => {
  const db = new FakeDb();
  const now = Date.now();
  db.docs.set("visitors/v1", { exists: true, data: { source: "guest-checkin", email: "ok@example.com", createdAt: new Date(now - 10_000).toISOString() } });
  const result = await processGuestCheckIn(db, { name: "OK Visitor", email: "ok@example.com", phone: "", serviceName: "Sunday Glory Service" });
  assert.equal(result.success, true);
});