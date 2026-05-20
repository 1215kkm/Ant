"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { collection, getCountFromServer, query, where } from "firebase/firestore";
import { SplashScreen } from "@/components/feature/splash/SplashScreen";
import { AntMascot } from "@/components/feature/character/AntMascot";
import { Icon } from "@/components/ui/Icon";
import { useAuth, type AuthClaims } from "@/lib/auth/AuthProvider";
import { ROLE_LABEL_KO, isManagerRole } from "@/lib/auth/roles";
import type { User } from "firebase/auth";
import { db } from "@/lib/firebase/client";

export default function HomePage() {
  const [splashed, setSplashed] = useState(false);
  const { user, claims, loading, signOut } = useAuth();
  const router = useRouter();
  const isManager = isManagerRole(claims?.role);
  const isSuper = claims?.sm === true;

  return (
    <>
      {!splashed && <SplashScreen onDone={() => setSplashed(true)} />}

      <main className="mx-auto flex min-h-screen max-w-screen-sm flex-col bg-sky-soft pb-28">
        <Header
          user={user}
          loading={loading}
          claims={claims}
          onSignOut={async () => {
            await signOut();
            router.refresh();
          }}
        />

        <CharacterCard
          isLoggedIn={!!user}
          userName={user?.displayName || user?.email?.split("@")[0]}
        />

        <section className="px-4 pt-5">
          <Link
            href="/requests/new"
            className="flex min-h-tap items-center justify-center rounded-3xl bg-brand-900 px-6 py-5 text-base font-semibold text-white shadow-lg shadow-brand-900/20 transition active:scale-[0.98] active:bg-brand-800"
          >
            <Icon name="add_task" size={24} className="mr-2" />
            새 수리/문의 요청 작성
          </Link>
          <p className="mt-2 text-center text-sm text-brand-700/80">
            사진·영상 첨부 · 평균 답변 25분
          </p>
        </section>

        <TodaySection
          isManager={isManager}
          isSuper={isSuper}
          role={claims?.role}
          uid={user?.uid}
        />

        <QuickActions isSuper={isSuper} isManager={isManager} />

        <BottomTab />
      </main>
    </>
  );
}

function Header({
  user,
  claims,
  loading,
  onSignOut,
}: {
  user: User | null;
  claims: AuthClaims | null;
  loading: boolean;
  onSignOut: () => void | Promise<void>;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const today = mounted
    ? new Intl.DateTimeFormat("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "short",
      }).format(new Date())
    : "";

  const greeting = mounted
    ? (() => {
        const h = new Date().getHours();
        if (h < 6) return "좋은 새벽이에요";
        if (h < 12) return "좋은 아침이에요";
        if (h < 18) return "좋은 오후예요";
        return "좋은 저녁이에요";
      })()
    : "";

  return (
    <header className="flex items-start justify-between px-5 pb-2 pt-6">
      <div className="flex-1">
        <p className="text-xl font-semibold text-brand-900">{greeting}</p>
        <p className="mt-1 text-sm text-brand-700">{today}</p>
        {!loading && user && (
          <p className="mt-1 text-sm text-brand-700/80">
            {claims?.role ? ROLE_LABEL_KO[claims.role] : "역할 미지정"}
          </p>
        )}
      </div>

      {user ? (
        <div className="flex items-center gap-2">
          <Link
            href="/notifications"
            aria-label="알림"
            className="inline-flex min-h-tap min-w-tap items-center justify-center rounded-full bg-white/80 text-brand-700 shadow-sm backdrop-blur"
          >
            <Icon name="notifications" />
          </Link>
          <button
            type="button"
            onClick={onSignOut}
            aria-label="로그아웃"
            className="inline-flex min-h-tap min-w-tap items-center justify-center rounded-full bg-white/80 text-brand-700 shadow-sm backdrop-blur"
          >
            <Icon name="logout" />
          </button>
        </div>
      ) : (
        <Link
          href="/login"
          className="inline-flex min-h-tap items-center gap-1 rounded-full bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow-sm"
        >
          <Icon name="login" size={20} />
          로그인
        </Link>
      )}
    </header>
  );
}

function CharacterCard({
  isLoggedIn,
  userName,
}: {
  isLoggedIn: boolean;
  userName?: string;
}) {
  const message = isLoggedIn
    ? `${userName ? userName + "님, " : ""}오늘도 깨끗하게 청소해요!`
    : "안녕하세요! 함께 깨끗한 건물을 만들어요";

  return (
    <section className="px-4 pt-3">
      <div className="bg-character-card relative overflow-hidden rounded-[2rem] p-5 shadow-md shadow-brand-500/10">
        <div className="flex items-start gap-2">
          <p className="text-lg font-semibold text-brand-900">개미</p>
          <Icon name="cleaning_services" size={20} className="mt-0.5 text-brand-500" />
        </div>

        <div className="relative mt-4 flex items-center justify-center">
          <div className="speech-tail absolute -top-1 right-2 max-w-[64%] rounded-2xl bg-white px-4 py-3 text-sm text-brand-900 shadow-sm">
            {message}
          </div>
          <AntMascot size={200} />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <StatTile emoji="🧼" label="청결도" value="80%" valueColor="text-brand-700" />
          <StatTile emoji="⚡" label="처리율" value="92%" valueColor="text-success" />
        </div>
      </div>
    </section>
  );
}

