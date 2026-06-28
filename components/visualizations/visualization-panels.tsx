"use client";

import { useEffect, useMemo, useState } from "react";
import type { Circuit } from "@/lib/circuit-schema";
import { simulateCircuit } from "@/lib/quantum-state";
import type { QuantumStateResult } from "@/lib/quantum-state";
import { getOperationsUpToStep } from "@/lib/circuit-layout";
import { useEditorUiStore } from "@/store/editor-ui-store";
import { useExecutionStore } from "@/store/execution-store";
import { COMPACT_VIEWPORT_QUERY, useMediaQuery } from "@/lib/use-media-query";
import { ProbabilityChart } from "./probability-chart";
import { QSphere } from "./q-sphere";
import { StatevectorChart } from "./statevector-chart";
import { MeasurementHistogram } from "./measurement-histogram";
import { cn } from "@/lib/utils";

interface VisualizationPanelsProps {
  circuit: Circuit;
}

type VizPanelId = "probabilities" | "qsphere" | "statevector" | "histogram";

const PANEL_LABELS: Record<VizPanelId, string> = {
  probabilities: "Probabilities",
  qsphere: "Q-sphere",
  statevector: "Statevector",
  histogram: "Measurements",
};

function PanelBody({
  panelId,
  result,
  lastResult,
}: {
  panelId: VizPanelId;
  result: QuantumStateResult;
  lastResult: ReturnType<typeof useExecutionStore.getState>["lastResult"];
}) {
  switch (panelId) {
    case "probabilities":
      return (
        <>
          <p className="mb-1 shrink-0 text-[10px] leading-tight text-[var(--color-muted-foreground)]">
            Ideal |ψ|² (live, ignores measurements)
          </p>
          <div className="min-h-0 flex-1">
            <ProbabilityChart
              probabilities={result.probabilities}
              numQubits={result.numQubits}
              error={result.error}
            />
          </div>
        </>
      );
    case "qsphere":
      return (
        <div className="min-h-0 flex-1">
          <QSphere
            points={result.qSpherePoints}
            numQubits={result.numQubits}
            blochVector={result.blochVector}
            error={result.error}
          />
        </div>
      );
    case "statevector":
      return (
        <div className="min-h-0 flex-1">
          <StatevectorChart
            amplitudes={result.amplitudes}
            numQubits={result.numQubits}
            error={result.error}
          />
        </div>
      );
    case "histogram":
      return (
        <>
          <p className="mb-1 shrink-0 text-[10px] leading-tight text-[var(--color-muted-foreground)]">
            Shot counts from Run circuit
          </p>
          <div className="min-h-0 flex-1">
            <MeasurementHistogram
              histogram={lastResult?.histogram ?? []}
              shots={lastResult?.shots ?? 0}
              registerLabel={lastResult?.registerLabel}
              error={lastResult?.error}
              emptyMessage="Click Run circuit to simulate measurement shots"
            />
          </div>
        </>
      );
  }
}

