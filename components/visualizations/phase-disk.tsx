"use client";

import { phaseToColor } from "@/lib/quantum-state";
import type { Complex } from "@/lib/quantum-state";
import { cn } from "@/lib/utils";

interface PhaseDiskProps {
  amplitude: Complex | null;
  purity?: number;
  size?: number;
  title?: string;
  className?: string;
}

function cAbs2(a: Complex): number {
  return a.re * a.re + a.im * a.im;
}

export function PhaseDisk({
  amplitude,
  purity = 1,
  size = 20,
  title,
  className,
}: PhaseDiskProps) {
  if (!amplitude) {
    return (
      <div
        className={cn(
          "rounded-full border border-[var(--color-border)] bg-[var(--color-secondary)]/40",
          className
        )}
        style={{ width: size, height: size }}
        title={title}
      />
    );
  }

  const p = cAbs2(amplitude);
  const phase = Math.atan2(amplitude.im, amplitude.re);
  const ringRadius = size / 2;
  const innerRadius = ringRadius * (0.5 + purity * 0.5);
  const fillHeight = p * size;

  return (
    <div
      className={cn("relative shrink-0", className)}
      style={{ width: size, height: size }}
      title={
        title ??
        `P(|1⟩)=${(p * 100).toFixed(1)}%, φ=${((phase * 180) / Math.PI).toFixed(0)}°`
      }
    >
      <div
        className="absolute inset-0 rounded-full"
        style={{ backgroundColor: "var(--color-accent)", opacity: 0.5 }}
      />
      <div
        className="absolute bottom-0 left-0 right-0 overflow-hidden rounded-full"
        style={{ height: fillHeight, backgroundColor: "var(--color-primary)", opacity: 0.85 }}
      />
      <div
        className="absolute left-1/2 top-1/2 origin-bottom"
        style={{
          width: 1,
          height: innerRadius,
          marginLeft: -0.5,
          marginTop: -innerRadius,
          transform: `rotate(${(phase * 180) / Math.PI + 90}deg)`,
          backgroundColor: phaseToColor(phase),
        }}
      />
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[var(--color-foreground)]/30"
        style={{
          width: innerRadius * 2 * purity,
          height: innerRadius * 2 * purity,
        }}
      />
    </div>
  );
}

export function getMarginalDiskForQubit(
  amplitudes: Complex[],
  numQubits: number,
  q: number
): { amplitude: Complex | null; purity: number } {
  if (numQubits === 0 || amplitudes.length === 0) {
    return { amplitude: null, purity: 1 };
  }

  let p0 = 0;
  let p1 = 0;
  const rho01: Complex = { re: 0, im: 0 };
  const bitMask = 1 << (numQubits - 1 - q);

  for (let i = 0; i < amplitudes.length; i++) {
    const bit = (i & bitMask) === 0 ? 0 : 1;
    const prob = cAbs2(amplitudes[i]);
    if (bit === 0) {
      p0 += prob;
    } else {
      p1 += prob;
      const zero = amplitudes[i ^ bitMask];
      // rho01 = sum(other) a_0 * conjugate(a_1)
      rho01.re += zero.re * amplitudes[i].re + zero.im * amplitudes[i].im;
      rho01.im += zero.im * amplitudes[i].re - zero.re * amplitudes[i].im;
    }
  }

  const phase = -Math.atan2(rho01.im, rho01.re);
  const magnitude = Math.sqrt(Math.max(0, p1));
  const purity = p0 * p0 + p1 * p1 + 2 * cAbs2(rho01);
  return {
    amplitude: { re: magnitude * Math.cos(phase), im: magnitude * Math.sin(phase) },
    purity,
  };
}

function formatPhaseLabel(rad: number): string {
  const pi = Math.PI;
  const eps = 0.02;
  const ratios: [number, string][] = [
    [0, "0"],
    [pi / 4, "π/4"],
    [pi / 2, "π/2"],
    [3 * pi / 4, "3π/4"],
    [pi, "π"],
    [-pi / 4, "−π/4"],
    [-pi / 2, "−π/2"],
    [-3 * pi / 4, "−3π/4"],
    [-pi, "−π"],
  ];
  for (const [value, label] of ratios) {
    if (Math.abs(rad - value) < eps) return label;
  }
  return `${((rad * 180) / Math.PI).toFixed(1)}°`;
}

export function QubitStateTooltipContent({
  amplitude,
  purity,
  label,
}: {
  amplitude: Complex | null;
  purity: number;
  label: string;
}) {
  if (!amplitude) {
    return <p className="text-xs text-[var(--color-muted-foreground)]">No state data</p>;
  }

  const p1 = cAbs2(amplitude);
  const phase = Math.atan2(amplitude.im, amplitude.re);
  const cosPhi = Math.cos(phase);
  const sinPhi = Math.sin(phase);

  return (
    <div className="space-y-1 font-mono text-[11px]">
      <p className="font-sans font-medium text-[var(--color-foreground)]">{label}</p>
      <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-[var(--color-muted-foreground)]">
        <span>Phase φ</span>
        <span className="text-[var(--color-foreground)]">{formatPhaseLabel(phase)}</span>
        <span>Re[e^iφ]</span>
        <span className="text-[var(--color-foreground)]">{cosPhi.toFixed(12)}</span>
        <span>Im[e^iφ]</span>
        <span className="text-[var(--color-foreground)]">{sinPhi.toFixed(12)}</span>
        <span>Prob of |1⟩</span>
        <span className="text-[var(--color-foreground)]">{(p1 * 100).toFixed(0)}%</span>
        <span>Purity</span>
        <span className="text-[var(--color-foreground)]">{purity.toFixed(12)}</span>
      </div>
    </div>
  );
}

export function QubitPhaseDisks({
  amplitudes,
  numQubits,
}: {
  amplitudes: Complex[];
  numQubits: number;
}) {
  if (numQubits === 0 || amplitudes.length === 0) return null;

  const disks = Array.from({ length: numQubits }, (_, q) =>
    getMarginalDiskForQubit(amplitudes, numQubits, q)
  );

  return (
    <>
      {disks.map((disk, q) => {
        return (
          <PhaseDisk
            key={q}
            amplitude={disk.amplitude}
            purity={disk.purity}
            size={20}
            title={`q[${q}] local state`}
          />
        );
      })}
    </>
  );
}
