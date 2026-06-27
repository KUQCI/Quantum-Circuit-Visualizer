"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ComposerToolbar } from "@/components/layout/composer-toolbar";
import { ComposerFooter } from "@/components/layout/composer-footer";
import { GateLibrary } from "@/components/gates/gate-library";
import { CircuitCanvas } from "@/components/circuit/circuit-canvas";
import { MultiLanguageCodePanel } from "@/components/code/multi-language-code-panel";
import { VisualizationPanels } from "@/components/visualizations/visualization-panels";
import { useCircuitStore } from "@/store/circuit-store";
import { useEditorUiStore } from "@/store/editor-ui-store";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { cn } from "@/lib/utils";

export function ComposerEditorLayout() {
  const circuit = useCircuitStore((s) => s.circuit);
  const [draggingGate, setDraggingGate] = useState<string | null>(null);
  const {
    showCodePanel,
    showVizPanels,
    operationsPanelCollapsed,
    setOperationsPanelCollapsed,
  } = useEditorUiStore();

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[var(--color-background)]">
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-[rgba(125,211,252,0.16)] bg-[rgba(5,9,20,0.85)] px-4 backdrop-blur-sm">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-sm font-semibold text-[var(--color-foreground)] transition-colors hover:text-[var(--color-cyan-quantum)]"
        >
          <Image
            src="https://kuqci.github.io/logo.png"
            alt="KUQCI"
            width={22}
            height={22}
            className="rounded"
            unoptimized
          />
          <span>
            Circuit <span className="text-[var(--color-cyan-quantum)]">Visualizer</span>
          </span>
        </Link>
        <span className="text-xs text-[var(--color-muted-foreground)]">
          Quantum Circuit Composer
        </span>
      </header>

      <ComposerToolbar />

      <div className="flex min-h-0 flex-1 overflow-hidden">
        {!operationsPanelCollapsed && (
          <aside className="composer-panel w-[220px] shrink-0 overflow-hidden border-r xl:w-[240px]">
            <GateLibrary
              onDragStart={setDraggingGate}
              onDragEnd={() => setDraggingGate(null)}
            />
          </aside>
        )}

        <button
          type="button"
          className="flex w-5 shrink-0 items-center justify-center border-r border-[rgba(125,211,252,0.16)] bg-[var(--color-toolbar)] text-[var(--color-muted-foreground)] hover:bg-[rgba(125,211,252,0.08)] hover:text-[var(--color-cyan-quantum)]"
          onClick={() => setOperationsPanelCollapsed(!operationsPanelCollapsed)}
          title={
            operationsPanelCollapsed
              ? "Expand operations catalog"
              : "Collapse operations catalog"
          }
        >
          {operationsPanelCollapsed ? (
            <PanelLeftOpen className="h-3.5 w-3.5" />
          ) : (
            <PanelLeftClose className="h-3.5 w-3.5" />
          )}
        </button>

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-[var(--color-canvas)]">
          <div
            className={cn(
              "min-h-0 overflow-hidden",
              showVizPanels ? "flex-[3]" : "flex-1"
            )}
          >
            <CircuitCanvas
              draggingGate={draggingGate}
              onDragEnd={() => setDraggingGate(null)}
            />
          </div>
          {showVizPanels && (
            <div className="min-h-[200px] flex-[2] shrink-0 overflow-hidden border-t border-[rgba(125,211,252,0.16)]">
              <VisualizationPanels circuit={circuit} />
            </div>
          )}
        </div>

        {showCodePanel && (
          <aside className="composer-panel w-[280px] shrink-0 overflow-hidden border-l xl:w-[320px]">
            <MultiLanguageCodePanel />
          </aside>
        )}
      </div>

      <ComposerFooter />
    </div>
  );
}
