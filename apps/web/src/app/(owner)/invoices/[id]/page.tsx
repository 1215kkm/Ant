"use client";

import { use, useEffect, useState } from "react";
import { getInvoice } from "@/lib/queries/invoices";
import type { Invoice } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import {
  InvoiceStatusBadge,
  formatKRW,
} from "@/components/feature/invoices/InvoiceStatusBadge";

export default function OwnerInvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <main className="mx-auto max-w-screen-sm pb-24">
      <PageHeader
        title={`${invoice.period} 관리비`}
        subtitle={invoice.buildingName || undefined}
      />

      <section className="px-4">
        <div className="rounded-2xl bg-brand-50 p-5">
          <InvoiceStatusBadge status={invoice.status} />
          <p className="mt-3 text-2xl font-semibold text-brand-900">
            {formatKRW(invoice.amount)}
          </p>
          {invoice.dueDate && (
            <p className="mt-1 text-sm text-brand-700">
              납부 기한 {new Date(invoice.dueDate.toMillis()).toLocaleDateString("ko-KR")}
            </p>
          )}
        </div>

        {invoice.attachments.length > 0 && (
          <div className="mt-4">
            <h2 className="mb-2 text-sm text-brand-700">청구서</h2>
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
      </section>
    </main>
  );
}
