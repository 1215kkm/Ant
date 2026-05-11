"use client";

import { use, useEffect, useState } from "react";
import { toast } from "sonner";
import { getInvoice, markInvoicePaid, updateInvoiceStatus } from "@/lib/queries/invoices";
import type { Invoice, InvoiceStatus } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import {
  InvoiceStatusBadge,
  formatKRW,
} from "@/components/feature/invoices/InvoiceStatusBadge";

const STATUSES: InvoiceStatus[] = ["issued", "sent", "partial", "paid", "overdue"];

export default function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<InvoiceStatus | null>(null);

  useEffect(() => {
    setLoading(true);
    getInvoice(id)
      .then(setInvoice)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="px-4 pt-8 text-sm text-brand-700">불러오는 중…</p>;
  if (!invoice) {
    return (
      <main className="mx-auto max-w-screen-sm pb-24">
        <PageHeader title="관리비" />
        <EmptyState icon="error" title="청구서를 찾을 수 없습니다" />
      </main>
    );
  }

  async function change(next: InvoiceStatus) {
    if (!invoice || updating) return;
    setUpdating(next);
    try {
      if (next === "paid") {
        await markInvoicePaid(invoice.id);
      } else {
        await updateInvoiceStatus(invoice.id, next);
      }
      setInvoice({ ...invoice, status: next });
      toast.success("상태를 변경했습니다.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "실패");
    } finally {
      setUpdating(null);
    }
  }

  return (
    <main className="mx-auto max-w-screen-sm pb-24">
      <PageHeader
        title={`${invoice.period} 관리비`}
        subtitle={invoice.buildingName || undefined}
      />

      <section className="px-4">
        <div className="rounded-2xl bg-brand-50 p-5">
          <div className="flex items-center gap-2">
            <InvoiceStatusBadge status={invoice.status} />
          </div>
          <p className="mt-3 text-2xl font-semibold text-brand-900">
            {formatKRW(invoice.amount)}
          </p>
          {invoice.dueDate && (
            <p className="mt-1 text-sm text-brand-700">
              납부 기한 {new Date(invoice.dueDate.toMillis()).toLocaleDateString("ko-KR")}
            </p>
          )}
          {invoice.remindersSent > 0 && (
            <p className="mt-1 text-xs text-brand-700">
              독촉 발송 {invoice.remindersSent}회
            </p>
          )}
        </div>

        {invoice.attachments.length > 0 && (
          <div className="mt-4">
            <h2 className="mb-2 text-sm text-brand-700">첨부</h2>
            <ul className="flex flex-col gap-2">
              {invoice.attachments.map((a, i) => (
                <li key={i}>
                  <a
                    href={a.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 rounded-xl border border-brand-100 bg-white p-3 active:bg-brand-50"
                  >
                    <Icon
                      name={a.kind === "pdf" ? "picture_as_pdf" : "image"}
                      className="text-brand-500"
                    />
                    <span className="flex-1 text-base text-brand-900">
                      {a.name || (a.kind === "pdf" ? "PDF" : "이미지")}
                    </span>
                    <Icon name="open_in_new" size={20} className="text-brand-400" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-6">
          <h2 className="mb-2 text-sm text-brand-700">상태 변경</h2>
          <div className="grid grid-cols-3 gap-2">
            {STATUSES.map((s) => {
              const active = invoice.status === s;
              return (
                <button
                  key={s}
                  type="button"
                  disabled={active || updating !== null}
                  onClick={() => change(s)}
                  className={
                    "min-h-tap rounded-xl border px-3 py-2 text-sm transition disabled:opacity-50 " +
                    (active
                      ? "border-brand-500 bg-brand-50 text-brand-900"
                      : "border-brand-200 bg-white text-brand-700 active:bg-brand-50")
                  }
                >
                  {updating === s ? "…" : labelKo(s)}
                </button>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}

function labelKo(s: InvoiceStatus): string {
  return (
    {
      issued: "발행",
      sent: "발송됨",
      partial: "일부납",
      paid: "완납",
      overdue: "연체",
    } as Record<InvoiceStatus, string>
  )[s];
}
