"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthProvider";
import { listManagerRequests } from "@/lib/queries/requests";
import {
  REQUEST_STATUS_LABEL_KO,
  REQUEST_TYPE_LABEL_KO,
  type RequestStatus,
  type ServiceRequest,
} from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { StatusBadge } from "@/components/feature/requests/StatusBadge";

type Filter = "open" | RequestStatus | "all";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "open", label: "미완료" },
  { key: "received", label: "접수" },
  { key: "confirmed", label: "확인" },
  { key: "in_progress", label: "진행중" },
  { key: "completed", label: "완료" },
  { key: "on_hold", label: "보류" },
  { key: "all", label: "전체" },
];

export default function ManagerRequestsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<ServiceRequest[]>([]);
  const [filter, setFilter] = useState<Filter>("open");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    listManagerRequests({
      managerId: user.uid,
      status: filter === "all" ? undefined : filter,
    })
      .then(setItems)
      .finally(() => setLoading(false));
  }, [user, filter]);

  const count = useMemo(() => items.length, [items]);

  return (
    <main className="mx-auto max-w-screen-sm pb-24">
      <PageHeader title="요청 목록" subtitle={`${count}건`} back={false} />

      <div className="px-4">
        <div className="-mx-1 flex gap-2 overflow-x-auto pb-2">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={
                "shrink-0 rounded-full px-3 py-1.5 text-sm transition " +
                (filter === f.key
                  ? "bg-brand-500 text-white"
                  : "bg-brand-50 text-brand-700")
              }
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="px-4 text-sm text-brand-700">불러오는 중…</p>
      ) : items.length === 0 ? (
        <EmptyState icon="inbox" title="요청이 없습니다" />
      ) : (
        <ul className="flex flex-col gap-2 px-4">
          {items.map((r) => (
            <li key={r.id}>
              <Link
                href={`/manage/requests/${r.id}`}
                className="flex items-start gap-3 rounded-xl border border-brand-100 bg-white p-4 active:bg-brand-50"
              >
                <div className="flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <StatusBadge status={r.status} />
                    <span className="text-xs text-brand-700/70">
                      {REQUEST_TYPE_LABEL_KO[r.type]}
                    </span>
                  </div>
                  <p className="text-base text-brand-900">{r.title}</p>
                  <p className="mt-0.5 text-xs text-brand-700/70">
                    {r.requestNumber || r.id.slice(0, 6)} ·{" "}
                    {r.unitLabel || "—"} · {r.residentName || "거주자"}
                  </p>
                </div>
                <Icon name="chevron_right" className="text-brand-400" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
