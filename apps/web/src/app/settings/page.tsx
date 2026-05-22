"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { doc, onSnapshot } from "firebase/firestore";
import { RequireAuth } from "@/lib/auth/RequireAuth";
import { useAuth } from "@/lib/auth/AuthProvider";
import { db } from "@/lib/firebase/client";
import { enablePush } from "@/lib/firebase/messaging";
import {
  callRequestTelegramLinkCode,
  callUnlinkTelegramAccount,
} from "@/lib/firebase/functions";
import { PageHeader } from "@/components/ui/PageHeader";
import { Icon } from "@/components/ui/Icon";

export default function SettingsPage() {
  return (
    <RequireAuth>
      <SettingsInner />
    </RequireAuth>
  );
}

function SettingsInner() {
  const { user, signOut } = useAuth();
  const [pushEnabling, setPushEnabling] = useState(false);
  const [pushState, setPushState] = useState<NotificationPermission | "unsupported">(
    typeof Notification !== "undefined" ? Notification.permission : "unsupported",
  );

  const [tgLinked, setTgLinked] = useState(false);
  const [tgCode, setTgCode] = useState<string | null>(null);
  const [tgExpiresAt, setTgExpiresAt] = useState<number | null>(null);
  const [tgBotUsername, setTgBotUsername] = useState<string | undefined>(undefined);
  const [tgRequesting, setTgRequesting] = useState(false);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, "telegramLinks", user.uid), (snap) => {
      const data = snap.data();
      setTgLinked(Boolean(data?.chatId));
    });
    return () => unsub();
  }, [user]);

  async function turnOnPush() {
    if (!user || pushEnabling) return;
    setPushEnabling(true);
    try {
      const result = await enablePush(user.uid);
      if (result === "granted") {
        setPushState("granted");
        toast.success("푸시 알림이 켜졌습니다.");
      } else if (result === "denied") {
        setPushState("denied");
        toast.error("알림 권한이 거부되었습니다. 브라우저 설정에서 허용해 주세요.");
      } else {
        toast.error("이 브라우저는 푸시를 지원하지 않습니다.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "활성화 실패");
    } finally {
      setPushEnabling(false);
    }
  }

  async function issueTelegramCode() {
    if (tgRequesting) return;
    setTgRequesting(true);
    try {
      const { data } = await callRequestTelegramLinkCode();
      setTgCode(data.code);
      setTgExpiresAt(data.expiresAt);
      setTgBotUsername(data.botUsername);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "코드 발급 실패");
    } finally {
      setTgRequesting(false);
    }
  }

  async function unlinkTelegram() {
    try {
      await callUnlinkTelegramAccount();
      toast.success("텔레그램 연동이 해제되었습니다.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "해제 실패");
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-screen-sm bg-brand-50 pb-24">
      <PageHeader title="내정보" back={false} />

      <div className="sheet-top -mt-4 bg-white px-4 pt-6">
        {/* 푸시 알림 */}
        <section>
          <h2 className="mb-2 text-sm font-semibold text-brand-700">푸시 알림</h2>
          <div className="rounded-2xl border border-brand-100 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <Icon name="notifications_active" className="text-brand-500" />
              <div className="flex-1">
                <p className="text-base font-semibold text-brand-900">앱 푸시 알림</p>
                <p className="text-sm text-brand-700">
                  {pushState === "granted"
                    ? "활성화됨"
                    : pushState === "denied"
                      ? "차단됨 (브라우저 설정에서 허용)"
                      : pushState === "unsupported"
                        ? "지원되지 않음"
                        : "꺼져 있음"}
                </p>
              </div>
              {pushState !== "granted" && pushState !== "unsupported" && (
                <button
                  type="button"
                  disabled={pushEnabling}
                  onClick={turnOnPush}
                  className="btn-crowny inline-flex min-h-tap items-center rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-50"
                >
                  {pushEnabling ? "처리 중…" : "켜기"}
                </button>
              )}
            </div>
            <p className="mt-3 text-xs text-brand-700/70">
              iOS에서는 PWA를 홈 화면에 추가한 후에만 푸시가 동작합니다.
            </p>
          </div>
        </section>

        {/* 텔레그램 연동 */}
        <section className="mt-6">
          <h2 className="mb-2 text-sm font-semibold text-brand-700">텔레그램 알림</h2>
          <div className="rounded-2xl border border-brand-100 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <Icon name="forum" className="text-brand-500" />
              <div className="flex-1">
                <p className="text-base font-semibold text-brand-900">텔레그램 봇</p>
                <p className="text-sm text-brand-700">
                  {tgLinked ? "연동됨" : "연동되지 않음"}
                </p>
              </div>
              {tgLinked ? (
                <button
                  type="button"
                  onClick={unlinkTelegram}
                  className="inline-flex min-h-tap items-center rounded-xl border border-brand-200 px-3 py-2 text-sm font-semibold text-brand-700"
                >
                  해제
                </button>
              ) : (
                <button
                  type="button"
                  disabled={tgRequesting}
                  onClick={issueTelegramCode}
                  className="btn-crowny inline-flex min-h-tap items-center rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-50"
                >
                  {tgRequesting ? "발급 중…" : "코드 받기"}
                </button>
              )}
            </div>

            {tgCode && !tgLinked && (
              <div className="mt-3 rounded-xl bg-brand-50 p-3 text-sm text-brand-900">
                <p>
                  텔레그램에서 <b>@{tgBotUsername || "개미청소봇"}</b>에 다음 메시지를 보내세요:
                </p>
                <code className="mt-2 block rounded-lg bg-white px-3 py-2 text-base font-bold text-brand-700">
                  /start {tgCode}
                </code>
                {tgExpiresAt && (
                  <p className="mt-2 text-xs text-brand-700/70">
                    만료: {new Date(tgExpiresAt).toLocaleTimeString("ko-KR")}
                  </p>
                )}
              </div>
            )}
          </div>
        </section>

        {/* 계정 */}
        <section className="mt-6">
          <h2 className="mb-2 text-sm font-semibold text-brand-700">계정</h2>
          <div className="rounded-2xl border border-brand-100 bg-white p-4 shadow-sm">
            <p className="text-sm text-brand-700">{user?.email || user?.phoneNumber}</p>
            <button
              type="button"
              onClick={signOut}
              className="mt-3 inline-flex min-h-tap items-center gap-1 rounded-xl border border-brand-200 px-3 py-2 text-sm font-semibold text-brand-700"
            >
              <Icon name="logout" size={20} />
              로그아웃
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
