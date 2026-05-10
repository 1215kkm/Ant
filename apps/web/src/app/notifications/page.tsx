"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthProvider";
import {
  watchMyNotifications,
  markAllRead,
  markNotificationRead,
  type AppNotification,
} from "@/lib/queries/notifications";
import { RequireAuth } from "@/lib/auth/RequireAuth";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";

export default function NotificationsPage() {
  return (
    <RequireAuth>
      <NotificationsInner />
    </RequireAuth>
  );
}

function NotificationsInner() {
  const { user } = useAuth();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const unsub = watchMyNotifications(user.uid, (list) => {
      setItems(list);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  const unreadCount = items.filter((n) => !n.read).length;

  return (
    <main className="mx-auto max-w-screen-sm pb-24">
      <PageHeader
        title="알림함"
        subtitle={unreadCount > 0 ? `읽지 않음 ${unreadCount}` : undefined}
        action={
          unreadCount > 0 && user ? (
            <button
              type="button"
              onClick={() => markAllRead(user.uid)}
              className="inline-flex min-h-tap items-center gap-1 rounded-lg border border-brand-200 px-3 py-2 text-sm text-brand-700"
            >
              모두 읽음
            </button>
          ) : undefined
        }
      />

      {loading ? (
        <p className="px-4 text-sm text-brand-700">불러오는 중…</p>
      ) : items.length === 0 ? (
        <EmptyState icon="notifications_none" title="알림이 없습니다" />
      ) : (
        <ul className="flex flex-col gap-2 px-4">
          {items.map((n) => (
            <li key={n.id}>
              <Link
                href={n.href || "#"}
                onClick={() => !n.read && markNotificationRead(n.id)}
                className={
                  "flex items-start gap-3 rounded-xl border p-4 active:bg-brand-50 " +
                  (n.read
                    ? "border-brand-100 bg-white"
                    : "border-brand-200 bg-brand-50/60")
                }
              >
                <Icon
                  name={
                    n.kind === "request_created"
                      ? "build"
                      : n.kind === "request_status_changed"
                        ? "sync"
                        : n.kind === "invoice_created" || n.kind === "invoice_overdue"
                          ? "receipt_long"
                          : "notifications"
                  }
                  className={n.read ? "text-brand-400" : "text-brand-500"}
                />
                <div className="flex-1">
                  <p className="text-base text-brand-900">{n.title}</p>
                  <p className="mt-0.5 text-sm text-brand-700">{n.body}</p>
                  {n.createdAt && (
                    <p className="mt-1 text-xs text-brand-700/60">
                      {new Date(n.createdAt.toMillis()).toLocaleString("ko-KR")}
                    </p>
                  )}
                </div>
                {!n.read && (
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-500" aria-label="읽지 않음" />
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
