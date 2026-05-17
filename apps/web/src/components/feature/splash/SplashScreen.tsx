"use client";

import { useEffect, useState } from "react";

type SplashScreenProps = {
  onDone?: () => void;
  /** 한 세션에서 한 번만 표시. 기본 true */
  oncePerSession?: boolean;
};

const SESSION_KEY = "ant.splash.shown";
const SHOW_MS = 1100;
const FADE_MS = 400;

/**
 * 단순한 스플래시: 중앙에 개미 마스코트 크게 표시 → 페이드아웃 → 본 화면.
 * prefers-reduced-motion 켜져있으면 즉시 사라짐.
 */
export function SplashScreen({ onDone, oncePerSession = true }: SplashScreenProps) {
  const [visible, setVisible] = useState(true);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (oncePerSession && typeof window !== "undefined") {
      if (sessionStorage.getItem(SESSION_KEY) === "1") {
        setVisible(false);
        onDone?.();
        return;
      }
    }

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dwell = reduced ? 200 : SHOW_MS;

    const fadeT = setTimeout(() => setLeaving(true), dwell);
    const doneT = setTimeout(() => {
      try {
        sessionStorage.setItem(SESSION_KEY, "1");
      } catch {
        /* private mode 등 무시 */
      }
      setVisible(false);
      onDone?.();
    }, dwell + FADE_MS);

    return () => {
      clearTimeout(fadeT);
      clearTimeout(doneT);
    };
  }, [onDone, oncePerSession]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white transition-opacity"
      role="status"
      aria-label="개미청소 로딩"
      style={{ opacity: leaving ? 0 : 1, transitionDuration: `${FADE_MS}ms` }}
    >
      <p className="text-3xl font-bold tracking-tight text-brand-500">개미청소</p>
      <p className="mt-3 text-base text-brand-700">깨끗한 건물 관리</p>
    </div>
  );
}
