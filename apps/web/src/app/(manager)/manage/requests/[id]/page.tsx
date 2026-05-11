"use client";

import { use, useEffect, useState } from "react";
import { toast } from "sonner";
import { watchRequest, updateRequestStatus } from "@/lib/queries/requests";
import {
  REQUEST_STATUS_LABEL_KO,
  REQUEST_TYPE_LABEL_KO,
  type RequestStatus,
  type ServiceRequest,
} from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/feature/requests/StatusBadge";
import { Icon } from "@/components/ui/Icon";

const TRANSITIONS: RequestStatus[] = [
  "received",
  "confirmed",
  "in_progress",
  "completed",
  "on_hold",
];

export default function ManagerRequestDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<RequestStatus | null>(null);

  useEffect(() => {
    setLoading(true);
    const unsub = watchRequest(id, (r) => {
      setRequest(r);
      setLoading(false);
    });
    return () => unsub();
  }, [id]);

  async function changeStatus(next: RequestStatus) {
    if (!request || updating) return;
    setUpdating(next);
    try {
      await updateRequestStatus(request.id, next);
      toast.success(`상태를 ${REQUEST_STATUS_LABEL_KO[next]}(으)로 변경했습니다.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "변경 실패");
    } finally {
      setUpdating(null);
    }
  }

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

        <dl className="grid grid-cols-2 gap-3 text-sm">
          <Info label="거주자" value={request.residentName || "—"} />
          <Info label="호실" value={request.unitLabel || "—"} />
          <Info label="우선순위" value={request.priority || "보통"} />
          <Info
            label="작성"
            value={
              request.createdAt
                ? new Date(request.createdAt.toMillis()).toLocaleString("ko-KR")
                : "—"
            }
          />
        </dl>

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

        <div className="mt-6">
          <h2 className="mb-2 text-sm text-brand-700">상태 변경</h2>
          <div className="grid grid-cols-3 gap-2">
            {TRANSITIONS.map((s) => {
              const active = request.status === s;
              return (
                <button
                  key={s}
                  type="button"
                  disabled={active || updating !== null}
                  onClick={() => changeStatus(s)}
                  className={
                    "min-h-tap rounded-xl border px-3 py-2 text-sm transition disabled:opacity-50 " +
                    (active
                      ? "border-brand-500 bg-brand-50 text-brand-900"
                      : "border-brand-200 bg-white text-brand-700 active:bg-brand-50")
                  }
                >
                  {updating === s ? "…" : REQUEST_STATUS_LABEL_KO[s]}
                </button>
              );
            })}
          </div>
        </div>
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
