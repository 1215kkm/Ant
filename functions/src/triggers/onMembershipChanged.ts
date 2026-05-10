import {
  onDocumentWritten,
  type FirestoreEvent,
  type Change,
  type DocumentSnapshot,
} from "firebase-functions/v2/firestore";
import { logger } from "firebase-functions/v2";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "../services/admin";
import { syncClaimsForUser } from "../services/claims";

type MembershipDoc = {
  userId: string;
  buildingId: string;
  status: "active" | "revoked";
};

/**
 * /buildings/{bid}/memberships/{mid}이 변경될 때:
 *  1) building.managerIds 갱신 (denorm)
 *  2) user.buildingIds 갱신 (denorm)
 *  3) user의 custom claims 재동기화
 *
 * memberships가 truth, 그 외는 캐시.
 */
export const onMembershipChanged = onDocumentWritten(
  "buildings/{bid}/memberships/{mid}",
  async (
    event: FirestoreEvent<
      Change<DocumentSnapshot> | undefined,
      { bid: string; mid: string }
    >,
  ) => {
    const before = event.data?.before?.data() as MembershipDoc | undefined;
    const after = event.data?.after?.data() as MembershipDoc | undefined;
    const bid = event.params.bid;

    const wasActive = before?.status === "active";
    const isActive = after?.status === "active";

    // 영향을 받는 사용자 수집(추가/제거된 사용자)
    const affectedUsers = new Set<string>();
    if (before?.userId) affectedUsers.add(before.userId);
    if (after?.userId) affectedUsers.add(after.userId);

    // 1) building.managerIds 재계산
    const activeSnap = await adminDb
      .collection(`buildings/${bid}/memberships`)
      .where("status", "==", "active")
      .get();
    const managerIds = activeSnap.docs
      .map((d) => (d.data() as MembershipDoc).userId)
      .filter(Boolean);

    await adminDb.doc(`buildings/${bid}`).set(
      {
        managerIds,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    // 2) user.buildingIds 갱신
    for (const uid of affectedUsers) {
      const userMembershipSnaps = await adminDb
        .collectionGroup("memberships")
        .where("userId", "==", uid)
        .where("status", "==", "active")
        .get();
      const buildingIds = Array.from(
        new Set(
          userMembershipSnaps.docs.map(
            (d) => (d.data() as MembershipDoc).buildingId,
          ),
        ),
      );
      await adminDb.doc(`users/${uid}`).set(
        {
          buildingIds,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );

      // 3) claims 재동기화
      try {
        await syncClaimsForUser(uid);
      } catch (err) {
        logger.error("syncClaimsForUser failed", { uid, err });
      }
    }

    logger.info("membership change processed", {
      bid,
      wasActive,
      isActive,
      affectedUsers: Array.from(affectedUsers),
      activeManagers: managerIds.length,
    });
  },
);
