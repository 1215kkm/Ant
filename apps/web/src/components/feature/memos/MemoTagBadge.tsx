import { clsx } from "clsx";

const TAG_STYLES: Record<string, string> = {
  VIP: "bg-warning/10 text-warning",
  주의: "bg-danger/10 text-danger",
  일반: "bg-brand-50 text-brand-700",
};

export const SUGGESTED_TAGS = ["VIP", "주의", "일반"] as const;

export function MemoTagBadge({ tag }: { tag: string }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs",
        TAG_STYLES[tag] || "bg-brand-50 text-brand-700",
      )}
    >
      {tag}
    </span>
  );
}
