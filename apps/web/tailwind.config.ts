import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Crowny 메인 보라 ramp — design-system.md `#6C3CE1` 를 brand-500 으로 고정,
        // 50~400 은 흰색으로 보간(밝게), 600~900 은 검정으로 보간(어둡게)하여 자연스러운 명도 단계.
        // 600 = `#5B2FD6`(design-system.md 배경 그라데이션 시작색)과 일치.
        brand: {
          50: "#F5F1FE",
          100: "#EDE9FE",
          200: "#DDD3FD",
          300: "#C3B0FA",
          400: "#9B72FF", // design-system.md 배경 그라데이션 끝색과 일치
          500: "#6C3CE1", // design-system.md 메인 보라
          600: "#5B2FD6", // design-system.md 배경 그라데이션 시작색
          700: "#4A23B8",
          800: "#3A1B91",
          900: "#2A1370",
        },
        // 핑크 액센트 (메인 버튼 그라데이션 끝, 채팅 내 메시지 끝)
        accent: "#D63384",
        // 직접 참조용 Crowny 팔레트 (그라데이션 등에서 사용)
        crowny: {
          purple: "#6C3CE1",
          pink: "#D63384",
          orange: "#E8590C",
          cyan: "#0EA5E9",
          green: "#059669",
        },
        // 스플래시 단계용 (스플래시 UI 결정은 다음 turn — 일단 유지)
        splash: {
          dirty: "#5C5040",
          grime: "#7A6B55",
          water: "#7FCBF6",
        },
        // 상태색 — design-system.md 와 통일
        success: "#059669", // design-system.md 초록
        warning: "#F59E0B",
        danger: "#E11D48", // design-system.md 매너 태그 빨강과 통일
      },
      fontFamily: {
        // design-system.md: 'Noto Sans KR' 가 기본. Pretendard 는 점진적 마이그레이션 fallback.
        sans: [
          "'Noto Sans KR'",
          "var(--font-pretendard)",
          "Pretendard Variable",
          "Pretendard",
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
      },
      fontSize: {
        // 사용자 가독성 우선: 모든 단계 +3px (design-system.md "기본값 +3" 과 일치)
        xs: ["0.9375rem", { lineHeight: "1.4rem" }],     // 15 (was 12)
        sm: ["1.0625rem", { lineHeight: "1.5rem" }],     // 17 (was 14)
        base: ["1.1875rem", { lineHeight: "1.75rem" }],  // 19 (was 16)
        lg: ["1.3125rem", { lineHeight: "1.95rem" }],    // 21 (was 18)
        xl: ["1.4375rem", { lineHeight: "2.1rem" }],     // 23 (was 20)
        "2xl": ["1.6875rem", { lineHeight: "2.25rem" }], // 27 (was 24)
        "3xl": ["2rem", { lineHeight: "2.5rem" }],       // 32 hero
      },
      spacing: {
        "safe-top": "env(safe-area-inset-top)",
        "safe-bottom": "env(safe-area-inset-bottom)",
      },
      minHeight: {
        tap: "44px",
      },
      minWidth: {
        tap: "44px",
      },
      animation: {
        "splash-grain": "splash-grain 0.8s steps(4) infinite",
        "water-fall": "water-fall 1.4s cubic-bezier(0.4, 0, 0.2, 1) forwards",
        "logo-rise": "logo-rise 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards",
      },
      keyframes: {
        "splash-grain": {
          "0%": { transform: "translate(0,0)" },
          "25%": { transform: "translate(-2px,1px)" },
          "50%": { transform: "translate(1px,-1px)" },
          "75%": { transform: "translate(2px,2px)" },
          "100%": { transform: "translate(0,0)" },
        },
        "water-fall": {
          "0%": { clipPath: "inset(0 0 100% 0)" },
          "100%": { clipPath: "inset(0 0 0 0)" },
        },
        "logo-rise": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
