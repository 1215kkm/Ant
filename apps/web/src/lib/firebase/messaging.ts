"use client";

import { getMessaging, getToken, onMessage, isSupported, type Messaging } from "firebase/messaging";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { firebaseApp, db } from "./client";

let messagingPromise: Promise<Messaging | null> | null = null;

async function getMessagingSafe(): Promise<Messaging | null> {
  if (typeof window === "undefined") return null;
  if (messagingPromise) return messagingPromise;
  messagingPromise = (async () => {
    if (!(await isSupported())) return null;
    return getMessaging(firebaseApp);
  })();
  return messagingPromise;
}

/**
 * 사용자가 푸시 알림을 받을 수 있도록 권한을 요청하고 FCM 토큰을 발급해
 * Firestore /fcmTokens/{uid}/devices/{tokenId}에 저장한다.
 *
 * 반환:
 *  - 'granted'  : 토큰 등록 완료
 *  - 'denied'   : 사용자가 거부
 *  - 'unsupported' : 브라우저 지원 안 함 (iOS Safari 미설치 등)
 */
export async function enablePush(uid: string): Promise<"granted" | "denied" | "unsupported"> {
  const messaging = await getMessagingSafe();
  if (!messaging) return "unsupported";

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return "denied";

  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
  if (!vapidKey) {
    console.warn("NEXT_PUBLIC_FIREBASE_VAPID_KEY missing — push setup skipped");
    return "unsupported";
  }

  const registration = await navigator.serviceWorker.ready;
  const token = await getToken(messaging, {
    vapidKey,
    serviceWorkerRegistration: registration,
  });
  if (!token) return "denied";

  await setDoc(
    doc(db, "fcmTokens", uid, "devices", token),
    {
      token,
      userAgent: navigator.userAgent,
      createdAt: serverTimestamp(),
      lastSeenAt: serverTimestamp(),
    },
    { merge: true },
  );

  return "granted";
}

/**
 * 앱이 포그라운드일 때 도착하는 FCM 메시지를 인앱 토스트 등으로 처리하기 위한 구독.
 * 사용처에서 useEffect로 unsubscribe.
 */
export function subscribeForegroundMessages(
  handler: (payload: { title: string; body: string; href?: string }) => void,
): () => void {
  let unsub: (() => void) | undefined;
  (async () => {
    const messaging = await getMessagingSafe();
    if (!messaging) return;
    unsub = onMessage(messaging, (p) => {
      const title = p.notification?.title || p.data?.title || "알림";
      const body = p.notification?.body || p.data?.body || "";
      const href = p.data?.href as string | undefined;
      handler({ title, body, href });
    });
  })();
  return () => {
    unsub?.();
  };
}
