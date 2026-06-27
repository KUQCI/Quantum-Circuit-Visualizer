"use client";

import { useMemo } from "react";
import type { Circuit } from "@/lib/circuit-schema";
import { simulateCircuit } from "@/lib/quantum-state";
import { ProbabilityChart } from "./probability-chart";
import { QSphere } from "./q-sphere";

interface VisualizationPanelsProps {
  circuit: Circuit;
}

export function VisualizationPanels({ circuit }: VisualizationPanelsProps) {
  const result = useMemo(() => simulateCircuit(circuit), [circuit]);

  return (
    <div className="grid shrink-0 grid-cols-1 gap-3 border-t border-[var(--color-border)] bg-[var(--color-surface)] p-3 md:grid-cols-2">
      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-3">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
          Probabilities
        </h3>
        <div className="h-44">
          <ProbabilityChart
            probabilities={result.probabilities}
            numQubits={result.numQubits}
            error={result.error}
          />
        </div>
      </div>
      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-3">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
          Q-sphere
        </h3>
        <div className="flex h-52 items-stretch justify-center md:h-56">
          <QSphere
            points={result.qSpherePoints}
            numQubits={result.numQubits}
            blochVector={result.blochVector}
            error={result.error}
          />
        </div>
      </div>
    </div>
  );
}
