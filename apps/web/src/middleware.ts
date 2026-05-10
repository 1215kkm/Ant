import { NextResponse, type NextRequest } from "next/server";

/**
 * Next.js 미들웨어 — 매우 가벼운 가드.
 * Firebase 토큰의 무결성/역할 검증은 클라이언트(`RequireAuth`)에서 수행한다.
 * 미들웨어에서는 명백히 공개인 경로를 통과시키고, 그 외엔 통과 후
 * 클라이언트 가드가 로그인 페이지로 보내는 흐름을 따른다.
 *
 * 이 단계에서는 로깅/헤더 셋팅 정도만 수행한다.
 */
export function middleware(req: NextRequest) {
  const res = NextResponse.next();
  res.headers.set("x-frame-options", "DENY");
  res.headers.set("x-content-type-options", "nosniff");
  res.headers.set("referrer-policy", "strict-origin-when-cross-origin");
  return res;
}

export const config = {
  matcher: [
    /*
     * 매니페스트, 서비스워커, 정적자원, API 라우트는 미들웨어를 우회.
     */
    "/((?!_next/static|_next/image|favicon.ico|sw.js|workbox-.*|manifest.webmanifest|icons/.*|brand/.*).*)",
  ],
};
