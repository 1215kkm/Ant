import { onCall, HttpsError } from "firebase-functions/v2/https";
import { Timestamp, FieldValue } from "firebase-admin/firestore";
import { adminDb } from "../services/admin";

const CODE_TTL_MS = 10 * 60 * 1000; // 10분

/**
 * 사용자가 텔레그램 봇과 연동하기 위한 1회용 6자리 코드 발급.
 * 사용자는 봇에 /start <코드>를 보내면 webhook이 코드를 검증하고 chatId를 저장한다.
 */
export const requestTelegramLinkCode = onCall(
  {},
  async (req): Promise<{ code: string; expiresAt: number; botUsername?: string }> => {
    if (!req.auth) throw new HttpsError("unauthenticated", "로그인이 필요합니다.");
    const uid = req.auth.uid;

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = Date.now() + CODE_TTL_MS;

    await adminDb.doc(`telegramLinks/${uid}`).set(
      {
        pendingCode: code,
        pendingCodeExpiresAt: Timestamp.fromMillis(expiresAt),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    return {
      code,
      expiresAt,
      botUsername: process.env.TELEGRAM_BOT_USERNAME || undefined,
    };
  },
);

/**
 * 연동 해제.
 */
export const unlinkTelegramAccount = onCall({}, async (req) => {
  if (!req.auth) throw new HttpsError("unauthenticated", "로그인이 필요합니다.");
  await adminDb.doc(`telegramLinks/${req.auth.uid}`).set(
    {
      chatId: FieldValue.delete(),
      pendingCode: FieldValue.delete(),
      pendingCodeExpiresAt: FieldValue.delete(),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
  return { ok: true };
});
