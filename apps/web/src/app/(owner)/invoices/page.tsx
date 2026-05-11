"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthProvider";
import { listInvoicesForOwner } from "@/lib/queries/invoices";
import type { Invoice } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import {
  InvoiceStatusBadge,
  formatKRW,
} from "@/components/feature/invoices/InvoiceStatusBadge";

export default function OwnerInvoicesPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    listInvoicesForOwner(user.uid)
      .then(setItems)
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <main className="mx-auto max-w-screen-sm pb-24">
      <PageHeader title="관리비" back={false} />

      {loading ? (
        <p className="px-4 text-sm text-brand-700">불러오는 중…</p>
      ) : items.length === 0 ? (
        <EmptyState icon="receipt_long" title="청구된 관리비가 없습니다" />
      ) : (
        <ul className="flex flex-col gap-2 px-4">
          {items.map((inv) => (
            <li key={inv.id}>
              <Link
                href={`/invoices/${inv.id}`}
                className="flex items-center gap-3 rounded-xl border border-brand-100 bg-white p-4 active:bg-brand-50"
              >
                <div className="flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <InvoiceStatusBadge status={inv.status} />
                    <span className="text-xs text-brand-700/70">{inv.period}</span>
                  </div>
                  <p className="text-base text-brand-900">{inv.buildingName || inv.buildingId}</p>
                  <p className="mt-0.5 text-base font-semibold text-brand-900">
                    {formatKRW(inv.amount)}
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
