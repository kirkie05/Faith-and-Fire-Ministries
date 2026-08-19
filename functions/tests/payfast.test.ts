import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildPayFastSignature,
  processPayFastItn,
  ItnDb,
  ItnDocRef,
  ItnTransaction,
  normalizeDonationFund
} from "../src/payfast-core";

interface StoredDoc {
  exists: boolean;
  data: Record<string, unknown>;
}

interface FakeRef extends ItnDocRef {
  key: string;
}

/**
 * In-memory Firestore stand-in with a serialized transaction queue.
 * Because transactions are processed one at a time, a second concurrent
 * duplicate ITN observes the committed state of the first — exactly what the
 * real Firestore runTransaction guarantees under contention.
 */
class FakeDb implements ItnDb {
  private docs = new Map<string, StoredDoc>();
  private queue: Promise<unknown> = Promise.resolve();

  constructor(seed: Record<string, Record<string, unknown>> = {}) {
    for (const [key, data] of Object.entries(seed)) {
      this.docs.set(key, { exists: true, data });
    }
  }

  collection(name: string) {
    return {
      doc: (id?: string): FakeRef => ({
        id: id || `auto-${Math.random().toString(36).slice(2)}-${Date.now()}`,
        key: `${name}/${id}`
      })
    };
  }

  runTransaction<T>(fn: (tx: ItnTransaction) => Promise<T>): Promise<T> {
    const task = this.queue.then(async () => {
      const staged = new Map<string, Record<string, unknown>>();
      const tx: ItnTransaction = {
        get: async (ref: ItnDocRef) => {
          const key = (ref as FakeRef).key;
          const current = this.docs.get(key);
          const data = staged.get(key) || current?.data || {};
          const exists = staged.has(key) ? true : (current?.exists ?? false);
          return { exists, data: () => ({ ...data }) };
        },
        update: (ref: ItnDocRef, data: Record<string, unknown>) => {
          const key = (ref as FakeRef).key;
          staged.set(key, { ...(staged.get(key) || this.docs.get(key)?.data || {}), ...data });
        },
        set: (ref: ItnDocRef, data: Record<string, unknown>) => {
          const key = (ref as FakeRef).key;
          staged.set(key, { ...data });
        }
      };
      const result = await fn(tx);
      for (const [key, data] of staged.entries()) {
        this.docs.set(key, { exists: true, data });
      }
      return result;
    });
    this.queue = task.catch(() => undefined);
    return task as Promise<T>;
  }

  readDoc(key: string): StoredDoc {
    return this.docs.get(key) || { exists: false, data: {} };
  }
}

const CREDS = { merchantId: "10000100", passphrase: "sekrit-passphrase" };

function makePf(overrides: Record<string, unknown> = {}) {
  const base: Record<string, unknown> = {
    merchant_id: CREDS.merchantId,
    m_payment_id: "DON-1",
    amount: "250.00",
    payment_status: "COMPLETE",
    pf_payment_id: "PF12345"
  };
  const signed = { ...base, ...overrides };
  signed.signature = buildPayFastSignature(signed, CREDS.passphrase);
  return signed;
}

function seedTx(db: FakeDb, id: string, overrides: Record<string, unknown> = {}) {
  db.collection("transactions");
  const seed: Record<string, Record<string, unknown>> = {
    [`transactions/${id}`]: {
      amount: 250,
      fund: "Tithes & Offerings",
      firstName: "Jane",
      lastName: "Doe",
      email: "jane@example.com",
      type: "One-off",
      status: "PENDING",
      userUid: "u1",
      ...overrides
    }
  };
  return new FakeDb(seed);
}

test("signature is deterministic and passphrase-protected", () => {
  const params = { merchant_id: "10000100", amount: "250.00", payment_status: "COMPLETE", signature: "ignored" };
  const s1 = buildPayFastSignature(params, "pw1");
  const s2 = buildPayFastSignature({ ...params }, "pw1");
  const s3 = buildPayFastSignature(params, "pw2");
  assert.equal(s1, s2);
  assert.notEqual(s1, s3);
});

