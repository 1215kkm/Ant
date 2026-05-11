import {
  onDocumentUpdated,
  type FirestoreEvent,
  type Change,
  type QueryDocumentSnapshot,
} from "firebase-functions/v2/firestore";
import { logger } from "firebase-functions/v2";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "../services/admin";
import { notifyInApp } from "../services/notify";
import { sendFcmToUser } from "../services/fcm";

type RequestDoc = {
  type: "repair" | "inquiry";
  buildingId: string;
  residentId: string;
  unitLabel?: string | null;
  status: string;
  title: string;
  category?: string | null;
};

/**
 * 요청 상태 변경 시:
 *  1) /requests/{rid}/events에 이력 기록
 *  2) 거주자 stats.byStatus 카운터 갱신
 *  3) 거주자에게 인앱 알림
 *  4) 완료 시 building.stats.openRequests 감소
 */
export const onRequestStatusChanged = onDocumentUpdated(
  "requests/{rid}",
  async (
    event: FirestoreEvent<
      Change<QueryDocumentSnapshot> | undefined,
      { rid: string }
    >,
  ) => {
    const before = event.data?.before.data() as RequestDoc | undefined;
    const after = event.data?.after.data() as RequestDoc | undefined;
    if (!before || !after) return;
    if (before.status === after.status) return;

    const rid = event.params.rid;

    // 1) events 이력
    await event.data!.after.ref.collection("events").add({
      kind: "status_changed",
      from: before.status,
      to: after.status,
      at: FieldValue.serverTimestamp(),
    });

    // 2) 거주자 stats.byStatus
    if (after.residentId) {
      const residentRef = adminDb.doc(
        `buildings/${after.buildingId}/residents/${after.residentId}`,
      );
      try {
        await residentRef.set(
          {
            stats: {
              [`byStatus.${before.status}`]: FieldValue.increment(-1),
              [`byStatus.${after.status}`]: FieldValue.increment(1),
            },
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true },
        );
        if (after.status === "completed") {
          // 완료율 재계산은 추후 누적 통계 함수에서 처리.
        }
      } catch (err) {
        logger.warn("resident byStatus update failed", { rid, err });
      }
    }

    // 3) 거주자 알림 (인앱 + FCM)
    if (after.residentId) {
      const title = `요청 상태 변경: ${after.title}`;
      const body = `상태가 "${labelKo(after.status)}"(으)로 변경되었습니다.`;
      const href = `/requests/${rid}`;
      await Promise.allSettled([
        notifyInApp({
          kind: "request_status_changed",
          recipientUid: after.residentId,
          title,
          body,
          href,
          payload: { requestId: rid, status: after.status },
        }),
        sendFcmToUser(after.residentId, {
          title,
          body,
          href,
          tag: `req-${rid}`,
          data: { requestId: rid, status: after.status },
        }),
      ]);
    }

    // 4) 건물 stats
    if (after.status === "completed" && before.status !== "completed") {
      await adminDb.doc(`buildings/${after.buildingId}`).set(
        {
          stats: { openRequests: FieldValue.increment(-1) },
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    }
    if (before.status === "completed" && after.status !== "completed") {
      await adminDb.doc(`buildings/${after.buildingId}`).set(
        {
          stats: { openRequests: FieldValue.increment(1) },
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    }

    logger.info("request status changed", {
      rid,
      from: before.status,
      to: after.status,
    });
  },
);

function labelKo(status: string): string {
  switch (status) {
    case "received":
      return "접수";
    case "confirmed":
      return "확인";
    case "in_progress":
      return "진행중";
    case "completed":
      return "완료";
    case "on_hold":
      return "보류";
    default:
      return status;
  }
}
