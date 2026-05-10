/**
 * 개미청소 Cloud Functions 진입점.
 * 2세대 함수, asia-northeast3(서울).
 *
 * 단계별로 트리거를 추가한다:
 *  Phase 1: onUserCreated, setUserRole, onMembershipChanged
 *  Phase 3: onRequestCreated, onRequestStatusChanged
 *  Phase 4: telegramWebhook, linkTelegramAccount
 *  Phase 6: onInvoiceCreated, invoiceReminderJob
 *  Phase 7: weeklyReportJob, monthlyReportJob, generateReportPdf
 */
import { setGlobalOptions } from "firebase-functions/v2";

setGlobalOptions({
  region: "asia-northeast3",
  maxInstances: 10,
});

// Phase 0: 헬스체크만 export
export { healthcheck } from "./http/healthcheck";
