# 이어서 작업하기 (다른 컴퓨터 포함)

이 문서 하나로 어느 PC에서든 작업을 이어갈 수 있다.
다른 PC에서 새 Claude Code 세션을 열고 **"PR #1과 docs/RESUME.md 보고 이어서 해줘"** 라고 하면 된다.

## 현재 상태 (2026-05-18 기준)

- 브랜치 **`fix/role-flows-and-build`**, **PR #1** (`https://github.com/1215kkm/Ant/pull/1`)
- "실제 오류 없이 작동" 목표로 구현-테스트-확인-수정-반복 사이클 수행, 기능 파괴급 버그 6종 수정·검증 완료
- 검증: typecheck 0 / 빌드 25페이지 exit 0 / 역할 E2E **super·resident·manager·owner 4/4 PASS (에러 0)**
- 범위: 코드 + **로컬 에뮬레이터** 검증까지. 실제 클라우드 배포는 미수행(아래 참고).

수정한 버그 요약: 커밋 `git log` 및 PR 본문 참고. 핵심:
1. Node 24 → Next 15.5 SWC 네이티브 빌드 크래시 → **Node 20 고정** (Node 24 절대 금지)
2. `beforeUserCreated` 가 claims 못 박던 문제 → `return { customClaims }`
3. `requests` 의 `residentId`/`residentUid` 과적재 분리
4. **Firestore 규칙은 필터가 아님** — 목록 쿼리를 쿼리-증명 가능 필드로 재설계
5. 누락 복합 인덱스 3건
6. sitemap force-dynamic, 홈 403, 에뮬레이터 연동, emulators 스크립트

## 1. 새 PC 셋업

전제: Git, 그리고 **Node 20 또는 22 LTS** (Node 23/24 금지 — SWC 크래시).

```powershell
# 1) 코드 받기
git clone https://github.com/1215kkm/Ant.git
cd Ant
git checkout fix/role-flows-and-build

# 2) 의존성
npm install

# 3) JDK 설치 (Firebase 에뮬레이터 필수, JDK 11+)
winget install --id EclipseAdoptium.Temurin.21.JDK -e --silent --accept-package-agreements --accept-source-agreements

# 4) (Node 20 포터블이 필요할 때만) — 시스템 Node 가 20/22 면 생략
#   nodejs.org 에서 node-v20.x-win-x64.zip 받아 .tools\ 에 풀고 PATH 앞에 둔다.

# 5) Playwright 브라우저 (E2E 실행 시)
npx playwright install chromium
```

### `apps/web/.env.local` 생성 (gitignore 됨 — 반드시 직접 생성)

`apps/web/.env.local.example` 를 복사해도 되고, 로컬 에뮬레이터용은 아래 그대로 사용:

```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDEMO-local-emulator-placeholder-0000
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=ant-cleaning.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=ant-cleaning
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=ant-cleaning.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=000000000000
NEXT_PUBLIC_FIREBASE_APP_ID=1:000000000000:web:0000000000000000000000
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=
NEXT_PUBLIC_FIREBASE_VAPID_KEY=
NEXT_PUBLIC_FIREBASE_USE_EMULATOR=true
NEXT_PUBLIC_FIREBASE_APP_CHECK_SITE_KEY=
NEXT_PUBLIC_FIREBASE_APP_CHECK_DEBUG=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
TELEGRAM_BOT_USERNAME=AntCleaningBot
```

### firebase webframeworks 실험 활성 (PC별 1회)

```powershell
npx firebase experiments:enable webframeworks
```

## 2. 로컬 실행 (보기)

> Node 20/22 가 PATH 에 있어야 한다. 포터블 사용 시 각 명령 앞에
> `$env:Path = "<...>\.tools\node-v20.x-win-x64;" + $env:Path` 를 붙인다.

```powershell
# 터미널 A — 에뮬레이터 (JDK 필요)
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-21.0.11.10-hotspot"
$env:Path = "$env:JAVA_HOME\bin;" + $env:Path
npx firebase emulators:start --only auth,firestore,functions,storage --project ant-cleaning

# 터미널 B — dev 서버
npm run dev

# 터미널 C — 로그인용 테스트 데이터 시드
node apps/web/e2e/seed.mjs
```

브라우저에서 **http://localhost:3000** → 이메일 로그인.
계정(모두 비번 `test1234`): `e2e-super@example.com`(슈퍼), `e2e-manager@example.com`(청소관리자),
`e2e-owner@example.com`(건물주), `e2e-resident@example.com`(거주자).
에뮬레이터 데이터 확인: **http://127.0.0.1:4000**

## 3. 검증 (변경 후)

```powershell
npm run typecheck                 # web + functions, exit 0
npm run build                     # 25/25 페이지, exit 0  (dev 서버 끄고 실행: .next 잠금 충돌)
node apps/web/e2e/smoke.mjs       # SMOKE: PASS
node apps/web/e2e/seed.mjs        # SEED OK
node apps/web/e2e/roles.mjs       # ROLES E2E: PASS (4/4, 에러 0)
```

## 4. 자주 막히는 지점

- **Node 24** 로 빌드/실행 시 네이티브 크래시(`STATUS_STACK_BUFFER_OVERRUN`). → Node 20/22 사용.
- `next build` 가 `EPERM .next\trace` → dev 서버가 `.next` 점유 중. dev 끄고 `.next` 삭제 후 재빌드.
- 에뮬레이터가 `Cannot emulate a web framework` → `firebase experiments:enable webframeworks`.
- 포트 점유(3000/8080/9099 등) → 이전 프로세스 잔존. 해당 PID 종료 후 재기동.
- 새 컬렉션/쿼리 추가 시: 비-슈퍼가 `list` 하는 쿼리라면, 보안 규칙이 그 쿼리의
  array-contains/equality 필드만으로 통과 가능한지 반드시 점검 (규칙은 필터가 아님).

## 5. 남은 작업 / 범위 밖

실제 클라우드 배포는 미수행. 필요 시(사용자 본인이 직접):
- `firebase login` (브라우저 OAuth)
- Firebase 콘솔의 **실제 키/시크릿** → `.env.local` 교체, `NEXT_PUBLIC_FIREBASE_USE_EMULATOR` 제거
- Cloud Functions/스케줄러용 **Blaze 요금제** 활성
- 텔레그램 봇 토큰, 이메일 SMTP 등 시크릿 설정
- 배포: `firebase deploy` (rules/indexes/functions/hosting)

추가 검증 후보(미수행): Storage 미디어 업로드, 인앱 알림, 텔레그램 연동, 블로그 작성 흐름.
