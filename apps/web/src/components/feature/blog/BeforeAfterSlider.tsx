"use client";

import { useRef, useState } from "react";
import type { BlogImage } from "@/lib/types";
import { Icon } from "@/components/ui/Icon";

type Props = {
  before: BlogImage;
  after: BlogImage;
  caption?: string;
  alt?: string;
};

/**
 * 청소 전·후 슬라이더. 드래그/터치/키보드로 위치 조절.
 * 의존성 없는 자체 구현으로, 외부 라이브러리 없이 동작.
 */
export function BeforeAfterSlider({ before, after, caption, alt = "청소 전후 비교" }: Props) {
  const [pos, setPos] = useState(50);
  const wrapRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  function setFromClientX(clientX: number) {
    const el = wrapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const ratio = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.max(0, Math.min(100, ratio)));
  }

  return (
    <figure className="select-none">
      <div
        ref={wrapRef}
        className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-brand-50 touch-none"
        onMouseDown={(e) => {
          draggingRef.current = true;
          setFromClientX(e.clientX);
        }}
        onMouseMove={(e) => draggingRef.current && setFromClientX(e.clientX)}
        onMouseUp={() => (draggingRef.current = false)}
        onMouseLeave={() => (draggingRef.current = false)}
        onTouchStart={(e) => setFromClientX(e.touches[0].clientX)}
        onTouchMove={(e) => setFromClientX(e.touches[0].clientX)}
      >
        {/* 청소 후 (배경) */}
        <img
          src={after.url}
          alt={`${alt} - 후`}
          className="absolute inset-0 h-full w-full object-cover"
        />
        {/* 청소 전 (오버레이, clip-path로 잘림) */}
        <img
          src={before.url}
          alt={`${alt} - 전`}
          className="absolute inset-0 h-full w-full object-cover"
          style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
        />
        {/* 라벨 */}
        <span
          className="absolute left-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-xs text-white"
          aria-hidden
        >
          BEFORE
        </span>
        <span
          className="absolute right-3 top-3 rounded-full bg-brand-500 px-2.5 py-1 text-xs text-white"
          aria-hidden
        >
          AFTER
        </span>
        {/* 슬라이더 핸들 */}
        <div
          className="absolute inset-y-0 flex w-0 items-center justify-center"
          style={{ left: `${pos}%`, transform: "translateX(-50%)" }}
        >
          <div className="h-full w-0.5 bg-white shadow" />
          <button
            type="button"
            aria-label="청소 전후 비교 핸들"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(pos)}
            role="slider"
            onKeyDown={(e) => {
              if (e.key === "ArrowLeft") setPos((p) => Math.max(0, p - 5));
              if (e.key === "ArrowRight") setPos((p) => Math.min(100, p + 5));
            }}
            className="absolute flex h-10 w-10 items-center justify-center rounded-full border-2 border-brand-500 bg-white shadow-md"
          >
            <Icon name="unfold_more" size={20} className="rotate-90 text-brand-500" />
          </button>
        </div>
      </div>
      {caption && (
        <figcaption className="mt-2 text-sm text-brand-700">{caption}</figcaption>
      )}
    </figure>
  );
}
