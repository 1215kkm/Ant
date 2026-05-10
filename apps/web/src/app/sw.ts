/// <reference lib="webworker" />
import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
});

serwist.addEventListeners();

// ---------- FCM 백그라운드 메시지 통합 (Phase 4에서 활성화) ----------
// Firebase Messaging은 별도 SW를 요구하지만, Serwist 단일 SW에 통합하기 위해
// importScripts로 firebase-messaging-compat을 로드한다.
//
// try {
//   importScripts(
//     "https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js",
//     "https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js"
//   );
//   // @ts-expect-error - global firebase from importScripts
//   firebase.initializeApp({ /* runtime config */ });
//   // @ts-expect-error
//   const messaging = firebase.messaging();
//   messaging.onBackgroundMessage((payload: unknown) => {
//     // 알림 표시
//   });
// } catch (e) {
//   console.warn("FCM SW init skipped", e);
// }
