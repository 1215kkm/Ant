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
        // 사용자 가독성 우선: 모든 단계 +3px
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
