"use client";

import { useMemo } from "react";
import type { Circuit } from "@/lib/circuit-schema";
import { simulateCircuit } from "@/lib/quantum-state";
import { getOperationsUpToStep } from "@/lib/circuit-layout";
import { useEditorUiStore } from "@/store/editor-ui-store";
import { ProbabilityChart } from "./probability-chart";
import { QSphere } from "./q-sphere";
import { StatevectorChart } from "./statevector-chart";
import { cn } from "@/lib/utils";

interface VisualizationPanelsProps {
  circuit: Circuit;
}

export function VisualizationPanels({ circuit }: VisualizationPanelsProps) {
  const { vizPanels, inspectMode, inspectStep } = useEditorUiStore();

  const effectiveCircuit = useMemo(() => {
    if (!inspectMode || inspectStep === 0) return circuit;
    return {
      ...circuit,
      operations: getOperationsUpToStep(circuit.operations, inspectStep),
    };
  }, [circuit, inspectMode, inspectStep]);

  const result = useMemo(
    () => simulateCircuit(effectiveCircuit),
    [effectiveCircuit]
  );

  const activePanels = [
    vizPanels.probabilities && "probabilities",
    vizPanels.qsphere && "qsphere",
    vizPanels.statevector && "statevector",
  ].filter(Boolean);

  if (activePanels.length === 0) {
    return (
      <div className="flex h-full items-center justify-center bg-[var(--color-background)] text-xs text-[var(--color-muted-foreground)]">
        Enable visualizations from View → Panels
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grid h-full divide-x divide-[var(--color-border)] border-[var(--color-border)] bg-[var(--color-background)]",
        activePanels.length === 1 && "grid-cols-1",
        activePanels.length === 2 && "grid-cols-1 md:grid-cols-2",
        activePanels.length === 3 && "grid-cols-1 md:grid-cols-3"
      )}
    >
      {vizPanels.probabilities && (
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
      )}
      {vizPanels.qsphere && (
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
      )}
      {vizPanels.statevector && (
        <div className="flex flex-col overflow-hidden p-3">
          <h3 className="mb-2 shrink-0 text-xs font-semibold text-[var(--color-foreground)]">
            Statevector
          </h3>
          <div className="min-h-0 flex-1">
            <StatevectorChart
              amplitudes={result.amplitudes}
              numQubits={result.numQubits}
              error={result.error}
            />
          </div>
        </div>
      )}
    </div>
  );
}
