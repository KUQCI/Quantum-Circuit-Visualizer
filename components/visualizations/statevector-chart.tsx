"use client";

import { useState } from "react";
import type { Complex } from "@/lib/quantum-state";
import { phaseToColor } from "@/lib/quantum-state";
import { cn } from "@/lib/utils";

interface StatevectorChartProps {
  amplitudes: Complex[];
  numQubits: number;
  error?: string | null;
}

function formatPhase(rad: number): string {
  const deg = (rad * 180) / Math.PI;
  if (Math.abs(deg) < 0.05) return "0°";
  if (Math.abs(deg - 180) < 0.05) return "π";
  if (Math.abs(deg + 180) < 0.05) return "−π";
  if (Math.abs(deg - 90) < 0.05) return "π/2";
  if (Math.abs(deg + 90) < 0.05) return "−π/2";
  return `${deg.toFixed(1)}°`;
}

export function StatevectorChart({
  amplitudes,
  numQubits,
  error,
}: StatevectorChartProps) {
  const [view, setView] = useState<"bars" | "table">("table");

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

  const rows = amplitudes.map((amp, i) => {
    const mag = Math.sqrt(amp.re * amp.re + amp.im * amp.im);
    const phase = Math.atan2(amp.im, amp.re);
    const label = i.toString(2).padStart(numQubits, "0");
    return { label, amp, mag, phase, prob: mag * mag };
  });

  const visibleRows = rows.filter((r) => r.prob > 1e-8);
  const maxMag = Math.max(...rows.map((r) => r.mag), 0.01);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="mb-1 flex shrink-0 gap-1">
        {(["table", "bars"] as const).map((v) => (
          <button
            key={v}
            type="button"
            className={cn(
              "segment-btn px-2 py-0.5 text-[10px]",
              view === v && "segment-btn-active"
            )}
            onClick={() => setView(v)}
            aria-pressed={view === v}
          >
            {v === "table" ? "Table" : "Bars"}
          </button>
        ))}
      </div>

      {view === "table" ? (
        <div className="min-h-0 flex-1 overflow-auto">
          <table className="w-full text-[10px]">
            <thead className="sticky top-0 bg-[var(--color-background)]">
              <tr className="border-b border-[var(--color-border)] text-left text-[var(--color-muted-foreground)]">
                <th className="py-1 pr-2 font-medium">State</th>
                <th className="py-1 pr-2 font-medium">Real</th>
                <th className="py-1 pr-2 font-medium">Imag</th>
                <th className="py-1 pr-2 font-medium">|amp|</th>
                <th className="py-1 pr-2 font-medium">Phase</th>
                <th className="py-1 font-medium">P(%)</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-4 text-center text-[var(--color-muted-foreground)]"
                  >
                    All amplitudes negligible
                  </td>
                </tr>
              ) : (
                visibleRows.map((row) => (
                  <tr
                    key={row.label}
                    className="border-b border-[var(--color-border)]/50 font-mono"
                  >
                    <td className="py-1 pr-2">|{row.label}⟩</td>
                    <td className="py-1 pr-2">{row.amp.re.toFixed(4)}</td>
                    <td className="py-1 pr-2">{row.amp.im.toFixed(4)}</td>
                    <td className="py-1 pr-2">{row.mag.toFixed(4)}</td>
                    <td className="py-1 pr-2">
                      <span
                        className="inline-block h-2 w-2 rounded-full align-middle mr-1"
                        style={{ backgroundColor: phaseToColor(row.phase) }}
                      />
                      {formatPhase(row.phase)}
                    </td>
                    <td className="py-1">{(row.prob * 100).toFixed(2)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-auto">
          <svg
            width="100%"
            height={140}
            viewBox={`0 0 ${amplitudes.length * 28 + 8} 140`}
            className="min-w-full"
          >
            {rows.map((row, i) => {
              const barH = (row.mag / maxMag) * 100;
              const x = 4 + i * 28;
              return (
                <g key={row.label}>
                  <rect
                    x={x}
                    y={120 - barH}
                    width={22}
                    height={barH}
                    fill={phaseToColor(row.phase)}
                    opacity={row.mag > 0.001 ? 0.9 : 0.15}
                    rx={1}
                  />
                  <text
                    x={x + 11}
                    y={132}
                    textAnchor="middle"
                    fill="var(--color-muted-foreground)"
                    fontSize={7}
                    fontFamily="monospace"
                  >
                    {row.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      )}

      <p className="mt-0.5 shrink-0 truncate text-[10px] text-[var(--color-muted-foreground)]">
        {visibleRows.length} non-zero amplitudes · Σ|ψ|² ={" "}
        {rows.reduce((s, r) => s + r.prob, 0).toFixed(4)}
      </p>
    </div>
  );
}
