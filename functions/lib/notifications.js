"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationProviders = void 0;
exports.recordNotification = recordNotification;
const admin = require("firebase-admin");
class UnconfiguredProvider {
    constructor(channel) {
        this.channel = channel;
    }
    async send() {
        return { status: "not-configured" };
    }
}
exports.notificationProviders = [
    new UnconfiguredProvider("email"),
    new UnconfiguredProvider("whatsapp"),
    new UnconfiguredProvider("sms")
];
async function recordNotification(request) {
    const provider = exports.notificationProviders.find((candidate) => candidate.channel === request.channel);
    const result = provider ? await provider.send(request) : { status: "not-configured" };
    await admin.firestore().collection("notifications").add({
        ...request,
        status: result.status,
        error: result.error || null,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
}
//# sourceMappingURL=notifications.js.map