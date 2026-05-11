# 개미청소 (Ant Cleaning) 건물관리 PWA

개미청소 회사가 운영하는 다수 건물의 수리/문의 요청, 관리비, 자동 보고서, 거주자 메모, 청소 블로그를 한 곳에서 처리하는 모바일 우선 PWA.

## 스택

- **Front**: Next.js 15 (App Router) + React 19 + TypeScript
- **Style**: Tailwind CSS, shadcn/ui, Pretendard, Google Material Symbols (Rounded)
- **PWA**: Serwist
- **Backend**: Firebase (Auth / Firestore / Storage / Functions / FCM / Cloud Scheduler), region `asia-northeast3`
- **Notifications**: 인앱 + FCM 푸시 + 텔레그램 봇 + 이메일

## 디자인 토큰

- 브랜드 컬러: 깨끗한 파랑 (`brand.500 = #2E9CF2`)
- 기본 폰트 크기: **16px**
- 인터랙션 영역: ≥ 44×44px
- 텍스트 위계 3단계: `text-xl` / `text-base` / `text-sm`

## 프로젝트 구조

```
apps/web/              Next.js 15 PWA
functions/             Firebase Cloud Functions (TS)
firestore.rules        Firestore 보안 규칙
firestore.indexes.json 복합 인덱스
storage.rules          Storage 보안 규칙
firebase.json          Firebase 설정
```

## 개발

```bash
# 1) 워크스페이스 의존성 설치
npm install

# 2) Firebase 에뮬레이터(Auth/Firestore/Functions/Storage)
npm run emulators

# 3) Next.js 개발 서버
npm run dev
```

`apps/web/.env.local.example`을 `.env.local`로 복사하고 Firebase 프로젝트 키를 채운다.

## Phase 로드맵

| Phase | 범위 |
|---|---|
| 0 ✅ | 모노레포·Tailwind·브랜드 토큰·스플래시·PWA 매니페스트·Functions 스캐폴드 |
| 1 ✅ | 인증 + 4개 역할 + Custom Claims |
| 2 ✅ | 건물·호실·거주자·다대다 멤버십 |
| 3 ✅ | 수리요청/문의 MVP (사진/영상, 5단계 상태) |
| 4 ✅ | FCM 푸시 + 텔레그램 봇 |
| 5 ✅ | 거주자 메모/태그 + 통계 대시보드 |
| 6 ✅ | 관리비 청구·납부·자동 독촉 |
| 7 ✅ | 주간/월간 자동 보고서 (PDF + 이메일/텔레그램) |
| 8 ✅ | 청소 블로그 (전·후 슬라이더, OG/RSS) |
| 9 🟡 | App Check, Firestore 일일 백업, 이용약관/개인정보처리방침. Sentry는 DSN 확보 후 별도 작업 |

상세 계획: `/root/.claude/plans/goofy-cuddling-pike.md`
