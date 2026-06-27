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

  if (numQubits === 1 && q === 0) {
    return { amplitude: amplitudes[1] ?? null, purity: 1 };
  }

  let p0 = 0;
  let p1 = 0;
  let amp1: Complex = { re: 0, im: 0 };

  for (let i = 0; i < amplitudes.length; i++) {
    const bit = (i >> (numQubits - 1 - q)) & 1;
    const prob = cAbs2(amplitudes[i]);
    if (bit === 0) {
      p0 += prob;
    } else {
      p1 += prob;
      amp1 = {
        re: amp1.re + amplitudes[i].re,
        im: amp1.im + amplitudes[i].im,
      };
    }
  }

  const norm1 = Math.sqrt(p1) || 1;
  const beta = { re: amp1.re / norm1, im: amp1.im / norm1 };

  if (p1 <= 0.001) {
    return { amplitude: { re: 0, im: 0 }, purity: 0.5 + p0 * 0.5 };
  }

  return { amplitude: beta, purity: 0.5 + p0 * 0.5 };
}

export function QubitPhaseDisks({
  amplitudes,
  numQubits,
}: {
  amplitudes: Complex[];
  numQubits: number;
}) {
  if (numQubits === 0 || amplitudes.length === 0) return null;

  const disks = Array.from({ length: numQubits }, (_, q) => {
    if (numQubits === 1) {
      return { alpha: amplitudes[0], beta: amplitudes[1] ?? { re: 0, im: 0 } };
    }

    let p0 = 0;
    let p1 = 0;
    let amp0: Complex = { re: 0, im: 0 };
    let amp1: Complex = { re: 0, im: 0 };

    const dim = amplitudes.length;
    for (let i = 0; i < dim; i++) {
      const bit = (i >> (numQubits - 1 - q)) & 1;
      const prob = amplitudes[i].re ** 2 + amplitudes[i].im ** 2;
      if (bit === 0) {
        p0 += prob;
        amp0 = {
          re: amp0.re + amplitudes[i].re,
          im: amp0.im + amplitudes[i].im,
        };
      } else {
        p1 += prob;
        amp1 = {
          re: amp1.re + amplitudes[i].re,
          im: amp1.im + amplitudes[i].im,
        };
      }
    }

    const norm0 = Math.sqrt(p0) || 1;
    const norm1 = Math.sqrt(p1) || 1;
    return {
      alpha: { re: amp0.re / norm0, im: amp0.im / norm0 },
      beta: { re: amp1.re / norm1, im: amp1.im / norm1 },
      purity: numQubits === 1 ? 1 : 0.5 + p0 * 0.5,
    };
  });

  return (
    <>
      {disks.map((disk, q) => {
        const p = disk.beta.re ** 2 + disk.beta.im ** 2;
        const effectiveAmp = {
          re: Math.sqrt(1 - p),
          im: 0,
        };
        const displayAmp =
          p > 0.001
            ? {
                re: disk.beta.re,
                im: disk.beta.im,
              }
            : effectiveAmp;

        return (
          <PhaseDisk
            key={q}
            amplitude={displayAmp}
            purity={"purity" in disk ? (disk.purity as number) : 1}
            size={20}
            title={`q[${q}] local state`}
          />
        );
      })}
    </>
  );
}
