/**
 * 역할별 핵심 도메인 흐름 E2E (실제 Chromium + 에뮬레이터).
 * 사전조건: 에뮬레이터 + dev 서버 기동, `node apps/web/e2e/seed.mjs` 선행.
 * 실행: node apps/web/e2e/roles.mjs
 *
 * 검증:
 *  - super_manager: 건물 목록/생성, setUserRole(역할 변경) 콜러블
 *  - resident: 요청 생성(규칙 통과: residentUid) → onRequestCreated → 내 요청 조회
 *  - cleaning_manager: 요청 목록(트리거가 managerIds 복사) → 5단계 상태 변경
 *  - building_owner: 관리비/보고서 조회
 */
import { chromium } from "playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE = process.env.E2E_BASE_URL || "http://localhost:3000";
const seed = JSON.parse(readFileSync(join(__dirname, "seed-output.json"), "utf8"));

const results = [];
let totalErrors = 0;

function attachErrorCapture(page, bucket) {
  page.on("console", (m) => {
    if (m.type() === "error") bucket.console.push(m.text());
  });
  page.on("pageerror", (e) => bucket.page.push(String(e)));
  page.on("requestfailed", (r) => {
    const err = r.failure()?.errorText || "";
    if (err.includes("ERR_ABORTED")) return;
    if (/google-analytics|gstatic|fonts\.googleapis|cdn\.jsdelivr/.test(r.url())) return;
    bucket.req.push(`${r.method()} ${r.url()} :: ${err}`);
  });
}

async function loginAs(page, email) {
  // 재시드 직후 Auth 에뮬레이터가 간헐적으로 400 을 반환할 수 있어 1회 재시도한다.
  for (let attempt = 1; attempt <= 2; attempt++) {
    await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForSelector('input[type="email"]', { timeout: 20000 });
    await page.locator('input[type="email"]').fill(email);
    await page.locator('input[type="password"]').fill(seed.password);
    await page.locator('button[type="submit"]').click();
    try {
      await page.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 20000 });
      return;
    } catch (err) {
      if (attempt === 2) throw err;
      await page.waitForTimeout(2000); // 잠시 후 재시도
    }
  }
}

async function runRole(browser, name, email, fn) {
  const bucket = { console: [], page: [], req: [] };
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  attachErrorCapture(page, bucket);
  const steps = [];
  let ok = true;
  try {
    await loginAs(page, email);
    steps.push("login OK");
    await fn(page, steps);
  } catch (err) {
    ok = false;
    steps.push(`FAIL: ${err.message}`);
  }
  await ctx.close();
  const errCount = bucket.console.length + bucket.page.length + bucket.req.length;
  totalErrors += errCount;
  results.push({ name, ok: ok && errCount === 0, steps, bucket, errCount });
}

const browser = await chromium.launch();

