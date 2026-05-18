#!/usr/bin/env node
/**
 * 첫 슈퍼관리자 부트스트랩 스크립트.
 *
 * 신규 가입자는 모두 role='resident'로 생성되고, 역할 변경(setUserRole)은
 * sm:true 클레임 보유자만 가능하므로 최초 1명은 수동 승격이 필요하다.
 * 이 스크립트는 대상 사용자를 super_manager로 승격한다:
 *   - Firestore users/{uid}.role = "super_manager"
 *   - Custom claims = { role:"super_manager", bIds:[], sm:true }
 *     (functions/src/services/claims.ts 의 syncClaimsForUser 결과와 동일)
 *
 * 사용 전 준비 (1회):
 *   Firebase 콘솔 > 프로젝트 설정 > 서비스 계정 > "새 비공개 키 생성"
 *   → 받은 JSON을 프로젝트 루트에 serviceAccountKey.json 으로 저장
 *   (또는 아무 경로에 두고 --key <경로> 로 지정 / GOOGLE_APPLICATION_CREDENTIALS 환경변수)
 *
 * 실행:
 *   node scripts/bootstrap-super-admin.mjs <대상이메일>
 *   node scripts/bootstrap-super-admin.mjs rute20002@gmail.com --key C:\path\key.json
 *   npm run bootstrap:admin -- rute20002@gmail.com
 *
 * 대상 사용자는 먼저 앱에서 1회 가입(로그인)되어 있어야 한다.
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { initializeApp, cert, applicationDefault } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";

const PROJECT_ID = "ant-cleaning";

function parseArgs(argv) {
  const args = { email: null, key: null };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--key") args.key = argv[++i];
    else if (a.startsWith("--key=")) args.key = a.slice("--key=".length);
    else if (!a.startsWith("-") && !args.email) args.email = a;
  }
  return args;
}

function fail(msg) {
  console.error(`\n❌ ${msg}\n`);
  process.exit(1);
}

const { email, key } = parseArgs(process.argv);

if (!email) {
  fail(
    ' 대상 이메일을 인자로 주세요.\n   예) node scripts/bootstrap-super-admin.mjs admin@example.com',
  );
}

const NO_CRED_HELP =
  "자격증명이 없습니다.\n" +
  "   Firebase 콘솔 > 프로젝트 설정 > 서비스 계정 > '새 비공개 키 생성' 으로\n" +
  "   JSON을 받아 프로젝트 루트에 serviceAccountKey.json 으로 저장한 뒤 다시 실행하세요.\n" +
  "   (또는 --key <경로> 인자, 혹은 GOOGLE_APPLICATION_CREDENTIALS 환경변수)";

// 자격증명 해석: --key > GOOGLE_APPLICATION_CREDENTIALS > ./serviceAccountKey.json > gcloud ADC
let credential;
const defaultKeyPath = resolve(process.cwd(), "serviceAccountKey.json");
const gacEnv = process.env.GOOGLE_APPLICATION_CREDENTIALS;
const adcWellKnown = process.env.APPDATA
  ? resolve(process.env.APPDATA, "gcloud", "application_default_credentials.json")
  : null;
const keyPath = key
  ? resolve(key)
  : gacEnv
    ? resolve(gacEnv)
    : existsSync(defaultKeyPath)
      ? defaultKeyPath
      : null;

if (keyPath) {
  if (!existsSync(keyPath)) fail(`서비스 계정 키 파일을 찾을 수 없습니다: ${keyPath}`);
  try {
    credential = cert(JSON.parse(readFileSync(keyPath, "utf8")));
    console.log(`🔑 서비스 계정 키 사용: ${keyPath}`);
  } catch (e) {
    fail(`키 JSON 파싱 실패: ${e.message}`);
  }
} else if (adcWellKnown && existsSync(adcWellKnown)) {
  // gcloud auth application-default login 으로 만든 ADC 파일이 있을 때만 사용.
  // (applicationDefault()는 자격증명이 없어도 즉시 throw하지 않으므로 파일 존재를 직접 확인한다.)
  credential = applicationDefault();
  console.log(`🔑 Application Default Credentials 사용: ${adcWellKnown}`);
} else {
  fail(NO_CRED_HELP);
}

initializeApp({ credential, projectId: PROJECT_ID });

const auth = getAuth();
const db = getFirestore();

try {
  console.log(`\n🔎 사용자 조회: ${email}`);
  let userRecord;
  try {
    userRecord = await auth.getUserByEmail(email);
  } catch (e) {
    if (e?.code === "auth/user-not-found") {
      fail(
        `Auth에 '${email}' 사용자가 없습니다.\n` +
          "   대상 사용자가 먼저 앱(http://localhost:3000)에서 1회 가입/로그인해야 합니다.",
      );
    }
    // 자격증명/권한/네트워크 오류 — 실제 원인을 그대로 노출한다.
    fail(`Auth 호출 실패 (${e?.code || "unknown"}): ${e?.message || e}\n\n   ${NO_CRED_HELP}`);
  }

  const { uid } = userRecord;
  const ref = db.doc(`users/${uid}`);
  const snap = await ref.get();

  if (snap.exists) {
    await ref.update({ role: "super_manager", updatedAt: FieldValue.serverTimestamp() });
    console.log(`📄 Firestore users/${uid} 업데이트 (role → super_manager)`);
  } else {
    // onUserCreated 가 못 만든 엣지 케이스 보정 — 문서 형태를 동일하게 맞춘다.
    await ref.set({
      uid,
      email: userRecord.email ?? null,
      phoneNumber: userRecord.phoneNumber ?? null,
      displayName: userRecord.displayName ?? null,
      role: "super_manager",
      buildingIds: [],
      pushEnabled: false,
      locale: "ko-KR",
      createdAt: Timestamp.now(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    console.log(`📄 Firestore users/${uid} 신규 생성 (role = super_manager)`);
  }

  const claims = { role: "super_manager", bIds: [], sm: true };
  await auth.setCustomUserClaims(uid, claims);
  console.log(`🏷️  Custom claims 설정: ${JSON.stringify(claims)}`);

  console.log(
    `\n✅ 완료. ${email} (uid=${uid}) 는 이제 슈퍼관리자입니다.\n` +
      "   해당 계정을 로그아웃 후 다시 로그인하면 권한이 적용됩니다.\n" +
      "   이후 앱 내 /admin/users 에서 다른 사용자 역할을 부여할 수 있습니다.\n",
  );
  process.exit(0);
} catch (e) {
  fail(`예상치 못한 오류: ${e?.stack || e}`);
}
