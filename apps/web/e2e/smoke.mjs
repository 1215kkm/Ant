/**
 * 실제 브라우저(Chromium) 기반 E2E 스모크.
 * Firebase 에뮬레이터에 연결된 dev 서버(http://localhost:3000)를 대상으로
 * 이메일 가입 → beforeUserCreated 트리거 → user 문서/claims → 홈 리다이렉트 →
 * 보호 페이지(/settings) 렌더 → Firestore에 user 문서 실제 생성까지 검증한다.
 *
 * 사전조건: 에뮬레이터 + dev 서버가 실행 중이어야 한다.
 * 실행:  node e2e/smoke.mjs
 *
 * 주의: Firestore는 영구 스트리밍 연결을 유지하므로 networkidle 을 쓰지 않는다.
 *       네비게이션으로 취소되는 in-flight 쿼리(net::ERR_ABORTED)는 버그가 아니므로 제외.
 */
import { chromium } from "playwright";

const BASE = process.env.E2E_BASE_URL || "http://localhost:3000";
const PROJECT = "ant-cleaning";
const FIRESTORE = "http://127.0.0.1:8080";
const ts = Date.now();
const email = `e2e_${ts}@example.com`;
const password = "test1234";

const consoleErrors = [];
const pageErrors = [];
const failedRequests = [];

const log = (s, m) => console.log(`[${s}] ${m}`);

const browser = await chromium.launch();
const page = await (await browser.newContext()).newPage();

page.on("console", (m) => {
  if (m.type() === "error") consoleErrors.push(m.text());
});
page.on("pageerror", (e) => pageErrors.push(String(e)));
page.on("requestfailed", (r) => {
  const errText = r.failure()?.errorText || "";
  // ERR_ABORTED = 네비게이션/언마운트로 취소된 in-flight 요청(정상). 비핵심 외부 자원도 제외.
  if (errText.includes("ERR_ABORTED")) return;
  if (/google-analytics|gstatic|fonts\.googleapis|cdn\.jsdelivr/.test(r.url())) return;
  failedRequests.push(`${r.method()} ${r.url()} :: ${errText}`);
});

let exitCode = 0;
let createdUid = null;
try {
  log("1", `GET ${BASE}/login`);
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForSelector("text=로그인", { timeout: 15000 });
  log("1", "로그인 페이지 렌더 OK");

  await page.getByRole("button", { name: "처음이신가요? 가입하기" }).click();
  await page.waitForSelector('input[type="email"]');
  log("2", "가입 모드 전환 OK");

  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.locator('input[type="checkbox"][aria-label="약관 동의"]').check();
  log("3", `폼 입력 OK (${email})`);

  await page.getByRole("button", { name: "가입하기" }).click();

  await page.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 45000 });
  log("5", `가입+인증 리다이렉트 OK → ${page.url()}`);

  // 홈에서 인증 사용자 콘텐츠 확인 (Firestore 쿼리 완료 여유)
  await page.waitForSelector(`text=/${email.split("@")[0]}/`, { timeout: 20000 });
  const home = (await page.locator("body").innerText()).slice(0, 100).replace(/\s+/g, " ");
  log("6", `홈 본문: "${home}"`);

  // 보호 페이지: networkidle 대신 헤더 텍스트로 대기
  await page.goto(`${BASE}/settings`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForSelector("text=설정", { timeout: 20000 });
  await page.waitForSelector("text=푸시 알림", { timeout: 10000 });
  log("7", `설정 페이지 렌더 OK (계정: ${await page
    .locator("text=" + email)
    .first()
    .isVisible()
    .catch(() => false)})`);

  await page.screenshot({ path: "e2e/last-run.png", fullPage: true });
} catch (err) {
  console.error("E2E 흐름 실패:", err.message);
  exitCode = 1;
}

await browser.close();

// Firestore 에뮬레이터 REST로 user 문서가 실제 생성됐는지 직접 검증
try {
  const res = await fetch(
    `${FIRESTORE}/v1/projects/${PROJECT}/databases/(default)/documents:runQuery`,
    {
      method: "POST",
      // 에뮬레이터: Bearer owner 토큰으로 보안 규칙을 우회해 실제 저장 상태를 검증한다.
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer owner",
      },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: "users" }],
          where: {
            fieldFilter: {
              field: { fieldPath: "email" },
              op: "EQUAL",
              value: { stringValue: email },
            },
          },
          limit: 1,
        },
      }),
    },
  );
  const rows = await res.json();
  const docFound = Array.isArray(rows) && rows.some((r) => r.document);
  const role = rows?.[0]?.document?.fields?.role?.stringValue;
  log("8", `Firestore user 문서 검증: found=${docFound} role=${role}`);
  if (!docFound) {
    console.error("  → beforeUserCreated 트리거가 user 문서를 만들지 않았습니다.");
    exitCode = 1;
  }
  if (role !== "resident") {
    console.error(`  → 기본 role 이 'resident' 가 아닙니다 (got: ${role}).`);
    exitCode = 1;
  }
  createdUid = rows?.[0]?.document?.fields?.uid?.stringValue ?? null;
} catch (e) {
  console.error("Firestore REST 검증 실패:", e.message);
  exitCode = 1;
}

console.log("\n===== 결과 =====");
console.log(`가입 사용자: ${email} (uid=${createdUid})`);
console.log(`콘솔 에러: ${consoleErrors.length}`);
consoleErrors.slice(0, 15).forEach((e) => console.log("  - " + e));
console.log(`페이지 에러: ${pageErrors.length}`);
pageErrors.slice(0, 15).forEach((e) => console.log("  - " + e));
console.log(`실패 요청(취소 제외): ${failedRequests.length}`);
failedRequests.slice(0, 15).forEach((e) => console.log("  - " + e));

if (consoleErrors.length || pageErrors.length || failedRequests.length) exitCode = 1;
console.log(exitCode === 0 ? "\nSMOKE: PASS" : "\nSMOKE: FAIL");
process.exit(exitCode);