function StatTile({
  emoji,
  label,
  value,
  valueColor,
}: {
  emoji: string;
  label: string;
  value: string;
  valueColor: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white/80 px-4 py-3 backdrop-blur">
      <span className="text-2xl" aria-hidden="true">
        {emoji}
      </span>
      <div className="flex-1">
        <p className="text-sm text-brand-700">{label}</p>
        <p className={`text-lg font-semibold ${valueColor}`}>{value}</p>
      </div>
    </div>
  );
}

function TodaySection({
  isManager,
  isSuper,
  role,
  uid,
}: {
  isManager: boolean;
  isSuper: boolean;
  role?: string;
  uid?: string;
}) {
  const [openCount, setOpenCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const active = ["received", "confirmed", "in_progress"];
      // Firestore 보안 규칙상 거주자는 본인 요청만, 슈퍼관리자는 전체를 읽을 수 있다.
      // 권한이 없는 광범위 집계는 403을 유발하므로 역할별로 쿼리를 한정한다.
      let q;
      if (role === "resident" && uid) {
        q = query(
          collection(db, "requests"),
          where("residentUid", "==", uid),
          where("status", "in", active),
        );
      } else if (isSuper) {
        q = query(collection(db, "requests"), where("status", "in", active));
      } else {
        // 비-슈퍼 관리자/건물주: 건물 범위 집계는 대시보드에서 제공한다.
        if (!cancelled) setOpenCount(null);
        return;
      }
      try {
        const snap = await getCountFromServer(q);
        if (!cancelled) setOpenCount(snap.data().count);
      } catch {
        if (!cancelled) setOpenCount(0);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [role, uid, isSuper]);

  return (
    <section className="mt-6 px-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold text-brand-900">오늘의 할 일</h2>
        <Link
          href={isManager ? "/manage/requests" : "/requests"}
          className="text-sm text-brand-600"
        >
          전체 보기 →
        </Link>
      </div>

      <div className="rounded-3xl bg-white/85 p-4 shadow-sm backdrop-blur">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-100">
            <Icon name="list_alt" className="text-brand-600" size={28} />
          </span>
          <div className="flex-1">
            <p className="text-base font-semibold text-brand-900">진행 중인 요청</p>
            <p className="mt-0.5 text-sm text-brand-700/80">
              {openCount === null
                ? "확인 중…"
                : openCount === 0
                  ? "처리 대기 중인 요청이 없습니다"
                  : `${openCount}건 처리 대기 중`}
            </p>
          </div>
          {openCount !== null && openCount > 0 && (
            <span className="rounded-full bg-warning/15 px-3 py-1 text-sm font-semibold text-warning">
              {openCount}
            </span>
          )}
        </div>

        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-brand-100">
          <div
            className="h-full rounded-full bg-brand-500 transition-all"
            style={{ width: `${Math.max(8, Math.min(100, (openCount ?? 0) * 10))}%` }}
          />
        </div>
      </div>
    </section>
  );
}

function QuickActions({ isSuper, isManager }: { isSuper: boolean; isManager: boolean }) {
  return (
    <section className="mt-6 px-4">
      <h2 className="mb-3 text-base font-semibold text-brand-900">빠른 메뉴</h2>
      <div className="grid grid-cols-2 gap-3">
        <ActionTile href="/blog" emoji="📰" label="청소 블로그" />
        <ActionTile href="/notifications" emoji="🔔" label="알림함" />
        {isManager && !isSuper && (
          <ActionTile href="/dashboard" emoji="📊" label="관리자 홈" />
        )}
        {isSuper && <ActionTile href="/admin/users" emoji="🛡️" label="역할 관리" />}
        {isManager && (
          <>
            <ActionTile href="/manage/invoices" emoji="🧾" label="관리비" />
            <ActionTile href="/buildings" emoji="🏢" label="건물 관리" />
          </>
        )}
      </div>
    </section>
  );
}

function ActionTile({ href, emoji, label }: { href: string; emoji: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex min-h-tap items-center gap-3 rounded-2xl bg-white/85 px-4 py-4 text-base font-medium text-brand-900 shadow-sm backdrop-blur transition active:scale-[0.98] active:bg-white"
    >
      <span className="text-2xl" aria-hidden="true">
        {emoji}
      </span>
      <span>{label}</span>
    </Link>
  );
}

function BottomTab() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 mx-auto flex max-w-screen-sm items-stretch rounded-t-3xl border-t border-brand-100 bg-white/95 backdrop-blur"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="하단 탭"
    >
      <TabItem href="/" name="home" label="홈" active filled />
      <TabItem href="/requests" name="list_alt" label="요청" />
      <TabItem href="/blog" name="auto_stories" label="블로그" />
      <TabItem href="/settings" name="person" label="내정보" />
    </nav>
  );
}

function TabItem({
  href,
  name,
  label,
  active,
  filled,
}: {
  href: string;
  name: string;
  label: string;
  active?: boolean;
  filled?: boolean;
}) {
  return (
    <Link
      href={href}
      className={
        "flex min-h-tap flex-1 flex-col items-center justify-center gap-1 px-2 py-2 text-xs " +
        (active ? "text-brand-600" : "text-brand-900/60")
      }
    >
      <Icon name={name} filled={filled && active} size={24} />
      <span>{label}</span>
    </Link>
  );
}
