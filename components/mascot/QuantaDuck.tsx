"use client";

import { cn } from "@/lib/utils";

interface QuantaDuckProps {
  size?: number;
  className?: string;
  animated?: boolean;
}

/** Minimal SVG mascot — Quanta the Duck with quantum lab goggles */
export function QuantaDuck({
  size = 48,
  className,
  animated = false,
}: QuantaDuckProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={cn(animated && "animate-[quanta-bob_3s_ease-in-out_infinite]", className)}
      role="img"
      aria-label="Quanta the Duck mascot"
    >
      {/* Orbit ring */}
      <ellipse
        cx="32"
        cy="34"
        rx="28"
        ry="10"
        fill="none"
        stroke="url(#quantaOrbit)"
        strokeWidth="1.5"
        opacity="0.7"
        transform="rotate(-15 32 34)"
      />
      {/* Body */}
      <ellipse cx="32" cy="38" rx="18" ry="16" fill="#f6c453" />
      {/* Wing */}
      <ellipse cx="22" cy="40" rx="7" ry="5" fill="#e8a820" opacity="0.8" />
      {/* Head */}
      <circle cx="32" cy="22" r="14" fill="#f6c453" />
      {/* Scarf */}
      <path
        d="M18 28 Q32 36 46 28 L44 32 Q32 40 20 32 Z"
        fill="url(#quantaScarf)"
      />
      {/* Lab goggles */}
      <rect x="20" y="18" width="10" height="8" rx="2" fill="#7dd3fc" opacity="0.9" />
      <rect x="34" y="18" width="10" height="8" rx="2" fill="#7dd3fc" opacity="0.9" />
      <rect x="29" y="20" width="6" height="3" fill="#4589ff" />
      {/* Eyes */}
      <circle cx="25" cy="22" r="2" fill="#0f172a" />
      <circle cx="39" cy="22" r="2" fill="#0f172a" />
      {/* Beak */}
      <path d="M28 26 L32 30 L36 26 Z" fill="#ea580c" />
      {/* Quantum spark */}
      <circle cx="50" cy="14" r="3" fill="#a78bfa" opacity="0.9">
        {animated && (
          <animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite" />
        )}
      </circle>
      <line x1="50" y1="10" x2="50" y2="7" stroke="#a78bfa" strokeWidth="1.5" />
      <line x1="54" y1="14" x2="57" y2="14" stroke="#a78bfa" strokeWidth="1.5" />
      <defs>
        <linearGradient id="quantaScarf" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#4589ff" />
          <stop offset="100%" stopColor="#a78bfa" />
        </linearGradient>
        <linearGradient id="quantaOrbit" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#7dd3fc" />
          <stop offset="100%" stopColor="#a78bfa" />
        </linearGradient>
      </defs>
    </svg>
  );
}
