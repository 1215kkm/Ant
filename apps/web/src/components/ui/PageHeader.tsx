"use client";

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

/**
 * Crowny 보라 헤더 (design-system.md 6.0 "보라 배경 + 흰색 시트 구조").
 * 본문은 각 페이지가 이 헤더 아래에 `bg-white` + `rounded-t-[32px]` 시트로 받친다.
 */
export function PageHeader({ title, subtitle, back = true, action }: Props) {
  const router = useRouter();
  return (
    <header className="bg-crowny-header flex items-center gap-2 px-4 pt-4 pb-5 text-white">
      {back && (
        <button
          type="button"
          onClick={() => router.back()}
          className="-ml-1 inline-flex h-10 w-10 min-h-tap min-w-tap items-center justify-center rounded-[14px] bg-white/20 text-white transition active:bg-white/30"
          aria-label="뒤로 가기"
        >
          <Icon name="arrow_back" />
        </button>
      )}
      <div className="flex-1">
        <h1 className="text-xl font-extrabold tracking-tight text-white">{title}</h1>
        {subtitle && <p className="text-sm text-white/80">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}
