import { Timestamp, FieldValue } from "firebase-admin/firestore";
import { logger } from "firebase-functions/v2";
import { adminDb, adminAuth } from "./admin";
import { renderAndUploadReport } from "../pdf/render";
import { sendMail } from "./mailer";
import { sendTelegramToUsers } from "./telegram";
import { notifyMany } from "./notify";
import { sendFcmToUsers } from "./fcm";

const APP_URL = process.env.APP_URL || "https://ant-cleaning.web.app";

export type ReportKind = "weekly" | "monthly";

type RequestRow = {
  requestNumber?: string;
  title: string;
  status: string;
  unitLabel?: string;
  category?: string;
  createdAt?: Timestamp;
};

export async function buildAndSendReport(opts: {
  buildingId: string;
  kind: ReportKind;
  periodStart: Date;
  periodEnd: Date;
}): Promise<string> {
  const { buildingId, kind, periodStart, periodEnd } = opts;
  const reportId = `${buildingId}_${kind}_${formatYYYYMMDD(periodStart)}`;

  const bSnap = await adminDb.doc(`buildings/${buildingId}`).get();
  if (!bSnap.exists) throw new Error(`Building ${buildingId} not found`);
  const building = bSnap.data() as { name?: string; ownerIds?: string[] };

  // 요청 집계
  const reqSnap = await adminDb
    .collection("requests")
    .where("buildingId", "==", buildingId)
    .where("createdAt", ">=", Timestamp.fromDate(periodStart))
    .where("createdAt", "<", Timestamp.fromDate(periodEnd))
    .get();

  const rows: RequestRow[] = reqSnap.docs.map((d) => d.data() as RequestRow);
  const byCategory: Record<string, number> = {};
  const byStatus: Record<string, number> = {};
  let completed = 0;
  for (const r of rows) {
    const c = r.category || "기타";
    byCategory[c] = (byCategory[c] ?? 0) + 1;
    byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;
    if (r.status === "completed") completed++;
  }

  // 관리비 집계
  const invSnap = await adminDb
    .collection("invoices")
    .where("buildingId", "==", buildingId)
    .where("createdAt", ">=", Timestamp.fromDate(periodStart))
    .where("createdAt", "<", Timestamp.fromDate(periodEnd))
    .get();
  let invIssued = 0;
  let invPaid = 0;
  let invOverdue = 0;
  invSnap.docs.forEach((d) => {
    invIssued++;
    const status = (d.data() as { status?: string }).status;
    if (status === "paid") invPaid++;
    if (status === "overdue") invOverdue++;
  });

  const summary = {
    totalRequests: rows.length,
    completed,
    pending: rows.length - completed,
    byCategory,
    byStatus,
    invoicesIssued: invIssued,
    invoicesPaid: invPaid,
    invoicesOverdue: invOverdue,
  };

  // PDF
  const { pdfPath, pdfUrl } = await renderAndUploadReport(buildingId, reportId, {
    buildingName: building.name || buildingId,
    kind,
    periodStart,
    periodEnd,
    summary,
    requestSamples: rows.map((r) => ({
      requestNumber: r.requestNumber,
      title: r.title,
      status: r.status,
      unitLabel: r.unitLabel,
    })),
  });

  // reports 문서 저장
  await adminDb.doc(`reports/${reportId}`).set(
    {
      buildingId,
      buildingName: building.name || null,
      kind,
      periodStart: Timestamp.fromDate(periodStart),
      periodEnd: Timestamp.fromDate(periodEnd),
      summary,
      pdfPath,
      pdfUrl,
      generatedAt: FieldValue.serverTimestamp(),
      generatedBy: "system",
    },
    { merge: true },
  );

  // 건물주 알림: 인앱 + FCM + 텔레그램 + 이메일
  const owners = building.ownerIds ?? [];
  if (owners.length > 0) {
    const title = `${building.name || ""} ${kind === "weekly" ? "주간" : "월간"} 보고서`;
    const body = `총 요청 ${rows.length}건 · 완료 ${completed}건`;
    const href = `/reports/${reportId}`;

    await Promise.allSettled([
      notifyMany(
        owners.map((uid) => ({
          kind: "report_ready",
          recipientUid: uid,
          title,
          body,
          href,
          payload: { reportId, buildingId },
        })),
      ),
      sendFcmToUsers(owners, { title, body, href, tag: `rep-${reportId}` }),
      sendTelegramToUsers(owners, { title, body, href, appUrl: APP_URL }),
      sendEmailToOwners(owners, title, body, pdfUrl, pdfPath).catch((err) =>
        logger.warn("report email failed", { err }),
      ),
    ]);

    await adminDb.doc(`reports/${reportId}`).update({
      emailedAt: FieldValue.serverTimestamp(),
      telegramSentAt: FieldValue.serverTimestamp(),
    });
  }

  return reportId;
}

async function sendEmailToOwners(
  uids: string[],
  subject: string,
  preview: string,
  pdfUrl: string,
  _pdfPath: string,
): Promise<void> {
  // owner uid에서 email 조회
  const emails: string[] = [];
  for (const uid of uids) {
    try {
      const u = await adminAuth.getUser(uid);
      if (u.email) emails.push(u.email);
    } catch {
      /* 무시 */
    }
  }
  if (emails.length === 0) return;

  const html = `
    <div style="font-family: 'Pretendard', sans-serif; color:#0B1B2B;">
      <h2 style="color:#1668AA;">${escapeHtml(subject)}</h2>
      <p>${escapeHtml(preview)}</p>
      <p style="margin-top:16px;">
        <a href="${pdfUrl}" style="background:#2E9CF2;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;">PDF 보고서 열기</a>
      </p>
      <p style="color:#1668AA;font-size:12px;margin-top:24px;">개미청소 자동 발송 메일</p>
    </div>
  `;
  await sendMail({
    to: emails,
    subject,
    html,
    text: `${preview}\n\nPDF: ${pdfUrl}`,
  });
}

function formatYYYYMMDD(d: Date): string {
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
