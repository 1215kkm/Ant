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
        // 깨끗한 파랑 (clean blue) — primary brand
        brand: {
          50: "#EFF8FF",
          100: "#DBEEFE",
          200: "#BFE0FD",
          300: "#93CCFB",
          400: "#5FB4F8",
          500: "#2E9CF2",
          600: "#1B82D6",
          700: "#1668AA",
          800: "#114F80",
          900: "#0B3F6B",
        },
        // 스플래시 단계용 (지저분함 → 물 → 깨끗함)
        splash: {
          dirty: "#5C5040",
          grime: "#7A6B55",
          water: "#7FCBF6",
        },
        // 상태색
        success: "#16A34A",
        warning: "#F59E0B",
        danger: "#DC2626",
      },
      fontFamily: {
        sans: [
          "var(--font-pretendard)",
          "Pretendard Variable",
          "Pretendard",
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
      },
      fontSize: {
        // 기본 16px 기준, 위계 3단계만 사용 권장
        xs: ["0.75rem", { lineHeight: "1.1rem" }],   // 12
        sm: ["0.875rem", { lineHeight: "1.25rem" }], // 14
        base: ["1rem", { lineHeight: "1.6rem" }],    // 16 (default)
        lg: ["1.125rem", { lineHeight: "1.75rem" }], // 18
        xl: ["1.25rem", { lineHeight: "1.875rem" }], // 20 (페이지 제목)
        "2xl": ["1.5rem", { lineHeight: "2rem" }],   // 24 (큰 제목)
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
