import {
  onDocumentCreated,
  type FirestoreEvent,
  type QueryDocumentSnapshot,
} from "firebase-functions/v2/firestore";
import { logger } from "firebase-functions/v2";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "../services/admin";
import { nextRequestNumber } from "../services/counters";
import { notifyMany } from "../services/notify";
import { sendFcmToUsers } from "../services/fcm";
import { sendTelegramToUsers, TELEGRAM_BOT_TOKEN } from "../services/telegram";

const APP_URL = process.env.APP_URL || "https://ant-cleaning.web.app";

type RequestDoc = {
  type: "repair" | "inquiry";
  buildingId: string;
  unitId?: string | null;
  unitLabel?: string | null;
  residentId: string;
  residentName?: string | null;
  category?: string | null;
  status: string;
  title: string;
  description: string;
  media?: unknown[];
  managerIds?: string[];
  countedForResident?: boolean;
};

/**
 * 새 요청 생성 시:
 *  1) 사람이 읽는 requestNumber 발급
 *  2) building.managerIds → request.managerIds 복사 (검색 효율 + 보안 가드)
 *  3) 거주자 stats 카운터 +1
 *  4) building.stats.openRequests +1, monthlyRequests +1
 *  5) 모든 활성 관리자에게 인앱 알림 (FCM/텔레그램은 Phase 4에서 추가)
 */
export const onRequestCreated = onDocumentCreated(
  { document: "requests/{rid}", secrets: [TELEGRAM_BOT_TOKEN] },
  async (
    event: FirestoreEvent<
      QueryDocumentSnapshot | undefined,
      { rid: string }
    >,
  ) => {
    const snap = event.data;
    if (!snap) return;
    const req = snap.data() as RequestDoc;
    const rid = event.params.rid;

    // 1) 번호 + managerIds 가져오기
    const buildingRef = adminDb.doc(`buildings/${req.buildingId}`);
    const buildingSnap = await buildingRef.get();
    const managerIds: string[] =
      (buildingSnap.data()?.managerIds as string[] | undefined) ?? [];

    const year = new Date().getFullYear();
    const requestNumber = await nextRequestNumber(year);

    await snap.ref.update({
      requestNumber,
      managerIds,
      countedForResident: true,
      updatedAt: FieldValue.serverTimestamp(),
    });

    // 2) 거주자 stats
    if (req.residentId) {
      const residentRef = adminDb.doc(
        `buildings/${req.buildingId}/residents/${req.residentId}`,
      );
      try {
        await residentRef.set(
          {
            stats: {
              total: FieldValue.increment(1),
              [`byCategory.${req.category || "기타"}`]: FieldValue.increment(1),
              [`byStatus.received`]: FieldValue.increment(1),
              lastRequestAt: FieldValue.serverTimestamp(),
            },
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true },
        );
      } catch (err) {
        logger.warn("resident stats update failed", { rid, err });
      }
    }

    // 3) 건물 stats
    await buildingRef.set(
      {
        stats: {
          openRequests: FieldValue.increment(1),
          monthlyRequests: FieldValue.increment(1),
        },
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    // 4) 알림 (관리자들): 인앱 + FCM + 텔레그램
    if (managerIds.length > 0) {
      const title = `새 ${req.type === "repair" ? "수리요청" : "문의"}`;
      const body = `${req.unitLabel ? req.unitLabel + " · " : ""}${req.title}`;
      const href = `/manage/requests/${rid}`;

      await Promise.allSettled([
        notifyMany(
          managerIds.map((uid) => ({
            kind: "request_created",
            recipientUid: uid,
            title,
            body,
            href,
            payload: { requestId: rid, requestNumber, buildingId: req.buildingId },
          })),
        ),
        sendFcmToUsers(managerIds, {
          title,
          body,
          href,
          tag: `req-${rid}`,
          data: { requestId: rid, requestNumber },
        }),
        sendTelegramToUsers(managerIds, { title, body, href, appUrl: APP_URL }),
      ]);
    }

    logger.info("request created", {
      rid,
      requestNumber,
      buildingId: req.buildingId,
      managerCount: managerIds.length,
    });
  },
);
