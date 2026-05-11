import { onSchedule } from "firebase-functions/v2/scheduler";
import { logger } from "firebase-functions/v2";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { adminDb } from "../services/admin";
import { notifyMany } from "../services/notify";
import { sendFcmToUsers } from "../services/fcm";
import { sendTelegramToUsers, TELEGRAM_BOT_TOKEN } from "../services/telegram";

const MAX_REMINDERS = 3;
const MIN_INTERVAL_DAYS = 3;
const APP_URL = process.env.APP_URL || "https://ant-cleaning.web.app";

/**
 * 매일 09:00 KST. 마감 지난 미납 청구서에 독촉 알림.
 * - status가 paid/issued가 아니고 (sent | partial | overdue)
 * - dueDate가 지났음
 * - remindersSent < 3
 * - 마지막 독촉 이후 3일 이상 경과
 */
export const invoiceReminderJob = onSchedule(
  {
    schedule: "0 9 * * *",
    timeZone: "Asia/Seoul",
    secrets: [TELEGRAM_BOT_TOKEN],
  },
  async () => {
    const now = Date.now();
    const minInterval = MIN_INTERVAL_DAYS * 24 * 60 * 60 * 1000;

    const snap = await adminDb
      .collection("invoices")
      .where("status", "in", ["sent", "partial", "overdue"])
      .where("dueDate", "<", Timestamp.fromMillis(now))
      .limit(500)
      .get();

    let pushed = 0;
    for (const doc of snap.docs) {
      const inv = doc.data();
      const remindersSent = (inv.remindersSent as number) ?? 0;
      if (remindersSent >= MAX_REMINDERS) continue;
      const last = inv.lastReminderAt as Timestamp | undefined;
      if (last && now - last.toMillis() < minInterval) continue;

      const owners: string[] = inv.recipients?.ownerUids ?? [];
      if (owners.length === 0) continue;

      const title = `관리비 납부 안내`;
      const body = `${inv.buildingName ?? "건물"} · ${inv.period} · ${formatKRW(
        inv.amount,
      )} 미납`;
      const href = `/invoices/${doc.id}`;

      await Promise.allSettled([
        notifyMany(
          owners.map((uid) => ({
            kind: "invoice_overdue",
            recipientUid: uid,
            title,
            body,
            href,
            payload: { invoiceId: doc.id, attempt: remindersSent + 1 },
          })),
        ),
        sendFcmToUsers(owners, { title, body, href, tag: `inv-${doc.id}` }),
        sendTelegramToUsers(owners, { title, body, href, appUrl: APP_URL }),
      ]);

      await doc.ref.update({
        status: "overdue",
        remindersSent: FieldValue.increment(1),
        lastReminderAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      pushed++;
    }

    logger.info("invoiceReminderJob done", { pushed, totalScanned: snap.size });
  },
);

function formatKRW(amount: number): string {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  }).format(amount);
}
