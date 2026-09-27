"use client";

import type { HistogramEntry } from "@/lib/shot-simulator";
import { getNoisePresetLabel, type NoiseModel } from "@/lib/noise-model";

interface MeasurementHistogramProps {
  histogram: HistogramEntry[];
  shots: number;
  registerLabel?: string;
  error?: string | null;
  emptyMessage?: string;
  noise?: NoiseModel;
}

export function histogramAxisMax(maxPct: number): number {
  return Math.min(100, Math.ceil(maxPct / 25) * 25 || 25);
}

export function MeasurementHistogram({
  histogram,
  shots,
  registerLabel,
  error,
  emptyMessage = "Run circuit to see measurement results",
  noise,
}: MeasurementHistogramProps) {
  if (error) {
    return (
      <div className="flex h-full items-center justify-center px-3 text-center text-xs text-[var(--color-destructive)]">
        {error}
      </div>
    );
  }

  if (histogram.length === 0) {
    return (
      <div className="flex h-full items-center justify-center px-3 text-center text-xs text-[var(--color-muted-foreground)]">
        {emptyMessage}
      </div>
    );
  }

  const chartHeight = 160;
  const padding = { top: 16, right: 12, bottom: 36, left: 44 };
  const innerW = Math.max(histogram.length * 40, 120);
  const innerH = chartHeight - padding.top - padding.bottom;
  const chartWidth = padding.left + innerW + padding.right;
  const barWidth = Math.min(48, innerW / histogram.length - 4);
  const maxPct = Math.max(...histogram.map((h) => h.percentage), 1);
  const axisMax = histogramAxisMax(maxPct);
  const scrollable = histogram.length > 16;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      {registerLabel && (
        <div className="mb-1 flex shrink-0 items-center justify-between gap-2 text-[10px] text-[var(--color-muted-foreground)]">
          <p>
            Register: {registerLabel} · {shots.toLocaleString()} shots
          </p>
          {noise && (
            <span className="shrink-0 rounded-full bg-[var(--color-brand-subtle)] px-2 py-0.5 font-medium text-[var(--color-brand)]">
              Noise: {getNoisePresetLabel(noise)}
            </span>
          )}
        </div>
      )}
      <div className={`min-h-0 flex-1 ${scrollable ? "overflow-x-auto" : ""}`}>
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          width="100%"
          height="100%"
          preserveAspectRatio="xMidYMid meet"
          className="min-h-[100px]"
          aria-label="Measurement histogram"
        >
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
          Count (%)
        </text>

        {[0, 1, 2, 3, 4].map((step) => {
          const tick = (axisMax / 4) * step;
          const y = padding.top + innerH - (tick / axisMax) * innerH;
          return (
            <g key={step}>
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
                {Math.round(tick)}
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

        {histogram.map((entry, i) => {
          const x =
            padding.left +
            (i + 0.5) * (innerW / histogram.length) -
            barWidth / 2;
          const barH = (entry.percentage / axisMax) * innerH;
          const y = padding.top + innerH - barH;

          return (
            <g key={entry.label}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={Math.max(barH, 2)}
                rx={2}
                fill="var(--color-brand)"
                fillOpacity={0.85}
              />
              <text
                x={x + barWidth / 2}
                y={padding.top + innerH + 14}
                fill="var(--color-muted-foreground)"
                fontSize={9}
                textAnchor="middle"
                fontFamily="monospace"
              >
                {entry.label}
              </text>
              {entry.percentage >= 3 && (
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
              <title>
                {entry.label}: {entry.count} counts ({entry.percentage.toFixed(1)}%)
              </title>
            </g>
          );
        })}

        <line
          x1={padding.left}
          y1={padding.top + innerH}
          x2={padding.left + innerW}
          y2={padding.top + innerH}
          stroke="var(--color-border)"
        />
      </svg>
      </div>
    </div>
  );
}