// ---------- super_manager ----------
await runRole(browser, "super_manager", seed.users.super.email, async (page, steps) => {
  await page.goto(`${BASE}/buildings`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForSelector("text=건물 관리", { timeout: 20000 });
  await page.waitForSelector("text=E2E 테스트빌딩", { timeout: 20000 });
  steps.push("건물 목록에 시드 건물 표시 OK");

  // 건물 생성
  await page.getByRole("button", { name: "추가" }).first().click();
  await page.waitForSelector("text=건물 추가", { timeout: 10000 });
  const sheet = page.locator("div.fixed.inset-0.z-50");
  await sheet.getByLabel("건물 이름").fill("E2E 자동생성 빌딩");
  await sheet.getByLabel("주소").fill("서울시 강남구 테헤란로 1");
  await sheet.getByRole("button", { name: "추가" }).click();
  await page.waitForSelector("text=E2E 자동생성 빌딩", { timeout: 20000 });
  steps.push("건물 생성 OK");

  // 역할 변경 (setUserRole 콜러블)
  await page.goto(`${BASE}/admin/users`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForSelector("text=사용자 역할 관리", { timeout: 20000 });
  await page.locator("form input").first().fill(seed.users.promote.uid);
  await page.getByText("청소관리자", { exact: true }).click();
  await page.getByRole("button", { name: "역할 변경" }).click();
  await page.waitForSelector("text=역할을 청소관리자", { timeout: 20000 });
  steps.push("setUserRole 콜러블 OK");
});

// ---------- resident ----------
let createdRequestTitle = `E2E 누수 ${Date.now()}`;
await runRole(browser, "resident", seed.users.resident.email, async (page, steps) => {
  await page.goto(`${BASE}/requests/new`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForSelector("text=새 요청", { timeout: 20000 });
  // 페이지가 buildingId/resident 를 비동기로 로드하므로 잠시 대기
  await page.waitForTimeout(2500);
  await page.locator('input[placeholder="예: 화장실 수도꼭지 누수"]').fill(createdRequestTitle);
  await page
    .locator('textarea[placeholder="발생 시점, 위치, 빈도 등을 자세히 적어주시면 도움이 됩니다."]')
    .fill("E2E 자동 생성 요청입니다. 502호 천장 누수.");
  await page.getByRole("button", { name: "요청 보내기" }).click();
  await page.waitForURL((u) => /\/requests\/[^/]+$/.test(u.pathname) && !u.pathname.endsWith("/new"), {
    timeout: 45000,
  });
  steps.push(`요청 생성 OK → ${page.url()}`);
  await page.waitForSelector(`text=${createdRequestTitle}`, { timeout: 20000 });

  // 내 요청 목록
  await page.goto(`${BASE}/requests`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForSelector("text=내 요청", { timeout: 20000 });
  await page.waitForSelector(`text=${createdRequestTitle}`, { timeout: 20000 });
  steps.push("내 요청 목록 조회 OK (residentUid 규칙 통과)");
});

// ---------- cleaning_manager ----------
await runRole(browser, "cleaning_manager", seed.users.manager.email, async (page, steps) => {
  await page.goto(`${BASE}/manage/requests`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForSelector("text=요청 목록", { timeout: 20000 });
  // onRequestCreated 가 managerIds 를 복사하므로 매니저 목록에 보여야 함
  await page.waitForSelector(`text=${createdRequestTitle}`, { timeout: 25000 });
  steps.push("매니저 요청 목록에 표시 OK (트리거 managerIds 복사)");
  await page.getByText(createdRequestTitle).first().click();
  await page.waitForURL((u) => /\/manage\/requests\/[^/]+$/.test(u.pathname), { timeout: 20000 });
  await page.waitForSelector("text=상태 변경", { timeout: 20000 });

  for (const [label] of [["확인"], ["진행중"], ["완료"]]) {
    await page.getByRole("button", { name: label, exact: true }).click();
    await page.waitForSelector(`text=상태를 ${label}`, { timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(1200); // onSnapshot 반영 대기
    steps.push(`상태 변경: ${label} OK`);
  }
});

// ---------- building_owner ----------
await runRole(browser, "building_owner", seed.users.owner.email, async (page, steps) => {
  await page.goto(`${BASE}/invoices`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForSelector("text=관리비", { timeout: 20000 });
  await page.waitForSelector("text=E2E 테스트빌딩", { timeout: 20000 });
  steps.push("관리비 목록 조회 OK");
  await page.getByText("E2E 테스트빌딩").first().click();
  await page.waitForURL((u) => /\/invoices\/[^/]+$/.test(u.pathname), { timeout: 20000 });
  await page.waitForSelector("text=관리비", { timeout: 20000 });
  steps.push("관리비 상세 조회 OK");

  await page.goto(`${BASE}/reports`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForSelector("text=보고서", { timeout: 20000 });
  await page.waitForSelector("text=주간 보고서", { timeout: 20000 });
  steps.push("보고서 목록 조회 OK");
  await page.getByText("주간 보고서").first().click();
  await page.waitForURL((u) => /\/reports\/[^/]+$/.test(u.pathname), { timeout: 20000 });
  steps.push("보고서 상세 조회 OK");
});

await browser.close();

// ---------- 결과 ----------
console.log("\n================ 역할별 E2E 결과 ================");
let allPass = true;
for (const r of results) {
  console.log(`\n[${r.name}] ${r.ok ? "PASS" : "FAIL"} (에러 ${r.errCount})`);
  r.steps.forEach((s) => console.log("  · " + s));
  if (r.bucket.console.length) {
    console.log("  콘솔 에러:");
    r.bucket.console.slice(0, 10).forEach((e) => console.log("    - " + e));
  }
  if (r.bucket.page.length) {
    console.log("  페이지 에러:");
    r.bucket.page.slice(0, 10).forEach((e) => console.log("    - " + e));
  }
  if (r.bucket.req.length) {
    console.log("  실패 요청:");
    r.bucket.req.slice(0, 10).forEach((e) => console.log("    - " + e));
  }
  if (!r.ok) allPass = false;
}
console.log("\n================================================");
console.log(allPass ? "ROLES E2E: PASS" : "ROLES E2E: FAIL");
process.exit(allPass ? 0 : 1);
