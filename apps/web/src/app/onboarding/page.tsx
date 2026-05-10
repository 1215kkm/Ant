"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthProvider";
import { ROLE_LABEL_KO } from "@/lib/auth/roles";
import { Icon } from "@/components/ui/Icon";

/**
 * 신규 가입자 또는 역할이 부여되지 않은 사용자가 머무는 화면.
 * onUserCreated가 기본 'resident' 역할을 부여하므로 일반적으로는 즉시 메인으로 이동한다.
 */
export default function OnboardingPage() {
  const { user, claims, loading, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (claims?.role) {
      router.replace("/");
    }
  }, [user, claims, loading, router]);

  return (
    <main className="mx-auto flex min-h-screen max-w-screen-sm flex-col items-center justify-center bg-white px-4 text-center">
      <Icon name="schedule" size={48} className="text-brand-500" />
      <h1 className="mt-4 text-xl font-semibold text-brand-900">
        계정 준비 중
      </h1>
      <p className="mt-2 text-sm text-brand-700">
        관리자가 역할을 배정한 후 이용하실 수 있습니다.
      </p>
      {claims && (
        <p className="mt-4 text-sm text-brand-700">
          현재 권한: {claims.role ? ROLE_LABEL_KO[claims.role] : "미지정"}
        </p>
      )}
      <button
        type="button"
        onClick={signOut}
        className="mt-8 inline-flex min-h-tap items-center rounded-xl border border-brand-200 px-4 py-2 text-sm text-brand-700"
      >
        로그아웃
      </button>
    </main>
  );
}
