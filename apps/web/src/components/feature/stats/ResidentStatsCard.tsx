"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Resident } from "@/lib/types";
import { REQUEST_STATUS_LABEL_KO, type RequestStatus } from "@/lib/types";

const STATUS_COLORS: Record<RequestStatus, string> = {
  received: "#93CCFB",
  confirmed: "#5FB4F8",
  in_progress: "#F59E0B",
  completed: "#16A34A",
  on_hold: "#DC2626",
};

export function ResidentStatsCard({ resident }: { resident: Resident }) {
  const stats = resident.stats;
  const total = stats?.total ?? 0;

  const byCategory = useMemo(() => {
    const m = stats?.byCategory ?? {};
    return Object.entries(m).map(([name, value]) => ({ name, value }));
  }, [stats?.byCategory]);

  const byStatus = useMemo(() => {
    const m = stats?.byStatus ?? {};
    return (Object.keys(REQUEST_STATUS_LABEL_KO) as RequestStatus[]).map((k) => ({
      name: REQUEST_STATUS_LABEL_KO[k],
      value: m[k] ?? 0,
      color: STATUS_COLORS[k],
    }));
  }, [stats?.byStatus]);

  return (
    <div className="rounded-xl border border-brand-100 bg-white p-4">
      <div className="grid grid-cols-3 gap-3">
        <Metric label="총 요청" value={total} />
        <Metric
          label="완료율"
          value={`${Math.round((stats?.completionRate ?? 0) * 100)}%`}
        />
        <Metric
          label="최근 요청"
          value={
            stats?.lastRequestAt
              ? new Date(stats.lastRequestAt.toMillis()).toLocaleDateString("ko-KR")
              : "—"
          }
        />
      </div>

      {byCategory.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-xs text-brand-700">분류별</p>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byCategory}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} width={28} />
                <Tooltip />
                <Bar dataKey="value" fill="#2E9CF2" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {byStatus.some((s) => s.value > 0) && (
        <div className="mt-4">
          <p className="mb-2 text-xs text-brand-700">상태별</p>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={byStatus}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={30}
                  outerRadius={60}
                  paddingAngle={2}
                >
                  {byStatus.map((s, i) => (
                    <Cell key={i} fill={s.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-2 flex flex-wrap gap-2 text-xs">
            {byStatus.map((s) => (
              <li key={s.name} className="flex items-center gap-1 text-brand-700">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: s.color }}
                />
                {s.name} {s.value}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg bg-brand-50 p-3 text-center">
      <p className="text-xs text-brand-700">{label}</p>
      <p className="mt-1 text-base font-semibold text-brand-900">{value}</p>
    </div>
  );
}
