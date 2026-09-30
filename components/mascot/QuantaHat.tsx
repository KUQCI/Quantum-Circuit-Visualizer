import type { HatId } from "@/lib/quanta-buddy/wardrobe";
import { HAT_HEIGHT, HAT_WIDTH } from "@/lib/quanta-buddy/wardrobe";

const OUTLINE = "#3b2f1e";

function HatShape({ hat }: { hat: HatId }) {
  switch (hat) {
    case "eggshell":
      return (
        <path
          d="M7 40 Q6 19 22 17 Q38 19 37 40 L33 34 L29 39 L25 33 L21 39 L17 33 L13 39 L10 34 Z"
          fill="#fdf8ec"
          stroke="#b9ad90"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      );
    case "propeller":
      return (
        <>
          <path d="M20 21 L22 12 L24 21 Z" fill="#475569" />
          <ellipse cx="14" cy="12" rx="8" ry="2.5" fill="#ef4444" stroke={OUTLINE} strokeWidth="1" />
          <ellipse cx="30" cy="12" rx="8" ry="2.5" fill="#3b82f6" stroke={OUTLINE} strokeWidth="1" />
          <circle cx="22" cy="12" r="2" fill="#facc15" stroke={OUTLINE} strokeWidth="1" />
          <path d="M6 39 Q6 21 22 21 Q38 21 38 39 Z" fill="#ef4444" stroke={OUTLINE} strokeWidth="1.5" />
          <path d="M16 22.5 Q13 30 13 39 L22 39 L22 21 Z" fill="#3b82f6" />
          <path d="M28 22.5 Q31 30 31 39 L22 39 L22 21 Z" fill="#facc15" />
          <path d="M6 39 Q6 21 22 21 Q38 21 38 39 Z" fill="none" stroke={OUTLINE} strokeWidth="1.5" />
          <rect x="4" y="36.5" width="36" height="3.5" rx="1.75" fill="#1e3a8a" />
        </>
      );
    case "mortarboard":
      return (
        <>
          <path d="M10 40 L11 29 L33 29 L34 40 Z" fill="#1f2937" stroke="#0b0f17" strokeWidth="1.2" />
          <polygon points="1,25 22,16 43,25 22,33" fill="#111827" stroke="#374151" strokeWidth="1.2" strokeLinejoin="round" />
          <circle cx="22" cy="24.5" r="1.6" fill="#facc15" />
          <path d="M22 24.5 L38 27 L38 34" fill="none" stroke="#facc15" strokeWidth="1.4" />
          <path d="M36.2 33 L39.8 33 L40.6 39 L35.4 39 Z" fill="#facc15" stroke="#a16207" strokeWidth="0.8" />
        </>
      );
    case "hardhat":
      return (
        <>
          <path d="M6 37 Q5 17 22 16 Q39 17 38 37 Z" fill="#fbbf24" stroke="#92400e" strokeWidth="1.5" />
          <path d="M19 16.4 L19 37 M25 16.4 L25 37" stroke="#f59e0b" strokeWidth="3" />
          <path d="M6 37 Q5 17 22 16 Q39 17 38 37 Z" fill="none" stroke="#92400e" strokeWidth="1.5" />
          <rect x="1" y="35" width="42" height="5" rx="2.5" fill="#f59e0b" stroke="#92400e" strokeWidth="1.2" />
        </>
      );
    case "wizard":
      return (
        <>
          <path d="M8 38 L20 7 Q23 1 29 5 L26 8 Q23 7 22.5 11 L36 38 Z" fill="#6d28d9" stroke="#2e1065" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M18.5 22 l1.2 2.6 2.8 0.3 -2.1 1.9 0.6 2.8 -2.5 -1.4 -2.5 1.4 0.6 -2.8 -2.1 -1.9 2.8 -0.3 z" fill="#fde047" />
          <circle cx="27" cy="30" r="1.4" fill="#fde047" />
          <circle cx="24" cy="15" r="1" fill="#fde047" />
          <ellipse cx="22" cy="37.5" rx="21" ry="2.8" fill="#5b21b6" stroke="#2e1065" strokeWidth="1.2" />
        </>
      );
    case "tophat":
      return (
        <>
          <rect x="10" y="7" width="24" height="30" rx="2" fill="#18181b" stroke="#000" strokeWidth="1.2" />
          <rect x="10" y="27" width="24" height="5" fill="#b91c1c" />
          <path d="M13 9 L13 26" stroke="#3f3f46" strokeWidth="2" strokeLinecap="round" />
          <ellipse cx="22" cy="37" rx="20" ry="3.3" fill="#27272a" stroke="#000" strokeWidth="1.2" />
        </>
      );
    case "crown":
      return (
        <>
          <path
            d="M6 40 L5 18 L14 28 L22 12 L30 28 L39 18 L38 40 Z"
            fill="#facc15"
            stroke="#a16207"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <rect x="6" y="34" width="32" height="4" fill="#eab308" />
          <circle cx="22" cy="27" r="2.6" fill="#ef4444" stroke="#7f1d1d" strokeWidth="0.8" />
          <circle cx="13" cy="33" r="1.8" fill="#3b82f6" />
          <circle cx="31" cy="33" r="1.8" fill="#22c55e" />
          <circle cx="5" cy="18" r="1.6" fill="#fde68a" />
          <circle cx="22" cy="12" r="1.6" fill="#fde68a" />
          <circle cx="39" cy="18" r="1.6" fill="#fde68a" />
        </>
      );
  }
}

export function QuantaHatArt({ hat, size = HAT_WIDTH }: { hat: HatId; size?: number }) {
  return (
    <svg
      width={size}
      height={(size * HAT_HEIGHT) / HAT_WIDTH}
      viewBox={`0 0 ${HAT_WIDTH} ${HAT_HEIGHT}`}
      aria-hidden="true"
      focusable="false"
      style={{ overflow: "visible", display: "block" }}
    >
      <HatShape hat={hat} />
    </svg>
  );
}
