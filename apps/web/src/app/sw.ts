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

/**
 * FCM은 별도 `/firebase-messaging-sw.js`(public/)에서 처리한다.
 * Firebase SDK가 자동으로 그 경로를 찾아 등록한다.
 * 단, 알림 클릭 핸들링은 이 SW(Serwist)도 같이 처리할 수 있도록 둔다.
 */
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const data = event.notification.data as { href?: string } | undefined;
  const href = data?.href || "/notifications";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const c of clients) {
        if (c.url.includes(href)) return c.focus();
      }
      return self.clients.openWindow(href);
    }),
  );
});
