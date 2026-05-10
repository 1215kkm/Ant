import { Icon } from "@/components/ui/Icon";

type Props = {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
};

export function EmptyState({ icon = "inbox", title, description, action }: Props) {
  return (
    <div className="mx-auto flex max-w-sm flex-col items-center px-4 py-12 text-center">
      <Icon name={icon} size={40} className="text-brand-400" />
      <p className="mt-3 text-base text-brand-900">{title}</p>
      {description && <p className="mt-1 text-sm text-brand-700">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
