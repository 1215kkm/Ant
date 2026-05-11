"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthProvider";
import { listBuildings } from "@/lib/queries/buildings";
import { listReportsForBuilding } from "@/lib/queries/reports";
import type { Building, Report } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";

export default function OwnerReportsPage() {
  const { user } = useAuth();
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedBid, setSelectedBid] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    listBuildings({ ownerId: user.uid }).then((list) => {
      setBuildings(list);
      if (list.length > 0 && !selectedBid) setSelectedBid(list[0].id);
    });
  }, [user, selectedBid]);

  useEffect(() => {
    if (!selectedBid) return;
    setLoading(true);
    listReportsForBuilding(selectedBid)
      .then(setReports)
      .finally(() => setLoading(false));
  }, [selectedBid]);

  return (
    <main className="mx-auto max-w-screen-sm pb-24">
      <PageHeader title="보고서" back={false} />

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
      ) : reports.length === 0 ? (
        <EmptyState
          icon="summarize"
          title="아직 생성된 보고서가 없습니다"
          description="매주 월요일 06시에 주간 보고서가, 매월 1일 06시에 월간 보고서가 자동 생성됩니다."
        />
      ) : (
        <ul className="flex flex-col gap-2 px-4">
          {reports.map((r) => (
            <li key={r.id}>
              <Link
                href={`/reports/${r.id}`}
                className="flex items-center gap-3 rounded-xl border border-brand-100 bg-white p-4 active:bg-brand-50"
              >
                <Icon
                  name={r.kind === "weekly" ? "view_week" : "calendar_month"}
                  className="text-brand-500"
                />
                <div className="flex-1">
                  <p className="text-base text-brand-900">
                    {r.kind === "weekly" ? "주간 보고서" : "월간 보고서"}
                  </p>
                  <p className="text-sm text-brand-700">
                    {fmt(r.periodStart.toMillis())} ~ {fmt(r.periodEnd.toMillis())}
                  </p>
                  <p className="text-xs text-brand-700/70">
                    요청 {r.summary.totalRequests}건 · 완료 {r.summary.completed}건
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

function fmt(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}
