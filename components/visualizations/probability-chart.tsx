"use client";

import { useMemo } from "react";
import type { ProbabilityEntry } from "@/lib/quantum-state";

interface ProbabilityChartProps {
  probabilities: ProbabilityEntry[];
  numQubits: number;
  error?: string | null;
}

export function ProbabilityChart({
  probabilities,
  numQubits,
  error,
}: ProbabilityChartProps) {
  const visible = useMemo(
    () => probabilities.filter((p) => p.probability > 1e-6),
    [probabilities]
  );

  const chartHeight = 160;
  const padding = { top: 16, right: 12, bottom: 36, left: 44 };
  const innerW = Math.max(probabilities.length * 36, 120);
  const innerH = chartHeight - padding.top - padding.bottom;
  const chartWidth = padding.left + innerW + padding.right;
  const barWidth = Math.min(40, innerW / Math.max(probabilities.length, 1) - 4);
  const probSum = probabilities.reduce((s, p) => s + p.probability, 0);
  const scrollable = probabilities.length > 16;

  if (error) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-[var(--color-muted-foreground)]">
        {error}
      </div>
    );
  }

  if (numQubits === 0) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-[var(--color-muted-foreground)]">
        Add qubits to see probabilities
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className={`min-h-0 flex-1 ${scrollable ? "overflow-x-auto" : ""}`}>
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          width="100%"
          height="100%"
          preserveAspectRatio="xMidYMid meet"
          className="min-h-[100px]"
          aria-label="Probability distribution chart"
        >
        {/* Y-axis */}
        <line
          x1={padding.left}
          y1={padding.top}
          x2={padding.left}
          y2={padding.top + innerH}
          stroke="var(--color-border)"
          strokeWidth={1}
        />
        <text
          x={12}
          y={padding.top + innerH / 2}
          fill="var(--color-muted-foreground)"
          fontSize={10}
          transform={`rotate(-90, 12, ${padding.top + innerH / 2})`}
          textAnchor="middle"
        >
          Probability (%)
        </text>

        {/* Y-axis ticks */}
        {[0, 25, 50, 75, 100].map((tick) => {
          const y = padding.top + innerH - (tick / 100) * innerH;
          return (
            <g key={tick}>
              <line
                x1={padding.left - 4}
                y1={y}
                x2={padding.left}
                y2={y}
                stroke="var(--color-border)"
              />
              <text
                x={padding.left - 8}
                y={y + 3}
                fill="var(--color-muted-foreground)"
                fontSize={9}
                textAnchor="end"
              >
                {tick}
              </text>
              <line
                x1={padding.left}
                y1={y}
                x2={padding.left + innerW}
                y2={y}
                stroke="var(--color-border)"
                strokeOpacity={0.3}
                strokeDasharray="2,2"
              />
            </g>
          );
        })}

        {/* Bars */}
        {probabilities.map((entry, i) => {
          const x =
            padding.left +
            (i + 0.5) * (innerW / probabilities.length) -
            barWidth / 2;
          const barH = (entry.percentage / 100) * innerH;
          const y = padding.top + innerH - barH;
          const isVisible = entry.probability > 1e-6;

          return (
            <g key={entry.label}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={Math.max(barH, isVisible ? 2 : 0)}
                rx={2}
                fill={
                  isVisible
                    ? "var(--color-viz-accent)"
                    : "var(--color-border)"
                }
                fillOpacity={isVisible ? 0.85 : 0.3}
              />
              <text
                x={x + barWidth / 2}
                y={padding.top + innerH + 14}
                fill="var(--color-muted-foreground)"
                fontSize={9}
                textAnchor="middle"
                fontFamily="monospace"
              >
                {entry.label.replace(/\|/g, "")}
              </text>
              {isVisible && entry.percentage >= 1 && (
                <text
                  x={x + barWidth / 2}
                  y={y - 4}
                  fill="var(--color-foreground)"
                  fontSize={8}
                  textAnchor="middle"
                >
                  {entry.percentage.toFixed(0)}%
                </text>
              )}
            </g>
          );
        })}

        {/* X-axis */}
        <line
          x1={padding.left}
          y1={padding.top + innerH}
          x2={padding.left + innerW}
          y2={padding.top + innerH}
          stroke="var(--color-border)"
        />
      </svg>
      </div>
      {visible.length === 1 && (
        <p className="mt-1 text-center text-[10px] text-[var(--color-muted-foreground)]">
          State: {visible[0].label} — {visible[0].percentage.toFixed(1)}%
        </p>
      )}
      {Math.abs(probSum - 1) > 0.01 && (
        <p className="mt-1 text-center text-[10px] text-[var(--color-warning)]">
          Probabilities sum to {(probSum * 100).toFixed(1)}% (expected 100%)
        </p>
      )}
    </div>
  );
}
