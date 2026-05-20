# 코드 감사 핸드오프 (2026-05-20)

> 목적: Cowork에서 수행한 백엔드·프론트엔드 정밀 감사 결과를 **터미널 Claude Code**가
> 그대로 이어받아 *확인 → 수정 → 빌드 → E2E*까지 처리하도록 정리한 문서.
>
> **터미널에서 시작하는 법:** 새 Claude Code 세션에서
> `"docs/AUDIT-HANDOFF.md 보고, 각 항목을 코드로 확인한 뒤 우선순위대로 고쳐줘. 추측 수정 금지, 수정 후 typecheck/build/E2E로 검증"` 라고 요청.

## 0. 현재 상태 (검증된 기준선)

- 코드는 마지막 검증 통과 main과 동일. git 의 "modified 122개"는 **전부 CRLF↔LF 줄바꿈 차이**이며 실제 변경 0건
  (`git diff --ignore-all-space --stat` → 빈 결과로 확인). 필요하면 `.gitattributes`로 EOL 정책 고정 권장.
- Cowork(리눅스 샌드박스)에서 통과 확인: **web typecheck ✅ / functions typecheck ✅ / functions tsc build ✅**
- Cowork에서 **불가**(환경 제약, Windows에서 실행해야 함): `next build`, `next lint`, Firebase 에뮬레이터, Playwright E2E
  - 이유: node_modules가 Windows용 SWC 바이너리로 설치됨 + 샌드박스 외부 다운로드 차단.

## 1. 백엔드 펀치리스트 (functions + 규칙/인덱스)

각 항목은 *감사 결과*이며, 수정 전 **반드시 해당 파일을 열어 라인·로직을 직접 재확인**할 것.

### CRITICAL
1. **통계 카운터 손상 (dotted key)** — `functions/src/triggers/onRequestStatusChanged.ts`, `onRequestCreated.ts`
   - `set(..., {merge:true})` 안에서 `{ "byStatus.received": increment(1) }`처럼 점 든 키를 *중첩 객체*로 넣으면
     Firestore가 `stats.byStatus.received`가 아니라 `"byStatus.received"`라는 이름의 단일 필드를 만든다.
   - 수정: 중첩 객체 대신 `update()` + 최상위 점 경로 `{"stats.byStatus.received": FieldValue.increment(1)}` 사용.
2. **텔레그램 웹훅 미검증 public 노출** — `functions/src/http/telegramWebhook.ts`
   - `invoker:"public"`인데 secret-token 검증이 없어 위조 업데이트(예: `/start <code>`) 주입으로 계정 연동 탈취 가능.
   - 수정: `setWebhook` 시 `secret_token` 설정 + 핸들러에서 `X-Telegram-Bot-Api-Secret-Token` 헤더 검증.
3. **invoices update 권한 가드 부족** — `firestore.rules` (invoices 블록)
   - `update`에 `affectedKeys().hasOnly([...])` 가드와 `recipients` 자기수신 방지 검증 추가.

### HIGH
4. **누락 복합 인덱스** — `firestore.indexes.json`
   - `functions/src/services/reportBuilder.ts`의 invoices 쿼리: `buildingId ==` + `createdAt >=/<` →
     `invoices(buildingId ASC, createdAt DESC)` 인덱스 필요. 현재 없음 → 런타임 FAILED_PRECONDITION.
5. **managerIds 역할 필터 누락** — `functions/src/triggers/onMembershipChanged.ts`
   - 모든 활성 멤버십을 `building.managerIds`에 넣어, 매니저 아닌 사용자에게 건물 접근·알림 권한 누출.
   - 수정: `.where("role","==","cleaning_manager")`로 필터링해 managerIds 산출.
6. **알림/독촉 비멱등 + 카운터 과증가** — `functions/src/scheduled/invoiceReminderJob.ts`, `triggers/onInvoiceCreated.ts`
   - 재시도 시 푸시 중복 발송·`remindersSent` 중복 증가. 트랜잭션 + `lastReminderAt`/`status` CAS로 가드.
7. **setUserRole 비원자적 + 자기강등 방지 없음** — `functions/src/callable/setUserRole.ts`
   - 마지막/본인 super_manager 강등 차단, 문서+감사 트랜잭션 후 claims 동기화.
8. **setUserRole `enforceAppCheck:false`** — 가장 민감한 권한 부여 콜러블에 App Check 미적용. (Phase 9와 연계)

### MEDIUM
9. owner의 `/requests` 목록 규칙이 쿼리로 증명 불가(`inBuilding`) — array-contains 가능한 필드(`ownerIds` 등)로 재설계. `firestore.rules`
10. `reportBuilder.ts` — 전송 실패해도 `emailedAt/telegramSentAt`를 무조건 기록 → settled 결과 확인 후 성공 채널만 스탬프.
11. 알림 recipient가 `update`로 임의 필드 변경 가능 — `affectedKeys().hasOnly(['read','readAt'])`로 제한. `firestore.rules`
12. `reportJobs.ts` monthlyReportJob의 월 경계가 UTC(`Date.UTC`) → KST로 계산(9h 시프트로 경계일 누락/포함 오류).
13. `mailer.ts` — transporter 캐시가 시크릿 회전 후에도 유지, `secure:false` 하드코딩(465 포트 불일치). 포트로 secure 유도.

### LOW
14. `counters.ts`/`onRequestCreated.ts` 요청번호 연도가 UTC `getFullYear()` → 연말 KST에서 잘못된 연도 버킷. Asia/Seoul로.
15. `claims.ts` buildingIds 30개 초과 무음 절단 → `bIdsTruncated` claim 플래그 + 규칙/UI 처리.
16. `findUserByContact.ts` — 매니저에 의한 사용자 열거 가능 → 감사 로그/레이트리밋 고려.
17. `firestoreBackup.ts` — `getAccessToken()` null 미검증 → `Bearer null` 실패. null 가드.

