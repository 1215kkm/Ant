import { NextResponse, type NextRequest } from "next/server";

/**
 * 로그인 사용자에게만 SSR/RSC HTML을 보여줘야 하는 경로.
 * JS 끄거나 RSC 페이로드 직접 요청 시에도 노출되지 않도록 서버측 리다이렉트한다.
 * 토큰 무결성/역할 검증은 여전히 클라이언트(`RequireAuth`)·Firestore 규칙이 책임진다.
 */
const PROTECTED_PREFIXES = [
  "/admin",
  "/manage",
  "/buildings",
  "/dashboard",
  "/settings",
  "/notifications",
  "/requests",
];

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isProtected(pathname)) {
    const hasAuth = req.cookies.get("__ant_auth")?.value === "1";
    if (!hasAuth) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname + req.nextUrl.search);
      return NextResponse.redirect(url);
    }
  }

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
