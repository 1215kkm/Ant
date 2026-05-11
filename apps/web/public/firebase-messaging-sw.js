/* eslint-disable no-undef */
// Firebase Cloud Messaging 백그라운드 핸들러
// 이 파일은 Firebase SDK가 자동으로 /firebase-messaging-sw.js 경로에서 찾는다.
// 별도 SW로 동작하지만 Serwist SW와 scope가 다르므로 충돌하지 않는다.

importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js");

// 배포 전 실제 값을 채워야 함. NEXT_PUBLIC_* 환경변수의 동일한 값.
// 또는 빌드 시 placeholder 치환 스크립트(scripts/build-fcm-sw.mjs)로 자동화 가능.
firebase.initializeApp({
  apiKey: "REPLACE_API_KEY",
  authDomain: "REPLACE_AUTH_DOMAIN",
  projectId: "REPLACE_PROJECT_ID",
  storageBucket: "REPLACE_STORAGE_BUCKET",
  messagingSenderId: "REPLACE_SENDER_ID",
  appId: "REPLACE_APP_ID",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title =
    (payload.notification && payload.notification.title) ||
    (payload.data && payload.data.title) ||
    "개미청소";
  const body =
    (payload.notification && payload.notification.body) ||
    (payload.data && payload.data.body) ||
    "";
  const href = (payload.data && payload.data.href) || "/notifications";

  self.registration.showNotification(title, {
    body,
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    tag: payload.data && payload.data.tag,
    data: { href },
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const href = (event.notification.data && event.notification.data.href) || "/notifications";
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        for (const c of clients) {
          if (c.url.includes(href)) return c.focus();
        }
        return self.clients.openWindow(href);
      }),
  );
});
