import {
  onDocumentCreated,
  type FirestoreEvent,
  type QueryDocumentSnapshot,
} from "firebase-functions/v2/firestore";
import { logger } from "firebase-functions/v2";
import { FieldValue } from "firebase-admin/firestore";
import { notifyMany } from "../services/notify";
import { sendFcmToUsers } from "../services/fcm";
import { sendTelegramToUsers, TELEGRAM_BOT_TOKEN } from "../services/telegram";

const APP_URL = process.env.APP_URL || "https://ant-cleaning.web.app";

type InvoiceDoc = {
  buildingId: string;
  buildingName?: string | null;
  period: string;
  amount: number;
  recipients?: { ownerUids?: string[] };
};

/**
 * 새 청구서 발행 시 건물주들에게 인앱 + FCM + 텔레그램 알림.
 */
export const onInvoiceCreated = onDocumentCreated(
  { document: "invoices/{iid}", secrets: [TELEGRAM_BOT_TOKEN] },
  async (
    event: FirestoreEvent<QueryDocumentSnapshot | undefined, { iid: string }>,
  ) => {
    const snap = event.data;
    if (!snap) return;
    const inv = snap.data() as InvoiceDoc;
    const iid = event.params.iid;
    const owners = inv.recipients?.ownerUids ?? [];

    if (owners.length === 0) {
      logger.info("invoice has no owners; skip notify", { iid });
      return;
    }

    const title = `${inv.period} 관리비 청구`;
    const body = `${inv.buildingName ?? "건물"} · ${formatKRW(inv.amount)}`;
    const href = `/invoices/${iid}`;

    await Promise.allSettled([
      notifyMany(
        owners.map((uid) => ({
          kind: "invoice_created",
          recipientUid: uid,
          title,
          body,
          href,
          payload: { invoiceId: iid, period: inv.period, amount: inv.amount },
        })),
      ),
      sendFcmToUsers(owners, { title, body, href, tag: `inv-${iid}` }),
      sendTelegramToUsers(owners, { title, body, href, appUrl: APP_URL }),
    ]);

    await snap.ref.update({
      status: "sent",
      sentAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    logger.info("invoice sent", { iid, ownerCount: owners.length });
  },
);

function formatKRW(amount: number): string {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  }).format(amount);
}
