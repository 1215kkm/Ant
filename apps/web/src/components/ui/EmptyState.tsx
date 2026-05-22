import { Icon } from "@/components/ui/Icon";

type Props = {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
};

/**
 * 빈 상태 — design-system.md 연보라 카드 + 보라 글로우 아이콘.
 * 어떤 페이지에서도 "비어있지만 친절한" 인상.
 */
export function EmptyState({ icon = "inbox", title, description, action }: Props) {
  return (
    <div className="mx-auto flex max-w-sm flex-col items-center px-4 py-12 text-center">
      <div className="shadow-crowny-glow mb-4 inline-flex h-16 w-16 items-center justify-center rounded-[20px] bg-brand-50 text-brand-500">
        <Icon name={icon} size={32} />
      </div>
      <p className="text-base font-semibold text-brand-900">{title}</p>
      {description && <p className="mt-1 text-sm text-brand-700">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
