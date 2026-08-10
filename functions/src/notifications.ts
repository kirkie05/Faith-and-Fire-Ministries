import * as admin from "firebase-admin";

export type NotificationChannel = "email" | "whatsapp" | "sms";

export interface NotificationRequest {
  channel: NotificationChannel;
  recipient: string;
  template: string;
  relatedId: string;
  payload: Record<string, string>;
}

export interface NotificationProvider {
  readonly channel: NotificationChannel;
  send(request: NotificationRequest): Promise<{ status: "sent" | "not-configured"; error?: string }>;
}

class UnconfiguredProvider implements NotificationProvider {
  constructor(readonly channel: NotificationChannel) {}

  async send(): Promise<{ status: "not-configured" }> {
    return { status: "not-configured" };
  }
}

export const notificationProviders: NotificationProvider[] = [
  new UnconfiguredProvider("email"),
  new UnconfiguredProvider("whatsapp"),
  new UnconfiguredProvider("sms")
];

export async function recordNotification(request: NotificationRequest): Promise<void> {
  const provider = notificationProviders.find((candidate) => candidate.channel === request.channel);
  const result = provider ? await provider.send(request) : { status: "not-configured" as const };
  await admin.firestore().collection("notifications").add({
    ...request,
    status: result.status,
    error: result.error || null,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });
}
