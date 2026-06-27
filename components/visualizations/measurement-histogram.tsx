"use client";

import type { HistogramEntry } from "@/lib/shot-simulator";

interface MeasurementHistogramProps {
  histogram: HistogramEntry[];
  shots: number;
  registerLabel?: string;
  error?: string | null;
  emptyMessage?: string;
}

export function MeasurementHistogram({
  histogram,
  shots,
  registerLabel,
  error,
  emptyMessage = "Run the circuit to see measurement results",
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

  const chartWidth = Math.max(320, histogram.length * 40);
  const chartHeight = 160;
  const padding = { top: 16, right: 12, bottom: 36, left: 44 };
  const innerW = chartWidth - padding.left - padding.right;
  const innerH = chartHeight - padding.top - padding.bottom;
  const barWidth = Math.min(48, innerW / histogram.length - 4);
  const maxPct = Math.max(...histogram.map((h) => h.percentage), 1);

  return (
    <div className="h-full overflow-x-auto">
      {registerLabel && (
        <p className="mb-1 text-[10px] text-[var(--color-muted-foreground)]">
          Register: {registerLabel} · {shots.toLocaleString()} shots
        </p>
      )}
      <svg
        width={chartWidth}
        height={chartHeight}
        className="min-w-full"
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

        {histogram.map((entry, i) => {
          const x =
            padding.left +
            (i + 0.5) * (innerW / histogram.length) -
            barWidth / 2;
          const barH = (entry.percentage / maxPct) * innerH;
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
  );
}