export function VisualizationPanels({ circuit }: VisualizationPanelsProps) {
  const { vizPanels, inspectMode, inspectStep } = useEditorUiStore();
  const lastResult = useExecutionStore((s) => s.lastResult);
  const isCompact = useMediaQuery(COMPACT_VIEWPORT_QUERY);

  const effectiveCircuit = useMemo(() => {
    if (!inspectMode) return circuit;
    if (inspectStep === 0) {
      return { ...circuit, operations: [] };
    }
    return {
      ...circuit,
      operations: getOperationsUpToStep(circuit.operations, inspectStep),
    };
  }, [circuit, inspectMode, inspectStep]);

  const result = useMemo(
    () => simulateCircuit(effectiveCircuit),
    [effectiveCircuit]
  );

  const activePanels = useMemo(
    () =>
      (
        [
          vizPanels.probabilities && "probabilities",
          vizPanels.qsphere && "qsphere",
          vizPanels.statevector && "statevector",
          vizPanels.histogram && "histogram",
        ] as const
      ).filter(Boolean) as VizPanelId[],
    [vizPanels]
  );

  const [activeTab, setActiveTab] = useState<VizPanelId>("probabilities");

  useEffect(() => {
    if (activePanels.length === 0) return;
    if (!activePanels.includes(activeTab)) {
      setActiveTab(activePanels[0]);
    }
  }, [activePanels, activeTab]);

  if (activePanels.length === 0) {
    return (
      <div className="flex h-full items-center justify-center bg-[var(--color-background)] px-4 text-center text-xs text-[var(--color-muted-foreground)]">
        Enable visualizations from View → Panels
      </div>
    );
  }

  if (isCompact && activePanels.length > 1) {
    return (
      <div className="flex h-full min-h-0 flex-col bg-[var(--color-background)]">
        <div
          className="flex shrink-0 gap-1 overflow-x-auto border-b border-[var(--color-border)] p-1.5"
          role="tablist"
          aria-label="Visualization panels"
        >
          {activePanels.map((panelId) => (
            <button
              key={panelId}
              type="button"
              role="tab"
              aria-selected={activeTab === panelId}
              className={cn(
                "touch-target-sm shrink-0 rounded-md px-3 text-xs font-medium transition-colors",
                activeTab === panelId
                  ? "bg-[var(--color-brand-subtle)] text-[var(--color-brand)]"
                  : "text-[var(--color-muted-foreground)] hover:bg-[var(--color-brand-hover)] hover:text-[var(--color-brand)]"
              )}
              onClick={() => setActiveTab(panelId)}
            >
              {PANEL_LABELS[panelId]}
            </button>
          ))}
        </div>
        <div
          className="flex min-h-0 flex-1 flex-col overflow-hidden p-2 sm:p-3"
          role="tabpanel"
          aria-label={PANEL_LABELS[activeTab]}
        >
          <h3 className="mb-1 shrink-0 text-xs font-semibold text-[var(--color-foreground)]">
            {PANEL_LABELS[activeTab]}
          </h3>
          <PanelBody panelId={activeTab} result={result} lastResult={lastResult} />
        </div>
      </div>
    );
  }

  const gridCols =
    activePanels.length === 1
      ? "grid-cols-1"
      : activePanels.length === 2
        ? "grid-cols-1 sm:grid-cols-2"
        : activePanels.length === 3
          ? "grid-cols-1 md:grid-cols-3"
          : "grid-cols-1 sm:grid-cols-2 min-[1400px]:grid-cols-4";

  return (
    <div
      className={cn(
        "grid h-full divide-x divide-[var(--color-border)] border-[var(--color-border)] bg-[var(--color-background)]",
        gridCols
      )}
    >
      {vizPanels.probabilities && (
        <div className="flex min-h-[140px] flex-col overflow-hidden p-2 sm:p-3">
          <h3 className="mb-1 shrink-0 text-xs font-semibold text-[var(--color-foreground)]">
            Probabilities
          </h3>
          <PanelBody panelId="probabilities" result={result} lastResult={lastResult} />
        </div>
      )}
      {vizPanels.qsphere && (
        <div className="flex min-h-[140px] flex-col overflow-hidden p-2 sm:p-3">
          <h3 className="mb-1 shrink-0 text-xs font-semibold text-[var(--color-foreground)]">
            Q-sphere
          </h3>
          <PanelBody panelId="qsphere" result={result} lastResult={lastResult} />
        </div>
      )}
      {vizPanels.statevector && (
        <div className="flex min-h-[140px] flex-col overflow-hidden p-2 sm:p-3">
          <h3 className="mb-1 shrink-0 text-xs font-semibold text-[var(--color-foreground)]">
            Statevector
          </h3>
          <PanelBody panelId="statevector" result={result} lastResult={lastResult} />
        </div>
      )}
      {vizPanels.histogram && (
        <div className="flex min-h-[140px] flex-col overflow-hidden p-2 sm:p-3">
          <h3 className="mb-1 shrink-0 text-xs font-semibold text-[var(--color-foreground)]">
            Measurement results
          </h3>
          <PanelBody panelId="histogram" result={result} lastResult={lastResult} />
        </div>
      )}
    </div>
  );
}
