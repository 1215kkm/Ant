"use client";

import { useState } from "react";
import Link from "next/link";
import { SplashScreen } from "@/components/feature/splash/SplashScreen";
import { Icon } from "@/components/ui/Icon";

export default function HomePage() {
  const [splashed, setSplashed] = useState(false);

  return (
    <>
      {!splashed && <SplashScreen onDone={() => setSplashed(true)} />}

      <main className="mx-auto flex min-h-screen max-w-screen-sm flex-col bg-white">
        {/* 헤더 */}
        <header className="flex items-center gap-3 px-4 pt-6 pb-4">
          <img src="/brand/ant-clean-logo.svg" alt="" className="h-10 w-10" />
          <div>
            <h1 className="text-xl font-semibold text-brand-900">개미청소</h1>
            <p className="text-sm text-brand-700">건물관리 앱</p>
          </div>
        </header>

        {/* 히어로 카드 */}
        <section className="px-4">
          <div className="rounded-2xl bg-brand-50 p-6">
            <p className="text-base text-brand-900">
              깨끗한 건물,{" "}
              <span className="font-semibold text-brand-700">개미처럼 꼼꼼하게</span>
            </p>
            <p className="mt-2 text-sm text-brand-700">
              수리 요청, 관리비 알림, 자동 보고서를 한 곳에서.
            </p>
          </div>
        </section>

        {/* 빠른 액션 (Phase 진행에 따라 실제 라우트로 연결) */}
        <section className="mt-6 px-4">
          <h2 className="mb-3 text-sm text-brand-700">빠른 메뉴</h2>
          <div className="grid grid-cols-2 gap-3">
            <QuickLink href="/requests/new" name="build" label="수리 요청" />
            <QuickLink href="/requests" name="list_alt" label="요청 목록" />
            <QuickLink href="/blog" name="auto_stories" label="청소 블로그" />
            <QuickLink href="/login" name="login" label="로그인" />
          </div>
        </section>

        {/* 안내 */}
        <section className="mt-8 px-4 pb-24">
          <div className="rounded-xl border border-brand-100 bg-white p-4">
            <div className="flex items-start gap-3">
              <Icon name="info" className="text-brand-500" />
              <div>
                <p className="text-base text-brand-900">
                  현재는 Phase 0 미리보기입니다.
                </p>
                <p className="mt-1 text-sm text-brand-700">
                  로그인·요청·블로그 기능은 단계적으로 활성화됩니다.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 하단 탭 자리표시자 */}
        <BottomTabPlaceholder />
      </main>
    </>
  );
}

function QuickLink({
  href,
  name,
  label,
}: {
  href: string;
  name: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex min-h-tap items-center gap-3 rounded-xl border border-brand-100 bg-white px-4 py-4 text-base text-brand-900 transition active:bg-brand-50"
    >
      <Icon name={name} className="text-brand-500" />
      <span>{label}</span>
    </Link>
  );
}

function BottomTabPlaceholder() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 mx-auto flex max-w-screen-sm items-stretch border-t border-brand-100 bg-white/95 backdrop-blur"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="하단 탭"
    >
      <TabItem name="home" label="홈" filled active />
      <TabItem name="list_alt" label="요청" />
      <TabItem name="auto_stories" label="블로그" />
      <TabItem name="person" label="내정보" />
    </nav>
  );
}

function TabItem({
  name,
  label,
  active,
  filled,
}: {
  name: string;
  label: string;
  active?: boolean;
  filled?: boolean;
}) {
  return (
    <button
      type="button"
      className={
        "flex min-h-tap flex-1 flex-col items-center justify-center gap-1 px-2 py-2 text-xs " +
        (active ? "text-brand-600" : "text-brand-900/60")
      }
    >
      <Icon name={name} filled={filled && active} size={24} />
      <span>{label}</span>
    </button>
  );
}
