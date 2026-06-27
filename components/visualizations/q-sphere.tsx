"use client";

import { useMemo, useState } from "react";
import type { QSpherePoint } from "@/lib/quantum-state";
import { phaseToColor } from "@/lib/quantum-state";

interface QSphereProps {
  points: QSpherePoint[];
  numQubits: number;
  blochVector: { x: number; y: number; z: number } | null;
  error?: string | null;
}

function project3D(
  x: number,
  y: number,
  z: number,
  rotY: number,
  cx: number,
  cy: number,
  scale: number
): { px: number; py: number; depth: number } {
  const cosR = Math.cos(rotY);
  const sinR = Math.sin(rotY);
  const xr = x * cosR + z * sinR;
  const zr = -x * sinR + z * cosR;
  const yr = y;
  return {
    px: cx + xr * scale,
    py: cy - yr * scale,
    depth: zr,
  };
}

export function QSphere({
  points,
  numQubits,
  blochVector,
  error,
}: QSphereProps) {
  const [rotation, setRotation] = useState(0.6);
  const size = 220;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 80;

  const wireframe = useMemo(() => {
    const circles: { rx: number; ry: number; opacity: number }[] = [];
    for (let lat = -60; lat <= 60; lat += 30) {
      const theta = (lat * Math.PI) / 180;
      circles.push({
        rx: radius * Math.cos(theta),
        ry: radius * Math.sin(theta) * 0.3 + 1,
        opacity: 0.2 + 0.15 * Math.abs(Math.cos(theta)),
      });
    }
    return circles;
  }, [radius]);

  const projectedPoints = useMemo(() => {
    if (numQubits === 1 && blochVector) {
      const { px, py } = project3D(
        blochVector.x,
        blochVector.y,
        blochVector.z,
        rotation,
        cx,
        cy,
        radius
      );
      return [
        {
          px,
          py,
          r: 10,
          color: "var(--color-viz-accent)",
          label: "|ψ⟩",
          prob: 1,
        },
      ];
    }

    return points
      .map((p) => {
        const scaled = {
          x: p.x * p.amplitude,
          y: p.y * p.amplitude,
          z: p.z * p.amplitude,
        };
        const { px, py, depth } = project3D(
          scaled.x,
          scaled.y,
          scaled.z,
          rotation,
          cx,
          cy,
          radius
        );
        return {
          px,
          py,
          depth,
          r: Math.max(4, p.probability * 18),
          color: phaseToColor(p.phase),
          label: p.label,
          prob: p.probability,
        };
      })
      .sort((a, b) => a.depth - b.depth);
  }, [points, numQubits, blochVector, rotation, cx, cy, radius]);

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
        Add qubits to see Q-sphere
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col items-center">
      <svg
        width={size}
        height={size}
        className="mx-auto"
        aria-label="Q-sphere visualization"
      >
        {/* Sphere wireframe ellipses */}
        {wireframe.map((c, i) => (
          <ellipse
            key={i}
            cx={cx}
            cy={cy}
            rx={c.rx}
            ry={c.ry}
            fill="none"
            stroke="var(--color-border)"
            strokeWidth={0.8}
            opacity={c.opacity}
          />
        ))}

        {/* Vertical axis */}
        <line
          x1={cx}
          y1={cy - radius}
          x2={cx}
          y2={cy + radius}
          stroke="var(--color-viz-accent)"
          strokeWidth={1}
          opacity={0.5}
        />

        {/* Equator */}
        <ellipse
          cx={cx}
          cy={cy}
          rx={radius}
          ry={radius * 0.3}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth={0.8}
          opacity={0.4}
        />

        {/* State points */}
        {projectedPoints.map((p, i) => (
          <g key={i}>
            <circle
              cx={p.px}
              cy={p.py}
              r={p.r}
              fill={p.color}
              fillOpacity={0.85}
              stroke="var(--color-foreground)"
              strokeWidth={0.5}
              strokeOpacity={0.3}
            />
            {p.r >= 6 && (
              <text
                x={p.px}
                y={p.py - p.r - 3}
                fill="var(--color-muted-foreground)"
                fontSize={8}
                textAnchor="middle"
                fontFamily="monospace"
              >
                |{p.label}⟩
              </text>
            )}
          </g>
        ))}

        {/* |0⟩ pole label */}
        <text
          x={cx}
          y={cy - radius - 6}
          fill="var(--color-muted-foreground)"
          fontSize={9}
          textAnchor="middle"
        >
          |0…0⟩
        </text>
      </svg>

      {/* Phase legend */}
      <div className="mt-1 flex items-center gap-2">
        <span className="text-[10px] text-[var(--color-muted-foreground)]">
          Phase
        </span>
        <div
          className="h-2 w-16 rounded-full"
          style={{
            background:
              "linear-gradient(to right, hsl(0,75%,55%), hsl(120,75%,55%), hsl(240,75%,55%), hsl(360,75%,55%))",
          }}
        />
      </div>

      <input
        type="range"
        min={0}
        max={6.28}
        step={0.05}
        value={rotation}
        onChange={(e) => setRotation(parseFloat(e.target.value))}
        className="mt-2 w-32 accent-[var(--color-viz-accent)]"
        aria-label="Rotate Q-sphere"
      />
    </div>
  );
}
