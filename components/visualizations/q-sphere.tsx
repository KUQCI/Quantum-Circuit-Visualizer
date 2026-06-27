"use client";

import dynamic from "next/dynamic";
import type { QSpherePoint } from "@/lib/quantum-state";

const QSphere3D = dynamic(
  () =>
    import("./q-sphere-3d").then((mod) => ({ default: mod.QSphere3D })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center text-xs text-[var(--color-muted-foreground)]">
        Loading 3D view...
      </div>
    ),
  }
);

interface QSphereProps {
  points: QSpherePoint[];
  numQubits: number;
  blochVector: { x: number; y: number; z: number } | null;
  error?: string | null;
}

export function QSphere({
  points,
  numQubits,
  blochVector,
  error,
}: QSphereProps) {
  if (error) {
    return (
      <div className="flex h-full items-center justify-center px-4 text-center text-xs text-[var(--color-muted-foreground)]">
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
    <div className="flex h-full w-full flex-col">
      <div className="relative min-h-[180px] flex-1">
        <QSphere3D
          points={points}
          blochVector={blochVector}
          numQubits={numQubits}
        />
      </div>
      <div className="mt-1 flex items-center justify-center gap-3 px-2">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-[var(--color-muted-foreground)]">
            Phase
          </span>
          <div
            className="h-2 w-14 rounded-full"
            style={{
              background:
                "linear-gradient(to right, hsl(0,75%,55%), hsl(120,75%,55%), hsl(240,75%,55%), hsl(360,75%,55%))",
            }}
          />
        </div>
        <span className="text-[10px] text-[var(--color-muted-foreground)]">
          Drag to rotate
        </span>
      </div>
    </div>
  );
}
