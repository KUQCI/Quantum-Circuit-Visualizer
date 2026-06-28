"use client";

import { Suspense, useMemo, useState } from "react";
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
import { computeComposerLayout } from "@/lib/composer-layout";
import { useElementSize } from "@/lib/use-element-size";
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

  const { ref: workspaceRef, size, isMeasured } = useElementSize<HTMLDivElement>();

  const layout = useMemo(
    () =>
      computeComposerLayout({
        width: size.width,
        height: size.height,
        showVizPanels,
      }),
    [size.width, size.height, showVizPanels]
  );

  const topStyle =
    isMeasured && showVizPanels
      ? { height: layout.topHeightPx, flex: "0 0 auto" as const }
      : { flex: showVizPanels ? "1.64 1 0" : "1 1 0", minHeight: 0 };

  const vizStyle =
    isMeasured && showVizPanels
      ? { height: layout.vizHeightPx, flex: "0 0 auto" as const }
      : { flex: "1 1 0", minHeight: 0 };

  return (
    <div className="composer-shell flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-[var(--color-background)]">
      <Suspense fallback={null}>
        <EditorBootstrap />
      </Suspense>

      <ComposerToolbar immersive />

      <FeatureErrorBoundary
        title="Build workspace error"
        description="The circuit editor hit an unexpected error. Your saved data may need repair."
        resetHref="/"
      >
        <div
          ref={workspaceRef}
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
        >
          <div className="composer-workspace-top relative flex min-h-0 overflow-hidden" style={topStyle}>
            {!operationsPanelCollapsed && (
              <>
                {layout.useOverlayPanels && (
                  <button
                    type="button"
                    className="fixed inset-0 z-20 bg-black/40"
                    aria-label="Close operations panel"
                    onClick={() => setOperationsPanelCollapsed(true)}
                  />
                )}
                <aside
                  className={cn(
                    "composer-panel composer-panel-ops shrink-0 overflow-hidden border-r",
                    layout.useOverlayPanels
                      ? "absolute inset-y-0 left-0 z-30"
                      : "relative"
                  )}
                  style={{ width: layout.opsPanelWidthPx }}
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

            <div className="composer-canvas-column min-h-0 min-w-0 flex-1 overflow-hidden bg-[var(--color-canvas)]">
              <CircuitCanvas
                draggingGate={draggingGate}
                onDragEnd={() => setDraggingGate(null)}
                placementGate={selectedGate}
                onPlacementComplete={() => setSelectedGate(null)}
              />
            </div>

            {showCodePanel ? (
              <>
                {layout.useOverlayPanels && (
                  <button
                    type="button"
                    className="fixed inset-0 z-20 bg-black/40"
                    aria-label="Close code panel"
                    onClick={() => setShowCodePanel(false)}
                  />
                )}
                <aside
                  className={cn(
                    "composer-panel composer-panel-code flex shrink-0 flex-col overflow-hidden border-l",
                    layout.useOverlayPanels
                      ? "absolute inset-y-0 right-0 z-30"
                      : "relative"
                  )}
                  style={{ width: layout.codePanelWidthPx }}
                >
                  {layout.useOverlayPanels && (
                    <button
                      type="button"
                      className="flex h-8 shrink-0 items-center justify-end border-b border-[var(--color-border)] px-2 text-[var(--color-muted-foreground)] hover:text-[var(--color-brand)]"
                      onClick={() => setShowCodePanel(false)}
                      aria-label="Close code panel"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                  <div className="min-h-0 flex-1 overflow-hidden">
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

            {showCodePanel && !layout.useOverlayPanels && (
              <button
                type="button"
                className="composer-panel-rail relative z-20 shrink-0"
                onClick={() => setShowCodePanel(false)}
                title="Collapse code editor"
                aria-label="Collapse code editor"
              >
                <PanelRightClose className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {showVizPanels && (
            <div
              className="composer-viz-band min-h-0 overflow-hidden border-t border-[var(--color-border)]"
              style={vizStyle}
            >
              <VisualizationPanels
                circuit={circuit}
                useVizTabs={layout.useVizTabs}
                layoutTier={layout.tier}
              />
            </div>
          )}
        </div>
      </FeatureErrorBoundary>

      <ComposerFooter />
    </div>
  );
}
