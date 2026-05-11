import { onCall, HttpsError } from "firebase-functions/v2/https";
import { z } from "zod";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "../services/admin";
import { syncClaimsForUser } from "../services/claims";

const Input = z.object({
  buildingId: z.string().min(1),
  residentId: z.string().min(1),
  uid: z.string().min(1),
});

/**
 * 거주자 문서에 가입 사용자 UID를 연결하고,
 * 해당 사용자의 buildingIds에 건물을 추가한 뒤 claims를 동기화한다.
 *
 * 매니저/슈퍼만 호출 가능. 거주자가 본인 호실로 가입한 직후 매니저가 검증하고 연결.
 */
export const linkResident = onCall<z.infer<typeof Input>>({}, async (req) => {
  if (!req.auth) throw new HttpsError("unauthenticated", "로그인이 필요합니다.");
  const role = req.auth.token.role;
  const bIds = (req.auth.token.bIds as string[] | undefined) ?? [];
  const isSuper = req.auth.token.sm === true;
  if (role !== "cleaning_manager" && !isSuper) {
    throw new HttpsError("permission-denied", "관리자만 연결할 수 있습니다.");
  }

  const parsed = Input.safeParse(req.data);
  if (!parsed.success) throw new HttpsError("invalid-argument", parsed.error.message);
  const { buildingId, residentId, uid } = parsed.data;

  if (!isSuper && !bIds.includes(buildingId)) {
    throw new HttpsError("permission-denied", "해당 건물 권한이 없습니다.");
  }

  const residentRef = adminDb.doc(`buildings/${buildingId}/residents/${residentId}`);
  const userRef = adminDb.doc(`users/${uid}`);
  const [residentSnap, userSnap] = await Promise.all([residentRef.get(), userRef.get()]);

  if (!residentSnap.exists) throw new HttpsError("not-found", "거주자를 찾을 수 없습니다.");
  if (!userSnap.exists) throw new HttpsError("not-found", "사용자를 찾을 수 없습니다.");

  await residentRef.update({
    uid,
    updatedAt: FieldValue.serverTimestamp(),
  });
  await userRef.update({
    buildingIds: FieldValue.arrayUnion(buildingId),
    updatedAt: FieldValue.serverTimestamp(),
  });

  await syncClaimsForUser(uid);
  return { ok: true };
});
