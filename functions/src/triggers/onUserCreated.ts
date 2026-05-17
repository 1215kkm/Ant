import { beforeUserCreated } from "firebase-functions/v2/identity";
import { Timestamp, FieldValue } from "firebase-admin/firestore";
import { adminDb, adminAuth } from "../services/admin";
import { syncClaimsForUser } from "../services/claims";
import type { AppClaims, Role } from "../shared/roles";

const MAX_BIDS_IN_CLAIMS = 30;

/**
 * 신규 가입 시 user 문서를 생성하고 기본 role='resident'를 부여한다.
 * Firebase 6.x 2세대에서는 onUserCreated가 deprecated되었으므로
 * beforeUserCreated 블로킹 트리거를 사용한다.
 *
 * 중요: beforeUserCreated 시점에는 Auth 사용자가 아직 존재하지 않으므로
 * adminAuth.setCustomUserClaims(uid, ...) 는 'auth/user-not-found' 로 실패한다.
 * 대신 핸들러가 { customClaims } 를 반환하면 생성과 동시에 토큰에 반영된다.
 */
export const onUserCreated = beforeUserCreated(async (event) => {
  const u = event.data;
  if (!u) return;

  const ref = adminDb.doc(`users/${u.uid}`);
  const existing = await ref.get();

  let role: Role = "resident";
  let buildingIds: string[] = [];

  if (existing.exists) {
    // 슈퍼관리자가 콘솔에서 미리 만든 문서 등 — 기존 role 을 존중한다.
    const d = existing.data() as { role?: Role; buildingIds?: string[] } | undefined;
    role = (d?.role as Role) || "resident";
    buildingIds = Array.isArray(d?.buildingIds) ? d!.buildingIds! : [];
  } else {
    await ref.set({
      uid: u.uid,
      email: u.email ?? null,
      phoneNumber: u.phoneNumber ?? null,
      displayName: u.displayName ?? null,
      role,
      buildingIds: [],
      pushEnabled: false,
      locale: "ko-KR",
      createdAt: Timestamp.now(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  }

  const claims: AppClaims = {
    role,
    bIds: buildingIds.slice(0, MAX_BIDS_IN_CLAIMS),
    sm: role === "super_manager",
  };
  return { customClaims: claims };
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
