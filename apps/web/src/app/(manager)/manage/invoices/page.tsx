"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthProvider";
import { listBuildings } from "@/lib/queries/buildings";
import { listInvoicesForBuilding } from "@/lib/queries/invoices";
import type { Building, Invoice } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import {
  InvoiceStatusBadge,
  formatKRW,
} from "@/components/feature/invoices/InvoiceStatusBadge";

export default function ManagerInvoicesPage() {
  const { user, claims } = useAuth();
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [selectedBid, setSelectedBid] = useState<string>("");
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    listBuildings(claims?.sm ? {} : { managerId: user.uid }).then((list) => {
      setBuildings(list);
      if (list.length > 0 && !selectedBid) setSelectedBid(list[0].id);
    });
  }, [user, claims?.sm, selectedBid]);

  useEffect(() => {
    if (!selectedBid) return;
    setLoading(true);
    listInvoicesForBuilding(selectedBid)
      .then(setInvoices)
      .finally(() => setLoading(false));
  }, [selectedBid]);

  return (
    <main className="mx-auto max-w-screen-sm pb-24">
      <PageHeader
        title="관리비"
        back={false}
        action={
          selectedBid ? (
            <Link
              href={`/manage/invoices/new?bid=${selectedBid}`}
              className="inline-flex min-h-tap items-center gap-1 rounded-lg bg-brand-500 px-3 py-2 text-sm text-white"
            >
              <Icon name="add" size={20} />
              <span>발행</span>
            </Link>
          ) : undefined
        }
      />

      {buildings.length > 0 && (
        <div className="mb-4 px-4">
          <select
            value={selectedBid}
            onChange={(e) => setSelectedBid(e.target.value)}
            className="block w-full rounded-xl border border-brand-200 bg-white px-4 py-3 text-base text-brand-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
          >
            {buildings.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {loading ? (
        <p className="px-4 text-sm text-brand-700">불러오는 중…</p>
      ) : invoices.length === 0 ? (
        <EmptyState icon="receipt_long" title="발행된 관리비가 없습니다" />
      ) : (
        <ul className="flex flex-col gap-2 px-4">
          {invoices.map((inv) => (
            <li key={inv.id}>
              <Link
                href={`/manage/invoices/${inv.id}`}
                className="flex items-center gap-3 rounded-xl border border-brand-100 bg-white p-4 active:bg-brand-50"
              >
                <div className="flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <InvoiceStatusBadge status={inv.status} />
                    <span className="text-xs text-brand-700/70">{inv.period}</span>
                  </div>
                  <p className="text-base font-semibold text-brand-900">
                    {formatKRW(inv.amount)}
                  </p>
                  {inv.dueDate && (
                    <p className="text-xs text-brand-700/70">
                      마감 {new Date(inv.dueDate.toMillis()).toLocaleDateString("ko-KR")}
                    </p>
                  )}
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
