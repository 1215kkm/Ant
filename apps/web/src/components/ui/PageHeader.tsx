"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";

type Props = {
  title: string;
  subtitle?: string;
  /** 좌측 뒤로가기 버튼 표시 여부. 기본 true */
  back?: boolean;
  /** 우측 액션 영역 */
  action?: React.ReactNode;
};

export function PageHeader({ title, subtitle, back = true, action }: Props) {
  const router = useRouter();
  return (
    <header className="flex items-center gap-2 px-4 pt-4 pb-3">
      {back && (
        <button
          type="button"
          onClick={() => router.back()}
          className="-ml-2 inline-flex min-h-tap min-w-tap items-center justify-center rounded-lg text-brand-700"
          aria-label="뒤로 가기"
        >
          <Icon name="arrow_back" />
        </button>
      )}
      <div className="flex-1">
        <h1 className="text-xl font-semibold text-brand-900">{title}</h1>
        {subtitle && <p className="text-sm text-brand-700">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}
