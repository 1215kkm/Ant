import { clsx } from "clsx";

/**
 * 메모 태그 배지 — design-system.md "매너 태그 3색" 패턴:
 * 둥글기 12px (rounded-xl), 패딩 7px 12px, 11px / 600.
 * VIP=오렌지·강조 / 주의=빨강 / 일반=보라 muted.
 */
const TAG_STYLES: Record<string, string> = {
  VIP: "bg-warning/10 text-warning",
  주의: "bg-danger/10 text-danger",
  일반: "bg-brand-100 text-brand-700",
};

export const SUGGESTED_TAGS = ["VIP", "주의", "일반"] as const;

export function MemoTagBadge({ tag }: { tag: string }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-xl px-3 py-1 text-xs font-semibold tracking-tight",
        TAG_STYLES[tag] || "bg-brand-50 text-brand-700",
      )}
    >
      {tag}
    </span>
  );
}
