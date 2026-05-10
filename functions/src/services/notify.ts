import { adminDb } from "./admin";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

export type NotificationKind =
  | "request_created"
  | "request_status_changed"
  | "invoice_created"
  | "invoice_overdue"
  | "report_ready";

export type NotifyInput = {
  kind: NotificationKind;
  recipientUid: string;
  title: string;
  body: string;
  href?: string;
  payload?: Record<string, unknown>;
};

/**
 * 인앱 알림 문서를 생성한다. FCM/텔레그램 발송은 Phase 4 모듈에서 별도로.
 */
export async function notifyInApp(input: NotifyInput): Promise<void> {
  await adminDb.collection("notifications").add({
    kind: input.kind,
    recipientUid: input.recipientUid,
    title: input.title,
    body: input.body,
    href: input.href ?? null,
    payload: input.payload ?? null,
    read: false,
    createdAt: FieldValue.serverTimestamp(),
  });
}

export async function notifyMany(inputs: NotifyInput[]): Promise<void> {
  const batch = adminDb.batch();
  for (const i of inputs) {
    const ref = adminDb.collection("notifications").doc();
    batch.set(ref, {
      ...i,
      href: i.href ?? null,
      payload: i.payload ?? null,
      read: false,
      createdAt: Timestamp.now(),
    });
  }
  await batch.commit();
}
