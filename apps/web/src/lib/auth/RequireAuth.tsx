"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth/AuthProvider";
import type { Role } from "@/lib/auth/roles";

type Props = {
  /** 허용된 역할. 비어있으면 로그인만 요구 */
  roles?: Role[];
  /** 로딩 동안 표시할 노드 */
  fallback?: React.ReactNode;
  children: React.ReactNode;
};

/**
 * 클라이언트 가드. 로그인 또는 역할이 맞지 않으면 리다이렉트.
 * 미들웨어는 토큰만으로 역할을 알 수 없으므로 로그인 여부만 검사하고,
 * 세부 역할 체크는 이 컴포넌트가 담당.
 */
export function RequireAuth({ roles, fallback, children }: Props) {
  const { user, claims, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace(`/login?next=${encodeURIComponent(pathname || "/")}`);
      return;
    }
    if (roles && roles.length > 0) {
      const role = claims?.role;
      if (!role || !roles.includes(role)) {
        router.replace("/onboarding");
      }
    }
  }, [user, claims, loading, roles, router, pathname]);

  if (loading) {
    return (
      fallback || (
        <div className="flex min-h-screen items-center justify-center text-sm text-brand-700">
          잠시만 기다려 주세요…
        </div>
      )
    );
  }
  if (!user) return null;
  if (roles && roles.length > 0) {
    const role = claims?.role;
    if (!role || !roles.includes(role)) return null;
  }
  return <>{children}</>;
}
