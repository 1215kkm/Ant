#!/usr/bin/env node
/**
 * 빌드/배포 전에 실행:
 *   node scripts/build-fcm-sw.mjs
 * NEXT_PUBLIC_FIREBASE_* 환경변수를 읽어 public/firebase-messaging-sw.js의
 * REPLACE_* 플레이스홀더를 실제 값으로 치환한다.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const swPath = resolve(__dirname, "../public/firebase-messaging-sw.js");

const replacements = {
  REPLACE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  REPLACE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  REPLACE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  REPLACE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  REPLACE_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  REPLACE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let content = readFileSync(swPath, "utf-8");
let changed = false;
for (const [k, v] of Object.entries(replacements)) {
  if (!v) {
    console.warn(`[build-fcm-sw] ${k} env missing — leaving placeholder`);
    continue;
  }
  if (content.includes(k)) {
    content = content.replaceAll(k, v);
    changed = true;
  }
}

if (changed) {
  writeFileSync(swPath, content);
  console.log("[build-fcm-sw] firebase-messaging-sw.js updated");
} else {
  console.log("[build-fcm-sw] no placeholders found (already built or env missing)");
}
