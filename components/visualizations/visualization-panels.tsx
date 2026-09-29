"use client";

import { useEffect, useMemo, useState } from "react";
import type { Circuit } from "@/lib/circuit-schema";
import { simulateCircuit } from "@/lib/quantum-state";
import type { QuantumStateResult } from "@/lib/quantum-state";
import { getOperationsUpToStep } from "@/lib/circuit-layout";
import {
  canSplitVizPanels,
  gridClassForCount,
  resolveVizMode,
  type LayoutTier,
} from "@/lib/composer-layout";
import { useElementSize } from "@/lib/use-element-size";
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
import { ChevronDown, ChevronRight, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  histogram: "Measurement Results",
};

const PANEL_IDS: VizPanelId[] = [
  "probabilities",
  "qsphere",
  "statevector",
  "histogram",
];

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
          <div className="min-h-[132px] flex-1">
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
        <div className="min-h-[132px] flex-1">
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
        <div className="min-h-[132px] flex-1">
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
          <div className="min-h-[132px] flex-1">
            <MeasurementHistogram
              histogram={lastResult?.histogram ?? []}
              shots={lastResult?.shots ?? 0}
              registerLabel={lastResult?.registerLabel}
              error={lastResult?.error}
              noise={lastResult?.noise}
              emptyMessage="Run circuit to see results."
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
  collapsed,
  onToggle,
}: {
  panelId: VizPanelId;
  result: QuantumStateResult;
  lastResult: ReturnType<typeof useExecutionStore.getState>["lastResult"];
  collapsed?: boolean;
  onToggle?: () => void;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[var(--color-background)]">
      <div className="flex h-7 shrink-0 items-center gap-1 border-b border-[var(--color-border)] px-2">
        {onToggle && (
          <button
            type="button"
            className="composer-toolbar-btn flex h-5 w-5 items-center justify-center rounded"
            onClick={onToggle}
            aria-expanded={!collapsed}
            aria-label={collapsed ? `Expand ${PANEL_LABELS[panelId]}` : `Collapse ${PANEL_LABELS[panelId]}`}
            title={collapsed ? "Expand" : "Collapse"}
          >
            {collapsed ? (
              <ChevronRight className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </button>
        )}
        <h3 className="truncate text-xs font-semibold text-[var(--color-foreground)]">
          {PANEL_LABELS[panelId]}
        </h3>
      </div>
      {!collapsed && (
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden p-2 sm:p-3">
          <PanelBody panelId={panelId} result={result} lastResult={lastResult} />
        </div>
      )}
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
  const setVizPanel = useEditorUiStore((s) => s.setVizPanel);
  const defaultSize = Math.floor(100 / activePanels.length);

  return (
    <PanelGroup
      key={`viz-${layoutResetKey}-${activePanels.join("-")}`}
      direction="horizontal"
      autoSaveId="qci-composer-viz"
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
            <VizPanelShell
              panelId={panelId}
              result={result}
              lastResult={lastResult}
              onToggle={() => setVizPanel(panelId, false)}
            />
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

function VizLayoutControl({
  vizLayout,
  onChange,
}: {
  vizLayout: "tabs" | "split";
  onChange: (layout: "tabs" | "split") => void;
}) {
  return (
    <div
      className="inline-flex shrink-0 rounded-md border border-[var(--color-border)] p-0.5"
      role="radiogroup"
      aria-label="Results layout"
    >
      {(
        [
          ["tabs", "Tabs", "Show one panel at a time"],
          ["split", "Multi", "Show all panels side by side"],
        ] as const
      ).map(([layout, label, title]) => (
        <button
          key={layout}
          type="button"
          role="radio"
          aria-checked={vizLayout === layout}
          className={cn(
            "rounded px-2 py-0.5 text-[10px] font-medium",
            vizLayout === layout
              ? "bg-[var(--color-brand-subtle)] text-[var(--color-brand)]"
              : "text-[var(--color-muted-foreground)] hover:bg-[var(--color-secondary)] hover:text-[var(--color-foreground)]"
          )}
          title={title}
          onClick={() => onChange(layout)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function PanelPicker({
  vizPanels,
  setVizPanel,
}: {
  vizPanels: Record<VizPanelId, boolean>;
  setVizPanel: (panel: VizPanelId, show: boolean) => void;
}) {
  const visibleCount = PANEL_IDS.filter((panelId) => vizPanels[panelId]).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex h-6 shrink-0 items-center gap-1 rounded px-2 text-[10px] font-medium text-[var(--color-muted-foreground)] hover:bg-[var(--color-secondary)] hover:text-[var(--color-foreground)]"
          aria-label="Choose result panels"
          title="Choose result panels"
        >
          <SlidersHorizontal className="h-3 w-3" />
          <span>Panels</span>
          <span className="rounded bg-[var(--color-secondary)] px-1 text-[9px]">
            {visibleCount}/4
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[12rem]">
        <div className="px-2 py-1 text-[10px] font-semibold text-[var(--color-muted-foreground)]">
          Show panels
        </div>
        {PANEL_IDS.map((panelId) => {
          const checked = vizPanels[panelId];
          const keepOneVisible = checked && visibleCount === 1;
          return (
            <DropdownMenuCheckboxItem
              key={panelId}
              checked={checked}
              disabled={keepOneVisible}
              title={keepOneVisible ? "Keep at least one panel" : undefined}
              onCheckedChange={(nextChecked) => {
                if (typeof nextChecked === "boolean") {
                  setVizPanel(panelId, nextChecked);
                }
              }}
            >
              {PANEL_LABELS[panelId]}
            </DropdownMenuCheckboxItem>
          );
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => {
            PANEL_IDS.forEach((panelId) => setVizPanel(panelId, true));
          }}
        >
          Show all
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function VisualizationPanels({
  circuit,
  useVizTabs = false,
  layoutTier = "desktop",
  resizable = false,
  layoutResetKey = 0,
}: VisualizationPanelsProps) {
  const {
    vizPanels,
    inspectMode,
    inspectStep,
    setVizPanel,
    setVizLayout,
    vizLayout,
  } = useEditorUiStore();
  const lastResult = useExecutionStore((s) => s.lastResult);
  const { ref: rootRef, size: rootSize } = useElementSize<HTMLDivElement>();

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

  const splitFits = canSplitVizPanels(rootSize.width, activePanels.length);
  const mode = resolveVizMode({
    forceTabs: useVizTabs,
    vizLayout,
    tier: layoutTier,
    fits: splitFits,
    resizable,
    panelCount: activePanels.length,
  });

  if (activePanels.length === 0) {
    return (
      <div ref={rootRef} className="flex h-full flex-col items-center justify-center gap-2 bg-[var(--color-background)] px-4 text-center text-xs text-[var(--color-muted-foreground)]">
        <p>All result panels are collapsed.</p>
        <div className="flex items-center gap-2">
          <PanelPicker vizPanels={vizPanels} setVizPanel={setVizPanel} />
          <button
            type="button"
            className="text-[var(--color-brand)] hover:underline"
            onClick={() => {
              PANEL_IDS.forEach((panelId) => setVizPanel(panelId, true));
            }}
          >
            Restore result panels
          </button>
        </div>
      </div>
    );
  }

  if (mode === "tabs") {
    return (
      <div ref={rootRef} className="flex h-full min-h-0 flex-col bg-[var(--color-background)]">
        <div
          className="flex shrink-0 items-center gap-1 overflow-x-auto border-b border-[var(--color-border)] p-1.5"
        >
          <div
            className="flex min-w-0 flex-1 gap-1 overflow-x-auto"
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
          <PanelPicker vizPanels={vizPanels} setVizPanel={setVizPanel} />
          {layoutTier !== "mobile" && (
            <VizLayoutControl vizLayout={vizLayout} onChange={setVizLayout} />
          )}
        </div>
        <div
          className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden p-2 sm:p-3"
          role="tabpanel"
          aria-label={PANEL_LABELS[activeTab]}
        >
          <p className="sr-only">
            {PANEL_LABELS[activeTab]}
          </p>
          <PanelBody panelId={activeTab} result={result} lastResult={lastResult} />
        </div>
      </div>
    );
  }

  if (mode === "row" || mode === "grid") {
    return (
      <div ref={rootRef} className="flex h-full min-h-0 flex-col bg-[var(--color-background)]">
        <div className="flex h-7 shrink-0 items-center justify-between border-b border-[var(--color-border)] px-2">
          <div className="flex min-w-0 items-baseline gap-1.5">
            <h3 className="truncate text-xs font-semibold text-[var(--color-foreground)]">
              Multi view
            </h3>
            <span className="shrink-0 text-[10px] text-[var(--color-muted-foreground)]">
              {activePanels.length} of 4 panels
            </span>
          </div>
          <div className="flex items-center gap-1">
            <PanelPicker vizPanels={vizPanels} setVizPanel={setVizPanel} />
            <VizLayoutControl vizLayout={vizLayout} onChange={setVizLayout} />
          </div>
        </div>
        <div className="min-h-0 flex-1">
          {mode === "row" ? (
            <ResizableVizRow
              activePanels={activePanels}
              result={result}
              lastResult={lastResult}
              layoutResetKey={layoutResetKey}
            />
          ) : (
            <div
              className={cn(
                "grid h-full divide-x divide-y divide-[var(--color-border)] overflow-y-auto",
                gridClassForCount(activePanels.length)
              )}
            >
              {activePanels.map((panelId, index) => (
                <div
                  key={panelId}
                  className={cn(
                    "h-full min-h-[180px]",
                    activePanels.length === 3 &&
                      index === activePanels.length - 1 &&
                      "col-span-2"
                  )}
                >
                  <VizPanelShell
                    panelId={panelId}
                    result={result}
                    lastResult={lastResult}
                    onToggle={() => setVizPanel(panelId, false)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  const singlePanel = activePanels[0];

  return (
    <div ref={rootRef} className="flex h-full min-h-0 flex-col bg-[var(--color-background)]">
      <div className="flex h-7 shrink-0 items-center justify-between border-b border-[var(--color-border)] px-2">
        <h3 className="truncate text-xs font-semibold text-[var(--color-foreground)]">
          {PANEL_LABELS[singlePanel]}
        </h3>
        <div className="flex items-center gap-1">
          <PanelPicker vizPanels={vizPanels} setVizPanel={setVizPanel} />
          {layoutTier !== "mobile" && (
            <VizLayoutControl vizLayout={vizLayout} onChange={setVizLayout} />
          )}
        </div>
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden p-2 sm:p-3">
        <PanelBody panelId={singlePanel} result={result} lastResult={lastResult} />
      </div>
    </div>
  );
}
