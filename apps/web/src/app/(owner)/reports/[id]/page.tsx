"use client";

import { use, useEffect, useState } from "react";
import { getReport } from "@/lib/queries/reports";
import type { Report } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";

export default function OwnerReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getReport(id)
      .then(setReport)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="px-4 pt-8 text-sm text-brand-700">불러오는 중…</p>;
  if (!report) {
    return (
      <main className="mx-auto max-w-screen-sm pb-24">
        <PageHeader title="보고서" />
        <EmptyState icon="error" title="보고서를 찾을 수 없습니다" />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-screen-sm pb-24">
      <PageHeader
        title={report.kind === "weekly" ? "주간 보고서" : "월간 보고서"}
        subtitle={report.buildingName || undefined}
      />

      <section className="px-4">
        <p className="text-sm text-brand-700">
          기간 {fmt(report.periodStart.toMillis())} ~ {fmt(report.periodEnd.toMillis())}
        </p>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <Metric label="총 요청" value={report.summary.totalRequests} />
          <Metric label="완료" value={report.summary.completed} />
          <Metric label="미완료" value={report.summary.pending} />
        </div>

        {report.summary.byCategory && Object.keys(report.summary.byCategory).length > 0 && (
          <div className="mt-6">
            <h2 className="mb-2 text-sm text-brand-700">분류별</h2>
            <ul className="flex flex-col gap-1 rounded-xl border border-brand-100 bg-white p-3">
              {Object.entries(report.summary.byCategory).map(([k, v]) => (
                <li key={k} className="flex items-center justify-between text-base text-brand-900">
                  <span>{k}</span>
                  <span className="font-semibold">{v}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {(report.summary.invoicesIssued ?? 0) > 0 && (
          <div className="mt-6">
            <h2 className="mb-2 text-sm text-brand-700">관리비</h2>
            <div className="grid grid-cols-3 gap-2">
              <Metric label="발행" value={report.summary.invoicesIssued ?? 0} />
              <Metric label="완납" value={report.summary.invoicesPaid ?? 0} />
              <Metric label="연체" value={report.summary.invoicesOverdue ?? 0} />
            </div>
          </div>
        )}

        {report.pdfUrl && (
          <a
            href={report.pdfUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-6 inline-flex w-full min-h-tap items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 py-3 text-base font-medium text-white"
          >
            <Icon name="picture_as_pdf" />
            PDF로 다운로드
          </a>
        )}
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg bg-brand-50 p-3 text-center">
      <p className="text-xs text-brand-700">{label}</p>
      <p className="mt-1 text-base font-semibold text-brand-900">{value}</p>
    </div>
  );
}

function fmt(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}
