"use client";

import type { Complex } from "@/lib/quantum-state";
import { phaseToColor } from "@/lib/quantum-state";

interface StatevectorChartProps {
  amplitudes: Complex[];
  numQubits: number;
  error?: string | null;
}

export function StatevectorChart({
  amplitudes,
  numQubits,
  error,
}: StatevectorChartProps) {
  if (error) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-[var(--color-muted-foreground)]">
        {error}
      </div>
    );
  }

  if (numQubits === 0 || amplitudes.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-[var(--color-muted-foreground)]">
        Add gates to see the statevector
      </div>
    );
  }

  if (numQubits > 6) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-[var(--color-muted-foreground)]">
        Statevector view supports up to 6 qubits
      </div>
    );
  }

  const maxMag = Math.max(
    ...amplitudes.map((a) => Math.sqrt(a.re * a.re + a.im * a.im)),
    0.01
  );
  const chartHeight = 120;
  const barWidth = Math.max(8, Math.min(32, 400 / amplitudes.length));

  return (
    <div className="flex h-full flex-col overflow-auto">
      <svg
        width="100%"
        height={chartHeight + 24}
        viewBox={`0 0 ${amplitudes.length * (barWidth + 4) + 8} ${chartHeight + 24}`}
        className="min-w-full"
      >
        {amplitudes.map((amp, i) => {
          const mag = Math.sqrt(amp.re * amp.re + amp.im * amp.im);
          const phase = Math.atan2(amp.im, amp.re);
          const barH = (mag / maxMag) * chartHeight;
          const label = i.toString(2).padStart(numQubits, "0");
          const x = 4 + i * (barWidth + 4);

          return (
            <g key={i}>
              <rect
                x={x}
                y={chartHeight - barH}
                width={barWidth}
                height={barH}
                fill={phaseToColor(phase)}
                opacity={mag > 0.001 ? 0.9 : 0.15}
                rx={1}
              />
              <text
                x={x + barWidth / 2}
                y={chartHeight + 14}
                textAnchor="middle"
                className="fill-[var(--color-muted-foreground)]"
                fontSize={8}
                fontFamily="monospace"
              >
                |{label}⟩
              </text>
            </g>
          );
        })}
      </svg>
      <p className="mt-1 text-[10px] text-[var(--color-muted-foreground)]">
        Bar height = |amplitude|; color = phase
      </p>
    </div>
  );
}
