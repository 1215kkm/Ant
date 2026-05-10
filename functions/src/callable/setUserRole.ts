import { onCall, HttpsError } from "firebase-functions/v2/https";
import { z } from "zod";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "../services/admin";
import { syncClaimsForUser } from "../services/claims";
import { ROLES, type Role } from "../shared/roles";

const Input = z.object({
  uid: z.string().min(1),
  role: z.enum(ROLES),
});

/**
 * 슈퍼관리자만 호출 가능. 대상 사용자의 role을 변경하고 custom claims를 동기화한다.
 */
export const setUserRole = onCall<z.infer<typeof Input>>(
  { enforceAppCheck: false },
  async (req) => {
    if (!req.auth) {
      throw new HttpsError("unauthenticated", "로그인이 필요합니다.");
    }
    if (req.auth.token.sm !== true) {
      throw new HttpsError("permission-denied", "슈퍼관리자만 역할을 변경할 수 있습니다.");
    }

    const parsed = Input.safeParse(req.data);
    if (!parsed.success) {
      throw new HttpsError("invalid-argument", parsed.error.message);
    }
    const { uid, role } = parsed.data;

    const ref = adminDb.doc(`users/${uid}`);
    const snap = await ref.get();
    if (!snap.exists) {
      throw new HttpsError("not-found", "사용자를 찾을 수 없습니다.");
    }

    await ref.update({
      role,
      updatedAt: FieldValue.serverTimestamp(),
    });
    const claims = await syncClaimsForUser(uid);
    return { ok: true, role: role as Role, claims };
  },
);