## 2. 프론트엔드 펀치리스트 (apps/web)

### CRITICAL
1. **홈 "처리 대기" 카운트 오류** — `apps/web/src/app/page.tsx` (TodaySection)
   - `where("status","in",["open","in_progress","scheduled"])` 인데 유효 상태는 `received|confirmed|in_progress|completed|on_hold`
     (`lib/types.ts`). `open`/`scheduled`는 존재하지 않아 `received`/`confirmed` 누락.
   - 수정: `["received","confirmed","in_progress"]`.
2. **middleware 서버측 권한 가드 없음** — `apps/web/src/middleware.ts`
   - 헤더만 설정하고 인증/역할 게이팅 0. 보호 라우트의 RSC/HTML이 클라이언트 리다이렉트 전 노출(JS 끄면 접근).
   - 수정: 세션 쿠키/역할 검증 후 미인증·미인가 요청 서버측 리다이렉트.

### HIGH
3. **매니저 추가 시 managerIds 미반영** — `app/(manager)/buildings/[bid]/page.tsx` + `lib/queries/buildings.ts`
   - memberships만 쓰고 `buildings.managerIds`에 uid push 안 함(항상 `[]`). 백엔드 동기화(백엔드 #5) 없으면 새 매니저에게 건물/요청 안 보임.
   - 수정: 멤버십 upsert 시 `arrayUnion`으로 managerIds 갱신, **또는** 백엔드 #5에서 동기화되도록 일원화.
4. **소유자 없는 건물에 청구서 발행 가능** — `lib/queries/invoices.ts` + `manage/invoices/new/page.tsx`
   - `ownerUids: building.ownerIds`가 `[]`이면 수신자 없는 청구서 생성·표시 불가. 제출 차단/경고 추가.
5. **invoices 페이지 useEffect 의존성 + 빈 상태 없음** — `manage/invoices/page.tsx`
   - `selectedBid`를 deps에 넣어 불필요 refetch, 건물 0개 매니저는 영구 빈 화면(발행 액션 숨김 = 데드엔드).

### MEDIUM
6. `requests/[id]` StatusFlow `indexOf(current)` 가 `on_hold`/미지정에서 `-1` — 가드 추가.
7. `URL.createObjectURL` 렌더 바디에서 호출·revoke 없음(`requests/new/page.tsx`, `PostEditor.tsx`, `BeforeAfterSlider`) → blob 누수. useMemo/useEffect + cleanup revoke.
8. 블로그 slug 유니크 미검증(`PostEditor.tsx`, `posts.ts`) → 중복 slug 시 한 글 도달 불가.
9. 홈 BottomTab "홈"이 라우트와 무관하게 항상 active 하드코딩(`page.tsx`) → `usePathname()`로 파생.
10. 로딩 상태가 거의 전부 맨 `<p>불러오는 중…</p>` 텍스트 → 공용 스켈레톤/헤더 보존 로더로.
11. `notifications/page.tsx` href 없을 때 `<Link href="#">` → 비링크 요소로.
12. 입력/세그먼트 토글에 `disabled`/focus-visible 상태 부족(`requests/new/page.tsx`) → 디자인 시스템 상태 정의 적용.

### LOW
13. 메모 낙관적 삽입에 `createdAt` 누락(`residents/[rid]/page.tsx`) → 클라 `Timestamp.now()` 또는 refetch.
14. `manage/requests/page.tsx` 무의미 useMemo. `listManagerRequests`의 array-contains+where+orderBy 복합 인덱스 배포 확인.
15. `EmptyState`/not-found에 error 아이콘 사용 → 중립 아이콘으로 의미 분리.

> 디자인 참고: 프로젝트는 글로벌(보라) 대신 **블루 brand 스케일 + Pretendard**로 의도적으로 오버라이드함
> (`.claude/knowledge/ui-designer/design-system.md`의 프로젝트 오버라이드 우선 규칙). 색상은 결함 아님.

## 3. Phase 9 남은 기능 (로드맵)

- App Check 도입(특히 민감 콜러블, 백엔드 #8과 연계)
- Firestore 일일 백업 운영 점검(`firestoreBackup.ts` #17 포함)
- 이용약관/개인정보처리방침 페이지(`(public)/terms`, `(public)/privacy`) 내용·링크 확정
- (Sentry는 DSN 확보 후 별도)

## 4. Windows 검증 절차 (수정 후 실행)

```powershell
# Node 20/22, JDK 11+ 필요. Node 24 금지(SWC 네이티브 크래시).
npm run typecheck                 # web + functions, exit 0
npm run build                     # 25/25 페이지, exit 0 (dev 서버 끄고 실행)
node apps/web/e2e/smoke.mjs       # SMOKE: PASS
# 에뮬레이터(터미널 A) 후:
#   $env:JAVA_HOME=...; npx firebase emulators:start --only auth,firestore,functions,storage --project ant-cleaning
node apps/web/e2e/seed.mjs        # SEED OK
node apps/web/e2e/roles.mjs       # ROLES E2E: PASS (4/4, 에러 0)
```

## 5. 권장 수정 순서

1. 데이터 무결성: 백엔드 #1(통계), #5(managerIds) + 프론트 #3(연계), 프론트 #1(홈 카운트)
2. 보안: 백엔드 #2(웹훅), #3/#9/#11(규칙), 프론트 #2(middleware)
3. 런타임 안정: 백엔드 #4(인덱스), #6(멱등), #12(KST)
4. Phase 9 + 나머지 MEDIUM/LOW + 디자인 상태 보강
5. 매 단계 후 §4 검증 루프
