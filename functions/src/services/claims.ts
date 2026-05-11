import { adminAuth, adminDb } from "./admin";
import type { AppClaims, Role } from "../shared/roles";

const MAX_BIDS_IN_CLAIMS = 30;

/**
 * 사용자의 user 문서를 읽어 custom claims로 동기화한다.
 * 1KB 한계를 피하기 위해 buildingIds는 최대 30개까지만 토큰에 포함하고,
 * 그 이상은 Firestore 문서에서 직접 조회하도록 둔다(슈퍼관리자 위주).
 */
export async function syncClaimsForUser(uid: string): Promise<AppClaims | null> {
  const userSnap = await adminDb.doc(`users/${uid}`).get();
  if (!userSnap.exists) return null;

  const data = userSnap.data() as
    | { role?: Role; buildingIds?: string[] }
    | undefined;
  const role: Role = (data?.role as Role) || "resident";
  const allBids = Array.isArray(data?.buildingIds) ? data!.buildingIds! : [];
  const bIds = allBids.slice(0, MAX_BIDS_IN_CLAIMS);
  const sm = role === "super_manager";

  const claims: AppClaims = { role, bIds, sm };
  await adminAuth.setCustomUserClaims(uid, claims);
  return claims;
}

/**
 * 여러 사용자의 claims를 동기화 (membership 변경에서 호출).
 */
export async function syncClaimsForUsers(uids: string[]): Promise<void> {
  await Promise.all(uids.map((uid) => syncClaimsForUser(uid).catch(() => null)));
}
