import { getMessaging, type MulticastMessage } from "firebase-admin/messaging";
import { logger } from "firebase-functions/v2";
import { adminDb } from "./admin";

export type FcmPayload = {
  title: string;
  body: string;
  href?: string;
  tag?: string;
  data?: Record<string, string>;
};

/**
 * 한 사용자의 모든 등록 디바이스에 FCM 푸시 전송.
 * 유효하지 않은 토큰은 자동으로 정리한다.
 */
export async function sendFcmToUser(uid: string, payload: FcmPayload): Promise<number> {
  const tokensSnap = await adminDb.collection(`fcmTokens/${uid}/devices`).get();
  if (tokensSnap.empty) return 0;
  const tokens = tokensSnap.docs.map((d) => d.id);

  const message: MulticastMessage = {
    tokens,
    notification: {
      title: payload.title,
      body: payload.body,
    },
    data: {
      ...(payload.data ?? {}),
      title: payload.title,
      body: payload.body,
      href: payload.href ?? "/notifications",
      ...(payload.tag ? { tag: payload.tag } : {}),
    },
    webpush: {
      fcmOptions: {
        link: payload.href ?? "/notifications",
      },
    },
  };

  const messaging = getMessaging();
  const result = await messaging.sendEachForMulticast(message);

  // 무효 토큰 정리
  const toDelete: string[] = [];
  result.responses.forEach((r, idx) => {
    if (!r.success) {
      const code = r.error?.code;
      if (
        code === "messaging/invalid-registration-token" ||
        code === "messaging/registration-token-not-registered"
      ) {
        toDelete.push(tokens[idx]);
      } else {
        logger.warn("fcm send failed", { uid, token: tokens[idx], code });
      }
    }
  });
  if (toDelete.length > 0) {
    const batch = adminDb.batch();
    toDelete.forEach((t) => batch.delete(adminDb.doc(`fcmTokens/${uid}/devices/${t}`)));
    await batch.commit();
  }

  return result.successCount;
}

export async function sendFcmToUsers(
  uids: string[],
  payload: FcmPayload,
): Promise<number> {
  let total = 0;
  await Promise.all(
    uids.map((uid) =>
      sendFcmToUser(uid, payload)
        .then((n) => (total += n))
        .catch((err) => logger.warn("sendFcmToUser failed", { uid, err })),
    ),
  );
  return total;
}
