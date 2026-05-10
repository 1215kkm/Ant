import { REQUEST_STATUS_LABEL_KO, type RequestStatus } from "@/lib/types";

const STYLES: Record<RequestStatus, string> = {
  received: "bg-brand-50 text-brand-700",
  confirmed: "bg-brand-100 text-brand-800",
  in_progress: "bg-warning/10 text-warning",
  completed: "bg-success/10 text-success",
  on_hold: "bg-danger/10 text-danger",
};

export function StatusBadge({ status }: { status: RequestStatus }) {
  return (
    <span
      className={
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs " + STYLES[status]
      }
    >
      {REQUEST_STATUS_LABEL_KO[status]}
    </span>
  );
}
