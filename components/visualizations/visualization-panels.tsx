"use client";

import { useEffect, useMemo, useState } from "react";
import type { Circuit } from "@/lib/circuit-schema";
import { simulateCircuit } from "@/lib/quantum-state";
import type { QuantumStateResult } from "@/lib/quantum-state";
import { getOperationsUpToStep } from "@/lib/circuit-layout";
import type { LayoutTier } from "@/lib/composer-layout";
import { useEditorUiStore } from "@/store/editor-ui-store";
import { useExecutionStore } from "@/store/execution-store";
import { ProbabilityChart } from "./probability-chart";
import { QSphere } from "./q-sphere";
import { StatevectorChart } from "./statevector-chart";
import { MeasurementHistogram } from "./measurement-histogram";
import {
  Panel,
  PanelGroup,
  PanelResizeHandle,
} from "react-resizable-panels";
import { cn } from "@/lib/utils";

interface VisualizationPanelsProps {
  circuit: Circuit;
  useVizTabs?: boolean;
  layoutTier?: LayoutTier;
  resizable?: boolean;
  layoutResetKey?: number;
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

function VizPanelShell({
  panelId,
  result,
  lastResult,
}: {
  panelId: VizPanelId;
  result: QuantumStateResult;
  lastResult: ReturnType<typeof useExecutionStore.getState>["lastResult"];
}) {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[var(--color-background)] p-2 sm:p-3">
      <h3 className="mb-1 shrink-0 text-xs font-semibold text-[var(--color-foreground)]">
        {PANEL_LABELS[panelId]}
      </h3>
      <PanelBody panelId={panelId} result={result} lastResult={lastResult} />
    </div>
  );
}

function ResizableVizRow({
  activePanels,
  result,
  lastResult,
  layoutResetKey,
}: {
  activePanels: VizPanelId[];
  result: QuantumStateResult;
  lastResult: ReturnType<typeof useExecutionStore.getState>["lastResult"];
  layoutResetKey: number;
}) {
  const defaultSize = Math.floor(100 / activePanels.length);

  return (
    <PanelGroup
      key={`viz-${layoutResetKey}-${activePanels.join("-")}`}
      direction="horizontal"
      autoSaveId="react-resizable-panels:qci-composer-viz"
      className="h-full min-h-0 divide-x divide-[var(--color-border)]"
    >
      {activePanels.flatMap((panelId, index) => {
        const nodes = [
          <Panel
            key={panelId}
            id={`viz-${panelId}`}
            order={index}
            defaultSize={defaultSize}
            minSize={12}
          >
            <VizPanelShell panelId={panelId} result={result} lastResult={lastResult} />
          </Panel>,
        ];
        if (index < activePanels.length - 1) {
          nodes.push(
            <PanelResizeHandle
              key={`handle-${panelId}`}
              className="composer-resize-handle composer-resize-handle--horizontal"
            />
          );
        }
        return nodes;
      })}
    </PanelGroup>
  );
}

export function VisualizationPanels({
  circuit,
  useVizTabs = false,
  layoutTier = "desktop",
  resizable = false,
  layoutResetKey = 0,
}: VisualizationPanelsProps) {
  const { vizPanels, inspectMode, inspectStep } = useEditorUiStore();
  const lastResult = useExecutionStore((s) => s.lastResult);

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

  if (useVizTabs && activePanels.length > 1) {
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

  if (resizable && activePanels.length > 1) {
    return (
      <ResizableVizRow
        activePanels={activePanels}
        result={result}
        lastResult={lastResult}
        layoutResetKey={layoutResetKey}
      />
    );
  }

  const gridCols =
    activePanels.length === 1
      ? "grid-cols-1"
      : activePanels.length === 2
        ? "grid-cols-2"
        : activePanels.length === 3
          ? "grid-cols-3"
          : layoutTier === "desktop"
            ? "grid-cols-4"
            : "grid-cols-2";

  return (
    <div
      className={cn(
        "grid h-full divide-x divide-[var(--color-border)] border-[var(--color-border)] bg-[var(--color-background)]",
        gridCols
      )}
    >
      {vizPanels.probabilities && (
        <VizPanelShell
          panelId="probabilities"
          result={result}
          lastResult={lastResult}
        />
      )}
      {vizPanels.qsphere && (
        <VizPanelShell panelId="qsphere" result={result} lastResult={lastResult} />
      )}
      {vizPanels.statevector && (
        <VizPanelShell
          panelId="statevector"
          result={result}
          lastResult={lastResult}
        />
      )}
      {vizPanels.histogram && (
        <VizPanelShell panelId="histogram" result={result} lastResult={lastResult} />
      )}
    </div>
  );
}
