import { REQUEST_STATUS_LABEL_KO, type RequestStatus } from "@/lib/types";

/**
 * 요청 상태 배지 — design-system.md "모임 상태 배지" 명세:
 * 둥글기 6px (rounded-md), 패딩 2px 8px, 10px/700, 상태별 배경/색 분리.
 */
const STYLES: Record<RequestStatus, string> = {
  received: "bg-brand-50 text-brand-700",
  confirmed: "bg-warning/10 text-warning",
  in_progress: "bg-brand-100 text-brand-800",
  completed: "bg-success/10 text-success",
  on_hold: "bg-danger/10 text-danger",
};

export function StatusBadge({ status }: { status: RequestStatus }) {
  return (
    <span
      className={
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold tracking-tight " +
        STYLES[status]
      }
    >
      {REQUEST_STATUS_LABEL_KO[status]}
    </span>
  );
}
