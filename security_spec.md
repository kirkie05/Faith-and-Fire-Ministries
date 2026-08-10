# Firebase Security Specification & TDD Test Suite

## 1. System Data Invariants
1. **Single Church Scope**: All records belong to a single church instance. Cross-tenant access is irrelevant.
2. **User Ownership & Isolation**: Standard members can ONLY read/write their own user profile, prayer requests, and notifications matching `request.auth.uid`.
3. **Role-Based Access Control (RBAC)**: Privilege escalation is strictly prevented. Client SDKs cannot write or update the `role` field on user documents or claims. Roles are stored in `request.auth.token.role` (custom claims) and verified via Firestore security rules.
4. **PII Isolation**: Phone numbers, residential addresses, and confidential notes are either stored in split private sub-collections or encrypted via server-side Cloud Functions (`PII_encryptedInfo`).
5. **Immutability of Audit Logs**: Audit log entries are append-only and cannot be updated or deleted by any client context.
6. **Temporal & Schema Integrity**: Client writes must use `request.time` for timestamps, and all document mutations must pass strict schema key verification (`affectedKeys().hasOnly(...)`).

---

## 2. The "Dirty Dozen" Threat Payloads (TDD Test Suite)

### Payload 1: Privilege Escalation via User Profile Creation
Attempting to create a user document with `role: "SuperAdmin"`.
```json
{
  "uid": "attacker123",
  "email": "attacker@fake.com",
  "role": "SuperAdmin",
  "ownerId": "attacker123"
}
```
*Expected Result*: `PERMISSION_DENIED` (Client creation forces `role: "Member"` or requires Admin verification).

### Payload 2: Identity Spoofing (Owner ID Mismatch)
Attempting to post a prayer request setting `ownerId` to another user's UID.
```json
{
  "requestText": "Forged request",
  "ownerId": "victim_uid_456",
  "isPrivate": true
}
```
*Expected Result*: `PERMISSION_DENIED` (`ownerId` must strictly equal `request.auth.uid`).

### Payload 3: PII Harvest Attack (Unrestricted List Scan)
Authenticated guest trying to run `getDocs(collection(db, "members"))`.
```json
{
  "query": "SELECT * FROM /members"
}
```
*Expected Result*: `PERMISSION_DENIED` (Members collection requires `request.auth.token.role in ['SuperAdmin', 'Admin', 'Pastor', 'Minister']`).

### Payload 4: Ghost Field Injection (Shadow Update)
Attempting to update an announcement while appending a hidden `approvedByAdmin` shadow boolean.
```json
{
  "title": "Sunday Service",
  "content": "Service at 9AM",
  "approvedByAdmin": true
}
```
*Expected Result*: `PERMISSION_DENIED` (Validation helper rejects unknown keys via `hasOnly(...)`).

### Payload 5: Audit Log Tampering (Delete Execution)
Attempting to delete a record in `/auditLogs/{logId}`.
```json
{
  "action": "DELETE",
  "path": "/auditLogs/log_789"
}
```
*Expected Result*: `PERMISSION_DENIED` (`allow delete: if false;` on audit logs).

### Payload 6: Timestamp Spoofing (Backdating Records)
Attempting to insert a donation record with a past client-crafted timestamp instead of `request.time`.
```json
{
  "amount": 1000,
  "fund": "Tithes",
  "createdAt": "1999-01-01T00:00:00Z"
}
```
*Expected Result*: `PERMISSION_DENIED` (Must validate `incoming().createdAt == request.time`).

### Payload 7: Denial of Wallet (1MB String Injection into ID Path)
Attempting to create a document with a 1MB string as the document ID.
```json
{
  "path": "/sermons/A".repeat(1000000)
}
```
*Expected Result*: `PERMISSION_DENIED` (`isValidId(sermonId)` enforces `id.size() <= 128`).

### Payload 8: Transaction Record Forgery
Client attempting to directly insert a `SUCCESS` status into `/transactions`.
```json
{
  "amount": 5000,
  "gateway": "payfast",
  "status": "SUCCESS",
  "reference": "fake_ref"
}
```
*Expected Result*: `PERMISSION_DENIED` (Financial transactions can only be written by Cloud Functions / Admin service role).

### Payload 9: Terminal State Bypass
Attempting to alter a member record marked as `status: "Archived"`.
```json
{
  "status": "Active"
}
```
*Expected Result*: `PERMISSION_DENIED` (Terminal state locking prevents non-admins from modifying archived records).

### Payload 10: Anonymous Read Vulnerability
Unauthenticated HTTP request attempting to fetch `/settings/global`.
```json
{
  "auth": null
}
```
*Expected Result*: `PERMISSION_DENIED` (`request.auth != null` required).

### Payload 11: Cross-User Notification Read
User A querying notifications belonging to User B (`recipientUid == "userB"`).
```json
{
  "auth": { "uid": "userA" },
  "path": "/notifications/notif_userB"
}
```
*Expected Result*: `PERMISSION_DENIED` (`resource.data.recipientUid == request.auth.uid`).

### Payload 12: Private Prayer Request Data Leakage
Member attempting to read private prayer requests of other members.
```json
{
  "auth": { "uid": "memberX", "token": { "role": "Member" } },
  "path": "/prayerRequests/private_req_memberY"
}
```
*Expected Result*: `PERMISSION_DENIED` (`isPrivate == false || resource.data.ownerId == request.auth.uid || isStaff()`).

---

## 3. Automated Security Rules Unit Test Suite (`firestore.rules.test.ts`)

```typescript
import { assertFails, assertSucceeds, initializeTestEnvironment, RulesTestEnvironment } from "@firebase/rules-unit-testing";
import readFileSync from "fs";

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: "faithandfire-b0455",
    firestore: {
      rules: readFileSync("firestore.rules", "utf8"),
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

describe("Faith & Fire Security Rules - Dirty Dozen TDD Suite", () => {
  test("Payload 1: Reject client setting SuperAdmin role on user document", async () => {
    const context = testEnv.authenticatedContext("attacker123", { email: "attacker@test.com", email_verified: true, role: "Member" });
    const db = context.firestore();
    await assertFails(db.collection("users").doc("attacker123").set({
      uid: "attacker123",
      email: "attacker@test.com",
      role: "SuperAdmin",
      status: "active",
      ownerId: "attacker123",
      createdAt: new Date().toISOString()
    }));
  });

  test("Payload 2: Reject prayer request with spoofed ownerId", async () => {
    const context = testEnv.authenticatedContext("userA", { email_verified: true, role: "Member" });
    const db = context.firestore();
    await assertFails(db.collection("prayerRequests").add({
      requesterName: "User A",
      requestText: "Please pray",
      ownerId: "victimUserB",
      isPrivate: true,
      createdAt: new Date().toISOString()
    }));
  });

  test("Payload 3: Reject unauthorized members collection scan by guest", async () => {
    const context = testEnv.authenticatedContext("guestUser", { email_verified: true, role: "Guest" });
    const db = context.firestore();
    await assertFails(db.collection("members").get());
  });

  test("Payload 5: Reject audit log deletion", async () => {
    const context = testEnv.authenticatedContext("adminUser", { email_verified: true, role: "Admin" });
    const db = context.firestore();
    await assertFails(db.collection("auditLogs").doc("log123").delete());
  });

  test("Payload 11: Prevent reading another user's notifications", async () => {
    const context = testEnv.authenticatedContext("userA", { email_verified: true, role: "Member" });
    const db = context.firestore();
    await assertFails(db.collection("notifications").doc("notif_for_userB").get());
  });
});
```
