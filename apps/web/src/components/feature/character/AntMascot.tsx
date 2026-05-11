type AntMascotProps = {
  size?: number;
  className?: string;
  /** 살짝 둥둥 떠다니는 애니메이션 */
  floating?: boolean;
};

/**
 * 개미청소 마스코트 — 둥근 몸통 + 큰 눈 + 더듬이.
 * 친근한 풍선체 일러스트, 브랜드 블루 그라데이션.
 */
export function AntMascot({ size = 180, className, floating = true }: AntMascotProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="개미 마스코트"
      className={
        (floating ? "ant-mascot-float " : "") + (className || "")
      }
    >
      <defs>
        <linearGradient id="ant-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5FB4F8" />
          <stop offset="100%" stopColor="#1B82D6" />
        </linearGradient>
        <linearGradient id="ant-head" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#93CCFB" />
          <stop offset="100%" stopColor="#2E9CF2" />
        </linearGradient>
        <radialGradient id="ant-blush" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FF8FB1" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#FF8FB1" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* 더듬이 */}
      <g stroke="#0B3F6B" strokeWidth="5" strokeLinecap="round" fill="none">
        <path d="M82 40 Q72 22 60 16" />
        <path d="M118 40 Q128 22 140 16" />
      </g>
      <circle cx="60" cy="14" r="6" fill="#FFE27A" />
      <circle cx="140" cy="14" r="6" fill="#FFE27A" />

      {/* 몸통 (큰 둥근) */}
      <ellipse cx="100" cy="130" rx="58" ry="50" fill="url(#ant-body)" />

      {/* 머리 (둥근) */}
      <circle cx="100" cy="75" r="48" fill="url(#ant-head)" />

      {/* 볼터치 */}
      <circle cx="70" cy="90" r="10" fill="url(#ant-blush)" />
      <circle cx="130" cy="90" r="10" fill="url(#ant-blush)" />

      {/* 큰 눈 (흰자) */}
      <ellipse cx="84" cy="78" rx="11" ry="14" fill="#FFFFFF" />
      <ellipse cx="116" cy="78" rx="11" ry="14" fill="#FFFFFF" />

      {/* 검은 눈동자 */}
      <ellipse cx="84" cy="80" rx="6" ry="8" fill="#0B3F6B" />
      <ellipse cx="116" cy="80" rx="6" ry="8" fill="#0B3F6B" />

      {/* 눈 하이라이트 */}
      <circle cx="86" cy="75" r="2.5" fill="#FFFFFF" />
      <circle cx="118" cy="75" r="2.5" fill="#FFFFFF" />
      <circle cx="82" cy="84" r="1.5" fill="#FFFFFF" />
      <circle cx="114" cy="84" r="1.5" fill="#FFFFFF" />

      {/* 입 (살짝 미소) */}
      <path
        d="M93 98 Q100 104 107 98"
        stroke="#0B3F6B"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />

      {/* 작은 팔 (다리 대신 친근하게) */}
      <path
        d="M52 130 Q40 138 38 152"
        stroke="#1B82D6"
        strokeWidth="9"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M148 130 Q160 138 162 152"
        stroke="#1B82D6"
        strokeWidth="9"
        strokeLinecap="round"
        fill="none"
      />

      {/* 비누 거품 (오른손) */}
      <circle cx="166" cy="148" r="8" fill="#FFFFFF" stroke="#BFE0FD" strokeWidth="2" />
      <circle cx="158" cy="138" r="4" fill="#FFFFFF" stroke="#BFE0FD" strokeWidth="1.5" />

      {/* 반짝이 */}
      <g fill="#FFE27A">
        <path d="M30 60 l3 -6 l3 6 l6 3 l-6 3 l-3 6 l-3 -6 l-6 -3 z" />
        <path d="M170 100 l2 -4 l2 4 l4 2 l-4 2 l-2 4 l-2 -4 l-4 -2 z" />
        <path d="M20 130 l2 -4 l2 4 l4 2 l-4 2 l-2 4 l-2 -4 l-4 -2 z" />
      </g>
    </svg>
  );
}
