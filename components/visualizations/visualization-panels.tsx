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
    <div className="grid h-full grid-cols-1 divide-x divide-[var(--color-border)] border-[var(--color-border)] bg-[var(--color-background)] md:grid-cols-2">
      <div className="flex flex-col overflow-hidden p-3">
        <h3 className="mb-2 shrink-0 text-xs font-semibold text-[var(--color-foreground)]">
          Probabilities
        </h3>
        <div className="min-h-0 flex-1">
          <ProbabilityChart
            probabilities={result.probabilities}
            numQubits={result.numQubits}
            error={result.error}
          />
        </div>
      </div>
      <div className="flex flex-col overflow-hidden p-3">
        <h3 className="mb-2 shrink-0 text-xs font-semibold text-[var(--color-foreground)]">
          Q-sphere
        </h3>
        <div className="min-h-0 flex-1">
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
