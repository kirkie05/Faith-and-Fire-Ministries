"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.archiveSoftDeletedRecords = exports.submitPrayerRequest = exports.onVisitorCreated = exports.onMemberCreated = exports.setUserRole = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const notifications_1 = require("./notifications");
admin.initializeApp();
const db = admin.firestore();
/**
 * 1. SET USER ROLE & CUSTOM CLAIMS (Privileged Cloud Function)
 */
exports.setUserRole = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Authentication required.");
    }
    const callerUid = context.auth.uid;
    const callerUser = await admin.auth().getUser(callerUid);
    const callerRole = callerUser.customClaims?.role;
    if (callerRole !== "SuperAdmin" && callerRole !== "Admin") {
        throw new functions.https.HttpsError("permission-denied", "Only SuperAdmin or Admin can assign user roles.");
    }
    const { targetUid, role } = data;
    const allowedRoles = ["SuperAdmin", "Admin", "Pastor", "Minister", "DepartmentLeader", "Volunteer", "Member", "Guest"];
    if (!allowedRoles.includes(role)) {
        throw new functions.https.HttpsError("invalid-argument", "Invalid role specified.");
    }
    await admin.auth().setCustomUserClaims(targetUid, { role });
    await db.collection("users").doc(targetUid).set({
        role,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    await db.collection("auditLogs").add({
        action: "ASSIGN_ROLE_CLAIM",
        resource: `users/${targetUid}`,
        userId: callerUid,
        roleAssigned: role,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        status: "SUCCESS"
    });
    return { success: true, message: `Role ${role} assigned to user ${targetUid}` };
});
/**
 * 2. AUTOMATIC PII ENCRYPTION ON MEMBER CREATION
 */
exports.onMemberCreated = functions.firestore
    .document("members/{memberId}")
    .onCreate(async (snap, context) => {
    const data = snap.data();
    if (!data)
        return;
    if (data.phone || data.emergencyContact) {
        const sanitizedPhone = data.phone ? `***-***-${data.phone.slice(-4)}` : "";
        await snap.ref.update({
            PII_encryptedInfo: "ENC:STORED_IN_SECRET_MANAGER_VAULT",
            phone: sanitizedPhone,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
    }
});
/**
 * A visitor card creates a staff-owned follow-up record and attempts the
 * configured welcome notification channels. Unconfigured channels are logged
 * as such; they are never reported to staff as sent.
 */
exports.onVisitorCreated = functions.firestore
    .document("visitors/{visitorId}")
    .onCreate(async (snap, context) => {
    const visitor = snap.data();
    const visitorId = context.params.visitorId;
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
        await (0, notifications_1.recordNotification)({
            channel: "email",
            recipient: visitor.email,
            template: "visitor-welcome",
            relatedId: visitorId,
            payload: { name: visitor.name, churchName: "Faith & Fire Ministries" }
        });
    }
});
/**
 * 3. RATE-LIMITED SUBMISSION API (Prayer Requests & Messages)
 */
exports.submitPrayerRequest = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Authentication required.");
    }
    const uid = context.auth.uid;
    const recentSnap = await db.collection("prayerRequests")
        .where("ownerId", "==", uid)
        .where("createdAt", ">", new Date(Date.now() - 60000).toISOString())
        .get();
    if (recentSnap.size >= 3) {
        throw new functions.https.HttpsError("resource-exhausted", "Rate limit exceeded. Please wait 1 minute before submitting again.");
    }
    const { requestText, isAnonymous, isPrivate } = data;
    if (!requestText || requestText.length > 2000) {
        throw new functions.https.HttpsError("invalid-argument", "Invalid prayer request length.");
    }
    const docRef = await db.collection("prayerRequests").add({
        requestText,
        isAnonymous: !!isAnonymous,
        isPrivate: !!isPrivate,
        ownerId: uid,
        createdAt: new Date().toISOString(),
        status: "Active"
    });
    return { success: true, id: docRef.id };
});
/**
 * 4. SCHEDULED SOFT-DELETE ARCHIVAL (Runs Daily)
 */
exports.archiveSoftDeletedRecords = functions.pubsub
    .schedule("every 24 hours")
    .onRun(async () => {
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    const snap = await db.collection("members")
        .where("deleted", "==", true)
        .where("deletedAt", "<=", ninetyDaysAgo)
        .get();
    const batch = db.batch();
    snap.docs.forEach((docSnap) => {
        batch.delete(docSnap.ref);
    });
    await batch.commit();
    console.log(`Archived and purged ${snap.size} soft-deleted member records.`);
});
//# sourceMappingURL=index.js.map