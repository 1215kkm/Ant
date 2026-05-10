import { onCall, HttpsError } from "firebase-functions/v2/https";
import { z } from "zod";
import { adminAuth } from "../services/admin";

const Input = z.object({
  email: z.string().email().optional(),
  phoneNumber: z.string().optional(),
}).refine((d) => d.email || d.phoneNumber, "email 또는 phoneNumber 중 하나는 필요합니다.");

/**
 * 관리자/슈퍼관리자가 이메일이나 휴대폰 번호로 사용자를 검색해
 * 멤버십·거주자 매핑에 활용한다.
 */
export const findUserByContact = onCall<z.infer<typeof Input>>(
  {},
  async (req) => {
    if (!req.auth) throw new HttpsError("unauthenticated", "로그인이 필요합니다.");
    const role = req.auth.token.role;
    if (role !== "cleaning_manager" && role !== "super_manager") {
      throw new HttpsError("permission-denied", "관리자만 검색할 수 있습니다.");
    }

    const parsed = Input.safeParse(req.data);
    if (!parsed.success) {
      throw new HttpsError("invalid-argument", parsed.error.message);
    }

    try {
      const user = parsed.data.email
        ? await adminAuth.getUserByEmail(parsed.data.email)
        : await adminAuth.getUserByPhoneNumber(parsed.data.phoneNumber!);
      return {
        uid: user.uid,
        email: user.email ?? null,
        phoneNumber: user.phoneNumber ?? null,
        displayName: user.displayName ?? null,
      };
    } catch (err) {
      const code = (err as { code?: string }).code;
      if (code === "auth/user-not-found") {
        throw new HttpsError("not-found", "해당 사용자를 찾을 수 없습니다.");
      }
      throw new HttpsError("internal", "조회 중 오류가 발생했습니다.");
    }
  },
);
