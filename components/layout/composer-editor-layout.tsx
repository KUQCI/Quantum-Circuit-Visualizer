"use client";

import { Suspense, useState } from "react";
import { ComposerToolbar } from "@/components/layout/composer-toolbar";
import { ComposerFooter } from "@/components/layout/composer-footer";
import { EditorBootstrap } from "@/components/layout/editor-bootstrap";
import { GateLibrary } from "@/components/gates/gate-library";
import { CircuitCanvas } from "@/components/circuit/circuit-canvas";
import { MultiLanguageCodePanel } from "@/components/code/multi-language-code-panel";
import { VisualizationPanels } from "@/components/visualizations/visualization-panels";
import { FeatureErrorBoundary } from "@/components/errors/FeatureErrorBoundary";
import { useCircuitStore } from "@/store/circuit-store";
import { useEditorUiStore } from "@/store/editor-ui-store";
import { PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function ComposerEditorLayout() {
  const circuit = useCircuitStore((s) => s.circuit);
  const [draggingGate, setDraggingGate] = useState<string | null>(null);
  const [selectedGate, setSelectedGate] = useState<string | null>(null);
  const {
    showCodePanel,
    showVizPanels,
    operationsPanelCollapsed,
    setOperationsPanelCollapsed,
    setShowCodePanel,
  } = useEditorUiStore();

  return (
    <div className="composer-shell flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-[var(--color-background)]">
      <Suspense fallback={null}>
        <EditorBootstrap />
      </Suspense>

      <ComposerToolbar />

      <FeatureErrorBoundary
        title="Build workspace error"
        description="The circuit editor hit an unexpected error. Your saved data may need repair."
        resetHref="/"
      >
        <div
          className={cn(
            "composer-workspace min-h-0 flex-1",
            showVizPanels && "composer-workspace--with-viz"
          )}
        >
          {/* Top row: operations | circuit | code (IBM Composer layout) */}
          <div className="composer-workspace-top relative flex min-h-0 overflow-hidden">
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
                    "composer-panel composer-panel-ops shrink-0 overflow-hidden border-r",
                    "absolute inset-y-0 left-0 z-30 w-[min(248px,88vw)] lg:relative lg:z-auto lg:w-[232px] xl:w-[248px]"
                  )}
                >
                  <GateLibrary
                    selectedGate={selectedGate}
                    onGateSelect={setSelectedGate}
                    onDragStart={setDraggingGate}
                    onDragEnd={() => setDraggingGate(null)}
                  />
                </aside>
              </>
            )}

            <button
              type="button"
              className="composer-panel-rail relative z-20 shrink-0"
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

            <div className="composer-canvas-column min-w-0 flex-1 overflow-hidden bg-[var(--color-canvas)]">
              <CircuitCanvas
                draggingGate={draggingGate}
                onDragEnd={() => setDraggingGate(null)}
                placementGate={selectedGate}
                onPlacementComplete={() => setSelectedGate(null)}
              />
            </div>

            {showCodePanel ? (
              <>
                <button
                  type="button"
                  className="fixed inset-0 z-20 bg-black/40 lg:hidden"
                  aria-label="Close code panel"
                  onClick={() => setShowCodePanel(false)}
                />
                <aside
                  className={cn(
                    "composer-panel composer-panel-code flex shrink-0 flex-col overflow-hidden border-l",
                    "absolute inset-y-0 right-0 z-30 w-[min(340px,92vw)] lg:relative lg:z-auto lg:w-[300px] xl:w-[340px]"
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
            ) : (
              <button
                type="button"
                className="composer-panel-rail relative z-20 shrink-0 border-l"
                onClick={() => setShowCodePanel(true)}
                title="Expand code editor"
                aria-label="Expand code editor"
              >
                <PanelRightOpen className="h-3.5 w-3.5" />
              </button>
            )}

            {showCodePanel && (
              <button
                type="button"
                className="composer-panel-rail relative z-20 hidden shrink-0 lg:flex"
                onClick={() => setShowCodePanel(false)}
                title="Collapse code editor"
                aria-label="Collapse code editor"
              >
                <PanelRightClose className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Bottom band: visualizations span full workspace width */}
          {showVizPanels && (
            <div className="composer-viz-band min-h-0 overflow-hidden border-t border-[var(--color-border)]">
              <VisualizationPanels circuit={circuit} />
            </div>
          )}
        </div>
      </FeatureErrorBoundary>

      <ComposerFooter />
    </div>
  );
}
