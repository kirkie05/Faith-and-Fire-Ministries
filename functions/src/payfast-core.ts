/**
 * PayFast ITN processing core — pure logic, no Admin SDK imports.
 *
 * `processPayFastItn` is safe to call from tests with an in-memory store that
 * implements the minimal structural interface below.
 *
 * Security properties enforced here:
 *  - merchant_id must match the configured merchant.
 *  - signature must validate against the configured passphrase.
 *  - amount must match the transaction we created for this m_payment_id.
 *  - processing is idempotent: a transaction that is no longer PENDING is
 *    never re-processed (a duplicate ITN returns 200 OK so PayFast stops
 *    retrying, but writes nothing).
 *  - the donations document id equals the transaction id, so a donation can
 *    never be double-credited under a different key.
 */

import { createHash } from "crypto";

export function buildPayFastSignature(params: Record<string, unknown>, passphrase: string): string {
  const parts: string[] = [];
  Object.keys(params)
    .filter((key) => key !== "signature" && params[key] != null && params[key] !== "")
    .sort()
    .forEach((key) => {
      parts.push(`${key}=${String(params[key])}`);
    });
  const source = `${parts.join("&")}&passphrase=${passphrase}`;
  return createHash("md5").update(source, "utf8").digest("hex");
}

export interface ItnDocRef {
  readonly id: string;
}

export interface ItnTransaction {
  get(ref: ItnDocRef): Promise<{ exists: boolean; data(): Record<string, unknown> }>;
  update(ref: ItnDocRef, data: Record<string, unknown>): void;
  set(ref: ItnDocRef, data: Record<string, unknown>): void;
}

export interface ItnDb {
  runTransaction<T>(fn: (tx: ItnTransaction) => Promise<T>): Promise<T>;
  collection(name: string): { doc(id?: string): ItnDocRef };
}

export interface ItnResult {
  code: number;
  body: string;
  duplicate?: boolean;
}

export interface PayFastCredentials {
  merchantId: string;
  passphrase: string;
}

const DONATION_CATEGORIES = ["Tithes & Offerings", "Building Fund", "Missions", "Benevolence", "General"];

export function normalizeDonationFund(raw: unknown): string {
  const value = String(raw || "").trim();
  return DONATION_CATEGORIES.includes(value) ? value : "Tithes & Offerings";
}

export async function processPayFastItn(
  db: ItnDb,
  pf: Record<string, unknown>,
  creds: PayFastCredentials,
  now: Date = new Date()
): Promise<ItnResult> {
  if (String(pf.merchant_id || "") !== creds.merchantId) {
    return { code: 400, body: "Invalid merchant" };
  }

  const expectedSignature = buildPayFastSignature(pf, creds.passphrase);
  if (expectedSignature !== String(pf.signature || "")) {
    return { code: 403, body: "Invalid signature" };
  }

  const txId = String(pf.m_payment_id || "").trim();
  if (!txId || txId.length > 128) {
    return { code: 400, body: "Missing m_payment_id" };
  }

  const paymentStatus = pf.payment_status === "COMPLETE" ? "SUCCESS" : String(pf.payment_status || "FAILED");
  const nowMs = now.getTime();

  try {
    return await db.runTransaction(async (tx) => {
      const txRef = db.collection("transactions").doc(txId);
      const txSnap = await tx.get(txRef);
      if (!txSnap.exists) {
        return { code: 404, body: "Transaction not found" };
      }

      const txData = txSnap.data() || {};
      const expectedAmount = Number(txData.amount);
      const receivedAmount = Number(pf.amount);
      if (!Number.isFinite(expectedAmount) || !Number.isFinite(receivedAmount)) {
        return { code: 400, body: "Amount mismatch" };
      }
      if (Math.abs(receivedAmount - expectedAmount) > 0.01) {
        return { code: 400, body: "Amount mismatch" };
      }

      if (txData.status !== "PENDING") {
        return { code: 200, body: "OK", duplicate: true };
      }

      tx.update(txRef, {
        status: paymentStatus,
        pfPaymentId: pf.pf_payment_id ? String(pf.pf_payment_id) : null,
        processedAt: nowMs,
        updatedAt: nowMs,
      });

      if (paymentStatus === "SUCCESS") {
        const donation = {
          amount: receivedAmount,
          fund: normalizeDonationFund(txData.fund),
          email: String(txData.email || ""),
          firstName: String(txData.firstName || ""),
          lastName: String(txData.lastName || ""),
          type: txData.type === "Recurring" ? "Recurring" : "One-off",
          ownerId: txData.userUid ? String(txData.userUid) : null,
          transactionId: txId,
          date: now.toISOString().split("T")[0],
          createdAt: nowMs,
          updatedAt: nowMs,
        };
        tx.set(db.collection("donations").doc(txId), donation);
        tx.set(db.collection("auditLogs").doc(), {
          action: "PAYMENT_COMPLETE",
          resource: `transactions/${txId}`,
          userId: txData.userUid ? String(txData.userUid) : "guest",
          detail: `Donation of ZAR ${receivedAmount.toFixed(2)} (${donation.fund}) received via PayFast.`,
          timestamp: nowMs,
          status: "SUCCESS",
        });
      }

      return { code: 200, body: "OK", duplicate: false };
    });
  } catch (err) {
    throw err;
  }
}