"use client";

import { useEffect, useState } from "react";

type SplashScreenProps = {
  /** 애니메이션 종료 후 호출 */
  onDone?: () => void;
  /** 한 세션에서 한 번만 표시. 기본 true */
  oncePerSession?: boolean;
};

const SESSION_KEY = "ant.splash.shown";
const TOTAL_MS = 2400;

/**
 * 개미청소 스플래시:
 * 1) 0~400ms   지저분한 패턴 전체 화면
 * 2) 400~1800  위에서 아래로 물이 떨어지며 더러움이 씻겨내려감
 * 3) 1800~2400 깨끗한 파랑 배경 + 개미청소 로고 페이드인
 *
 * `prefers-reduced-motion`이 켜져있으면 즉시 로고 단계로 건너뜀.
 */
export function SplashScreen({ onDone, oncePerSession = true }: SplashScreenProps) {
  const [visible, setVisible] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (oncePerSession && typeof window !== "undefined") {
      if (sessionStorage.getItem(SESSION_KEY) === "1") {
        setVisible(false);
        onDone?.();
        return;
      }
    }
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);

    const dwell = mq.matches ? 600 : TOTAL_MS;
    const t = setTimeout(() => {
      try {
        sessionStorage.setItem(SESSION_KEY, "1");
      } catch {
        /* private mode 등 무시 */
      }
      setVisible(false);
      onDone?.();
    }, dwell);
    return () => clearTimeout(t);
  }, [onDone, oncePerSession]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] overflow-hidden bg-brand-50"
      role="status"
      aria-label="개미청소 로딩"
    >
      {/* 1) 지저분한 더러움 레이어 — 위에서 아래로 잘려나감 */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "url('/brand/grime-pattern.svg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          animation: reducedMotion
            ? "splash-grime-fadeout 0.3s ease-out forwards"
            : "splash-grime-wash 1.4s cubic-bezier(0.4, 0, 0.2, 1) 0.3s forwards",
        }}
      />

      {/* 물 흘러내림 효과 (위쪽에서 아래로) */}
      {!reducedMotion && (
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-full"
          style={{
            background:
              "linear-gradient(to bottom, rgba(127,203,246,0.85) 0%, rgba(127,203,246,0.55) 30%, rgba(127,203,246,0.15) 70%, transparent 100%)",
            animation: "splash-water-drop 1.4s cubic-bezier(0.4, 0, 0.2, 1) 0.3s forwards",
            transform: "translateY(-100%)",
          }}
        />
      )}

      {/* 깨끗한 파랑 배경(맨 아래) — bg-brand-50으로 컨테이너에 이미 적용됨 */}

      {/* 3) 로고 + 워드마크 */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <img
          src="/brand/ant-clean-logo.svg"
          alt="개미청소"
          width={120}
          height={120}
          className={
            reducedMotion
              ? "h-[120px] w-[120px] opacity-100"
              : "h-[120px] w-[120px] opacity-0"
          }
          style={
            reducedMotion
              ? undefined
              : {
                  animation: "logo-rise 0.6s cubic-bezier(0.16, 1, 0.3, 1) 1.7s forwards",
                }
          }
        />
        <p
          className={
            "mt-4 text-xl font-semibold text-brand-900 " +
            (reducedMotion ? "opacity-100" : "opacity-0")
          }
          style={
            reducedMotion
              ? undefined
              : { animation: "logo-rise 0.6s cubic-bezier(0.16, 1, 0.3, 1) 1.85s forwards" }
          }
        >
          개미청소
        </p>
      </div>

      {/* 컴포넌트 로컬 keyframes */}
      <style>{`
        @keyframes splash-grime-wash {
          0%   { clip-path: inset(0 0 0 0); }
          100% { clip-path: inset(100% 0 0 0); }
        }
        @keyframes splash-grime-fadeout {
          to { opacity: 0; }
        }
        @keyframes splash-water-drop {
          0%   { transform: translateY(-100%); }
          70%  { transform: translateY(0%); }
          100% { transform: translateY(100%); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
