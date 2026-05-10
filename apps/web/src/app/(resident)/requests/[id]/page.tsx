"use client";

import { use, useEffect, useState } from "react";
import { watchRequest } from "@/lib/queries/requests";
import {
  REQUEST_STATUS_FLOW,
  REQUEST_STATUS_LABEL_KO,
  REQUEST_TYPE_LABEL_KO,
  type ServiceRequest,
} from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/feature/requests/StatusBadge";
import { Icon } from "@/components/ui/Icon";

export default function RequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const unsub = watchRequest(id, (r) => {
      setRequest(r);
      setLoading(false);
    });
    return () => unsub();
  }, [id]);

  if (loading) return <p className="px-4 pt-8 text-sm text-brand-700">불러오는 중…</p>;
  if (!request) {
    return (
      <main className="mx-auto max-w-screen-sm pb-24">
        <PageHeader title="요청" />
        <EmptyState icon="error" title="요청을 찾을 수 없습니다" />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-screen-sm pb-24">
      <PageHeader
        title={request.title}
        subtitle={
          (request.requestNumber ? request.requestNumber + " · " : "") +
          REQUEST_TYPE_LABEL_KO[request.type]
        }
      />

      <section className="px-4">
        <div className="mb-3 flex items-center gap-2">
          <StatusBadge status={request.status} />
          {request.category && (
            <span className="text-sm text-brand-700">{request.category}</span>
          )}
        </div>

        <StatusFlow current={request.status} />

        <div className="mt-4 whitespace-pre-line rounded-xl bg-brand-50 p-4 text-base text-brand-900">
          {request.description}
        </div>

        {request.media && request.media.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-2">
            {request.media.map((m, i) => (
              <a
                key={i}
                href={m.url}
                target="_blank"
                rel="noreferrer"
                className="block overflow-hidden rounded-xl border border-brand-100"
              >
                {m.kind === "image" ? (
                  <img src={m.url} alt="" className="h-32 w-full object-cover" />
                ) : (
                  <div className="flex h-32 w-full items-center justify-center bg-brand-50">
                    <Icon name="movie" className="text-brand-500" />
                  </div>
                )}
              </a>
            ))}
          </div>
        )}

        <dl className="mt-6 grid grid-cols-2 gap-3 text-sm">
          <Info label="호실" value={request.unitLabel || "—"} />
          <Info label="우선순위" value={request.priority || "보통"} />
        </dl>
      </section>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-brand-100 bg-white p-3">
      <p className="text-xs text-brand-700">{label}</p>
      <p className="mt-1 text-base text-brand-900">{value}</p>
    </div>
  );
}

function StatusFlow({ current }: { current: ServiceRequest["status"] }) {
  if (current === "on_hold") {
    return (
      <div className="rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">
        보류 상태입니다. 관리자가 확인 후 재개합니다.
      </div>
    );
  }
  return (
    <ol className="flex items-center justify-between text-xs text-brand-700">
      {REQUEST_STATUS_FLOW.map((s, i) => {
        const idx = REQUEST_STATUS_FLOW.indexOf(current);
        const reached = i <= idx;
        return (
          <li key={s} className="flex flex-1 items-center">
            <span
              className={
                "flex h-7 w-7 items-center justify-center rounded-full text-xs " +
                (reached ? "bg-brand-500 text-white" : "bg-brand-100 text-brand-700")
              }
              aria-current={s === current ? "step" : undefined}
            >
              {i + 1}
            </span>
            <span className={"ml-2 " + (reached ? "text-brand-900" : "text-brand-700/60")}>
              {REQUEST_STATUS_LABEL_KO[s]}
            </span>
            {i < REQUEST_STATUS_FLOW.length - 1 && (
              <span
                className={
                  "mx-2 h-0.5 flex-1 " + (i < idx ? "bg-brand-500" : "bg-brand-100")
                }
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
