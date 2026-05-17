import { getApp, getApps, initializeApp } from "firebase/app";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
import { connectAuthEmulator, getAuth } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";
import { connectStorageEmulator, getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

// App Check (reCAPTCHA v3) — 운영 환경에서 Firestore/Storage/Functions 호출을 보호.
// 사이트 키가 없으면 초기화를 건너뛴다 (로컬 개발 또는 미설정 환경).
if (typeof window !== "undefined") {
  const siteKey = process.env.NEXT_PUBLIC_FIREBASE_APP_CHECK_SITE_KEY;
  const debugToken = process.env.NEXT_PUBLIC_FIREBASE_APP_CHECK_DEBUG;
  if (debugToken) {
    // 디버그 토큰: Firebase 콘솔 > App Check > 앱 > 디버그 토큰 관리에 등록한 토큰
    // 또는 true로 두면 콘솔 로그에서 자동 생성된 토큰을 받아 등록.
    (self as unknown as { FIREBASE_APP_CHECK_DEBUG_TOKEN: string | boolean }).FIREBASE_APP_CHECK_DEBUG_TOKEN =
      debugToken === "true" ? true : debugToken;
  }
  if (siteKey) {
    try {
      initializeAppCheck(firebaseApp, {
        provider: new ReCaptchaV3Provider(siteKey),
        isTokenAutoRefreshEnabled: true,
      });
    } catch (err) {
      console.warn("App Check init failed:", err);
    }
  }
}

export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
export const storage = getStorage(firebaseApp);

// 로컬 개발: Firebase 에뮬레이터에 연결.
// NEXT_PUBLIC_FIREBASE_USE_EMULATOR=true 일 때만 동작하며,
// HMR/중복 실행 시 재연결 오류가 나지 않도록 1회만 연결한다.
if (process.env.NEXT_PUBLIC_FIREBASE_USE_EMULATOR === "true") {
  const g = globalThis as unknown as { __ANT_EMULATORS_CONNECTED__?: boolean };
  if (!g.__ANT_EMULATORS_CONNECTED__) {
    g.__ANT_EMULATORS_CONNECTED__ = true;
    const host = "127.0.0.1";
    connectAuthEmulator(auth, `http://${host}:9099`, { disableWarnings: true });
    connectFirestoreEmulator(db, host, 8080);
    connectStorageEmulator(storage, host, 9199);
  }
}
