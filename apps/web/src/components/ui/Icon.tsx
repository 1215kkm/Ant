import { clsx } from "clsx";

type IconProps = {
  /** Material Symbol 이름 (예: "build", "notifications", "receipt_long") */
  name: string;
  /** 활성/선택 상태일 때 채움(filled) 변형 */
  filled?: boolean;
  /** 아이콘 크기(px). 기본 24 */
  size?: 18 | 20 | 24 | 28 | 32 | 40 | 48;
  /** 굵기. 기본 400 */
  weight?: 300 | 400 | 500 | 600 | 700;
  className?: string;
  "aria-label"?: string;
};

/**
 * Google Material Symbols (Rounded) 단일 래퍼.
 * Variable font의 FILL/wght axes를 prop으로 제어한다.
 */
export function Icon({
  name,
  filled = false,
  size = 24,
  weight = 400,
  className,
  "aria-label": ariaLabel,
}: IconProps) {
  return (
    <span
      className={clsx("ms-icon select-none", className)}
      data-filled={filled || undefined}
      aria-hidden={ariaLabel ? undefined : true}
      aria-label={ariaLabel}
      role={ariaLabel ? "img" : undefined}
      style={{
        fontSize: `${size}px`,
        width: `${size}px`,
        height: `${size}px`,
        fontVariationSettings: `"FILL" ${filled ? 1 : 0}, "wght" ${weight}, "GRAD" 0, "opsz" ${size}`,
      }}
    >
      {name}
    </span>
  );
}
