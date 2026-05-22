import { INVOICE_STATUS_LABEL_KO, type InvoiceStatus } from "@/lib/types";

/**
 * 청구 상태 배지 — design-system.md "모임 상태 배지" 명세 (StatusBadge와 동일).
 */
const STYLES: Record<InvoiceStatus, string> = {
  issued: "bg-brand-50 text-brand-700",
  sent: "bg-brand-100 text-brand-800",
  partial: "bg-warning/10 text-warning",
  paid: "bg-success/10 text-success",
  overdue: "bg-danger/10 text-danger",
};

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  return (
    <span
      className={
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold tracking-tight " +
        STYLES[status]
      }
    >
      {INVOICE_STATUS_LABEL_KO[status]}
    </span>
  );
}

export function formatKRW(amount: number): string {
  return new Intl.NumberFormat("ko-KR", { style: "currency", currency: "KRW", maximumFractionDigits: 0 }).format(amount);
}
