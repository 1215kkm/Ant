import { beforeUserCreated } from "firebase-functions/v2/identity";
import { logger } from "firebase-functions/v2";
import { Timestamp, FieldValue } from "firebase-admin/firestore";
import { adminDb, adminAuth } from "../services/admin";
import { syncClaimsForUser } from "../services/claims";

/**
 * 신규 가입 시 user 문서를 생성하고 기본 role='resident'를 부여한다.
 * Firebase 6.x 2세대에서는 onUserCreated가 deprecated되었으므로
 * beforeUserCreated 블로킹 트리거를 사용한다.
 */
export const onUserCreated = beforeUserCreated(async (event) => {
  const u = event.data;
  if (!u) return;

  const ref = adminDb.doc(`users/${u.uid}`);
  const existing = await ref.get();
  if (existing.exists) return;

  await ref.set({
    uid: u.uid,
    email: u.email ?? null,
    phoneNumber: u.phoneNumber ?? null,
    displayName: u.displayName ?? null,
    role: "resident",
    buildingIds: [],
    pushEnabled: false,
    locale: "ko-KR",
    createdAt: Timestamp.now(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  try {
    await syncClaimsForUser(u.uid);
  } catch (err) {
    logger.error("syncClaimsForUser failed", { uid: u.uid, err });
  }
});

/**
 * 슈퍼관리자가 콘솔에서 직접 만든 사용자 등 누락 케이스 보정용.
 * 클라이언트에서 첫 로그인 후 호출하면 user 문서가 없을 때 생성한다.
 */
export async function ensureUserDoc(uid: string): Promise<void> {
  const ref = adminDb.doc(`users/${uid}`);
  const snap = await ref.get();
  if (snap.exists) return;
  const u = await adminAuth.getUser(uid);
  await ref.set({
    uid,
    email: u.email ?? null,
    phoneNumber: u.phoneNumber ?? null,
    displayName: u.displayName ?? null,
    role: "resident",
    buildingIds: [],
    pushEnabled: false,
    locale: "ko-KR",
    createdAt: Timestamp.now(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  await syncClaimsForUser(uid);
}
