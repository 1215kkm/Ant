"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthProvider";
import { listMyRequests } from "@/lib/queries/requests";
import { REQUEST_TYPE_LABEL_KO, type ServiceRequest } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { StatusBadge } from "@/components/feature/requests/StatusBadge";

export default function MyRequestsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    listMyRequests(user.uid)
      .then(setItems)
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <main className="mx-auto min-h-screen max-w-screen-sm bg-brand-50 pb-24">
      <PageHeader
        title="내 요청"
        back={false}
        action={
          <Link
            href="/requests/new"
            className="btn-crowny inline-flex min-h-tap items-center gap-1 rounded-xl px-4 py-2 text-sm font-semibold"
          >
            <Icon name="add" size={20} />
            <span>새 요청</span>
          </Link>
        }
      />

      <div className="sheet-top -mt-4 bg-white px-4 pt-6">
        {loading ? (
          <p className="text-sm text-brand-700">불러오는 중…</p>
        ) : items.length === 0 ? (
          <EmptyState
            icon="inbox"
            title="아직 요청이 없습니다"
            description="우측 상단 새 요청 버튼으로 작성해 보세요."
          />
        ) : (
          <ul className="flex flex-col gap-2">
            {items.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/requests/${r.id}`}
                  className="flex items-start gap-3 rounded-2xl border border-brand-100 bg-white p-4 shadow-sm active:bg-brand-50"
                >
                  <div className="flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <StatusBadge status={r.status} />
                      <span className="text-xs text-brand-700/70">
                        {REQUEST_TYPE_LABEL_KO[r.type]}
                      </span>
                    </div>
                    <p className="text-base font-semibold text-brand-900">{r.title}</p>
                    {r.requestNumber && (
                      <p className="mt-0.5 text-xs text-brand-700/70">{r.requestNumber}</p>
                    )}
                  </div>
                  <Icon name="chevron_right" className="text-brand-400" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
