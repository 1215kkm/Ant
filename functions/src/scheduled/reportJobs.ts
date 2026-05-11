import { onSchedule } from "firebase-functions/v2/scheduler";
import { logger } from "firebase-functions/v2";
import { adminDb } from "../services/admin";
import { buildAndSendReport } from "../services/reportBuilder";
import { TELEGRAM_BOT_TOKEN } from "../services/telegram";
import { MAILER_SECRETS } from "../services/mailer";

const SECRETS = [TELEGRAM_BOT_TOKEN, ...MAILER_SECRETS];

/** 매주 월요일 06:00 KST. 지난 7일 보고서. */
export const weeklyReportJob = onSchedule(
  {
    schedule: "0 6 * * MON",
    timeZone: "Asia/Seoul",
    secrets: SECRETS,
    memory: "1GiB",
    timeoutSeconds: 540,
  },
  async () => {
    const now = new Date();
    const periodEnd = startOfDayKST(now);
    const periodStart = new Date(periodEnd.getTime() - 7 * 24 * 60 * 60 * 1000);

    const bSnap = await adminDb.collection("buildings").get();
    logger.info("weeklyReportJob start", { buildings: bSnap.size });

    for (const b of bSnap.docs) {
      try {
        await buildAndSendReport({
          buildingId: b.id,
          kind: "weekly",
          periodStart,
          periodEnd,
        });
      } catch (err) {
        logger.error("weeklyReportJob failed for building", { bid: b.id, err });
      }
    }
  },
);

/** 매월 1일 06:00 KST. 직전 달 월간 보고서. */
export const monthlyReportJob = onSchedule(
  {
    schedule: "0 6 1 * *",
    timeZone: "Asia/Seoul",
    secrets: SECRETS,
    memory: "1GiB",
    timeoutSeconds: 540,
  },
  async () => {
    const now = new Date();
    const periodEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const periodStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1),
    );

    const bSnap = await adminDb.collection("buildings").get();
    logger.info("monthlyReportJob start", { buildings: bSnap.size });

    for (const b of bSnap.docs) {
      try {
        await buildAndSendReport({
          buildingId: b.id,
          kind: "monthly",
          periodStart,
          periodEnd,
        });
      } catch (err) {
        logger.error("monthlyReportJob failed for building", { bid: b.id, err });
      }
    }
  },
);

function startOfDayKST(d: Date): Date {
  // KST = UTC+9. UTC 기준으로 KST 00:00에 해당하는 시각
  const kstOffsetMs = 9 * 60 * 60 * 1000;
  const local = new Date(d.getTime() + kstOffsetMs);
  local.setUTCHours(0, 0, 0, 0);
  return new Date(local.getTime() - kstOffsetMs);
}
