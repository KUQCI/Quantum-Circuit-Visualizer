"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ComposerToolbar } from "@/components/layout/composer-toolbar";
import { ComposerFooter } from "@/components/layout/composer-footer";
import { EditorBootstrap } from "@/components/layout/editor-bootstrap";
import { GateLibrary } from "@/components/gates/gate-library";
import { CircuitCanvas } from "@/components/circuit/circuit-canvas";
import { MultiLanguageCodePanel } from "@/components/code/multi-language-code-panel";
import { VisualizationPanels } from "@/components/visualizations/visualization-panels";
import { useCircuitStore } from "@/store/circuit-store";
import { useEditorUiStore } from "@/store/editor-ui-store";
import { PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function ComposerEditorLayout() {
  const circuit = useCircuitStore((s) => s.circuit);
  const [draggingGate, setDraggingGate] = useState<string | null>(null);
  const {
    showCodePanel,
    showVizPanels,
    operationsPanelCollapsed,
    setOperationsPanelCollapsed,
    setShowCodePanel,
  } = useEditorUiStore();

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-[var(--color-background)]">
      <Suspense fallback={null}>
        <EditorBootstrap />
      </Suspense>

      <header className="glass-nav-compact flex h-10 shrink-0 items-center justify-between px-3 sm:px-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-semibold text-[var(--color-foreground)] transition-colors hover:text-[var(--color-brand)]"
        >
          <Image
            src="https://kuqci.github.io/logo.png"
            alt="KUQCI"
            width={20}
            height={20}
            className="rounded"
            unoptimized
          />
          <span>
            Circuit{" "}
            <span className="text-[var(--color-brand)]">Visualizer</span>
          </span>
        </Link>
        <span className="hidden text-xs text-[var(--color-muted-foreground)] sm:inline">
          Quantum Circuit Composer
        </span>
      </header>

      <ComposerToolbar />

      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        {!operationsPanelCollapsed && (
          <>
            <button
              type="button"
              className="fixed inset-0 z-20 bg-black/40 lg:hidden"
              aria-label="Close operations panel"
              onClick={() => setOperationsPanelCollapsed(true)}
            />
            <aside
              className={cn(
                "composer-panel shrink-0 overflow-hidden border-r",
                "absolute inset-y-0 left-0 z-30 w-[min(240px,85vw)] lg:relative lg:z-auto lg:w-[220px] xl:w-[240px]"
              )}
            >
              <GateLibrary
                onDragStart={setDraggingGate}
                onDragEnd={() => setDraggingGate(null)}
              />
            </aside>
          </>
        )}

        <button
          type="button"
          className="relative z-20 flex w-5 shrink-0 items-center justify-center border-r border-[var(--color-border)] bg-[var(--color-toolbar)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-brand-hover)] hover:text-[var(--color-brand)]"
          onClick={() => setOperationsPanelCollapsed(!operationsPanelCollapsed)}
          title={
            operationsPanelCollapsed
              ? "Expand operations catalog"
              : "Collapse operations catalog"
          }
          aria-label={
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
            <div className="min-h-[160px] flex-[2] shrink-0 overflow-hidden border-t border-[var(--color-border)] sm:min-h-[180px]">
              <VisualizationPanels circuit={circuit} />
            </div>
          )}
        </div>

        {showCodePanel && (
          <>
            <button
              type="button"
              className="fixed inset-0 z-20 bg-black/40 lg:hidden"
              aria-label="Close code panel"
              onClick={() => setShowCodePanel(false)}
            />
            <aside
              className={cn(
                "composer-panel flex shrink-0 flex-col overflow-hidden border-l",
                "absolute inset-y-0 right-0 z-30 w-[min(320px,92vw)] lg:relative lg:z-auto lg:w-[280px] xl:w-[320px]"
              )}
            >
              <button
                type="button"
                className="flex h-8 shrink-0 items-center justify-end border-b border-[var(--color-border)] px-2 text-[var(--color-muted-foreground)] hover:text-[var(--color-brand)] lg:hidden"
                onClick={() => setShowCodePanel(false)}
                aria-label="Close code panel"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="min-h-0 flex-1">
                <MultiLanguageCodePanel />
              </div>
            </aside>
          </>
        )}
      </div>

      <ComposerFooter />
    </div>
  );
}