test("rejects unknown merchant id", async () => {
  const db = new FakeDb();
  const pf = makePf({ merchant_id: "99999999" });
  const result = await processPayFastItn(db, pf, CREDS);
  assert.equal(result.code, 400);
});

test("rejects invalid signature", async () => {
  const db = new FakeDb();
  const pf = makePf();
  pf.signature = "deadbeef";
  const result = await processPayFastItn(db, pf, CREDS);
  assert.equal(result.code, 403);
});

test("rejects missing transaction", async () => {
  const db = new FakeDb();
  const result = await processPayFastItn(db, makePf({ m_payment_id: "DON-NOPE" }), CREDS);
  assert.equal(result.code, 404);
});

test("rejects amount mismatch", async () => {
  const db = seedTx(new FakeDb(), "DON-1");
  const result = await processPayFastItn(db, makePf({ amount: "25000.00" }), CREDS);
  assert.equal(result.code, 400);
});

test("completes payment: donation doc id equals transaction id", async () => {
  const db = seedTx(new FakeDb(), "DON-1");
  const result = await processPayFastItn(db, makePf(), CREDS);
  assert.equal(result.code, 200);
  assert.equal(result.duplicate, false);
  const tx = db.readDoc("transactions/DON-1");
  assert.equal(tx.data.status, "SUCCESS");
  assert.equal(tx.data.pfPaymentId, "PF12345");
  const donation = db.readDoc("donations/DON-1");
  assert.equal(donation.exists, true);
  assert.equal(donation.data.amount, 250);
  assert.equal(donation.data.transactionId, "DON-1");
});

test("duplicate ITN is acknowledged but never re-processed", async () => {
  const db = seedTx(new FakeDb(), "DON-1");
  const first = await processPayFastItn(db, makePf(), CREDS);
  assert.equal(first.duplicate, false);
  const second = await processPayFastItn(db, makePf(), CREDS);
  assert.equal(second.code, 200);
  assert.equal(second.duplicate, true);
});

test("concurrent duplicate ITNs credit the donation exactly once", async () => {
  const db = seedTx(new FakeDb(), "DON-2");
  const [a, b] = await Promise.all([
    processPayFastItn(db, makePf({ m_payment_id: "DON-2" }), CREDS),
    processPayFastItn(db, makePf({ m_payment_id: "DON-2" }), CREDS)
  ]);
  const processed = [a, b].filter((r) => !r.duplicate && r.code === 200).length;
  const duplicates = [a, b].filter((r) => r.duplicate).length;
  assert.equal(processed, 1);
  assert.equal(duplicates, 1);
});

test("many sequential replay ITNs are all acknowledged but only first is processed", async () => {
  const db = seedTx(new FakeDb(), "DON-REPLAY");
  const results = [];
  for (let i = 0; i < 5; i++) {
    results.push(await processPayFastItn(db, makePf({ m_payment_id: "DON-REPLAY" }), CREDS));
  }
  assert.equal(results.filter((r) => !r.duplicate && r.code === 200).length, 1);
  assert.equal(results.filter((r) => r.duplicate).length, 4);
  const tx = db.readDoc("transactions/DON-REPLAY");
  assert.equal(tx.data.status, "SUCCESS");
  const donation = db.readDoc("donations/DON-REPLAY");
  assert.equal(donation.exists, true);
  assert.equal(donation.data.amount, 250);
});

test("failed payment never creates a donation", async () => {
  const db = seedTx(new FakeDb(), "DON-3");
  const result = await processPayFastItn(db, makePf({ m_payment_id: "DON-3", payment_status: "FAILED" }), CREDS);
  assert.equal(result.code, 200);
  const tx = db.readDoc("transactions/DON-3");
  assert.equal(tx.data.status, "FAILED");
  assert.equal(db.readDoc("donations/DON-3").exists, false);
});

test("normalizeDonationFund", () => {
  assert.equal(normalizeDonationFund("Missions"), "Missions");
  assert.equal(normalizeDonationFund("Building Fund"), "Building Fund");
  assert.equal(normalizeDonationFund("some attack string"), "Tithes & Offerings");
  assert.equal(normalizeDonationFund(null), "Tithes & Offerings");
  assert.equal(normalizeDonationFund(undefined), "Tithes & Offerings");
});