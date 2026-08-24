"use client";

import { useEffect, useRef } from "react";
import {
  Panel,
  PanelGroup,
  PanelResizeHandle,
  type ImperativePanelHandle,
} from "react-resizable-panels";
import { GateLibrary } from "@/components/gates/gate-library";
import { CircuitCanvas } from "@/components/circuit/circuit-canvas";
import { OperationInspector } from "@/components/circuit/operation-inspector";
import { MultiLanguageCodePanel } from "@/components/code/multi-language-code-panel";
import { VisualizationPanels } from "@/components/visualizations/visualization-panels";
import { useCircuitStore } from "@/store/circuit-store";
import { useEditorUiStore } from "@/store/editor-ui-store";
import { getLayoutTier } from "@/lib/composer-layout";
import { useElementSize } from "@/lib/use-element-size";
import {
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ComposerResizableWorkspaceProps {
  draggingGate: string | null;
  selectedGate: string | null;
  onGateSelect: (gate: string | null) => void;
  onDragStart: (gate: string | null) => void;
  onDragEnd: () => void;
  onPlacementComplete: () => void;
}

export function ComposerResizableWorkspace({
  draggingGate,
  selectedGate,
  onGateSelect,
  onDragStart,
  onDragEnd,
  onPlacementComplete,
}: ComposerResizableWorkspaceProps) {
  const circuit = useCircuitStore((s) => s.circuit);
  const selectedOperationId = useCircuitStore((s) => s.selectedOperationId);

  const {
    showCodePanel,
    showVizPanels,
    showInspector,
    operationsPanelCollapsed,
    layoutResetKey,
    setShowCodePanel,
    setShowVizPanels,
    setOperationsPanelCollapsed,
  } = useEditorUiStore();

  const { ref: workspaceRef, size } = useElementSize<HTMLDivElement>();
  const tier = getLayoutTier(size.width, size.height);
  const useVizTabs = tier !== "desktop";
  const showInspectorPanel = showInspector && !!selectedOperationId;

  const opsPanelRef = useRef<ImperativePanelHandle>(null);
  const codePanelRef = useRef<ImperativePanelHandle>(null);
  const vizPanelRef = useRef<ImperativePanelHandle>(null);
  const inspectorPanelRef = useRef<ImperativePanelHandle>(null);

  useEffect(() => {
    const panel = opsPanelRef.current;
    if (!panel) return;
    if (operationsPanelCollapsed) panel.collapse();
    else panel.expand();
  }, [operationsPanelCollapsed, layoutResetKey]);

  useEffect(() => {
    const panel = codePanelRef.current;
    if (!panel) return;
    if (!showCodePanel) panel.collapse();
    else panel.expand();
  }, [showCodePanel, layoutResetKey]);

  useEffect(() => {
    const panel = vizPanelRef.current;
    if (!panel) return;
    if (!showVizPanels) panel.collapse();
    else panel.expand();
  }, [showVizPanels, layoutResetKey]);

  useEffect(() => {
    const panel = inspectorPanelRef.current;
    if (!panel) return;
    if (!showInspectorPanel) panel.collapse();
    else panel.expand();
  }, [showInspectorPanel, layoutResetKey]);

  return (
    <div ref={workspaceRef} className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <PanelGroup
        key={`composer-h-${layoutResetKey}`}
        direction="horizontal"
        autoSaveId="react-resizable-panels:qci-composer-h"
        className="min-h-0 flex-1"
      >
        <Panel
          ref={opsPanelRef}
          id="composer-ops"
          order={0}
          defaultSize={16}
          minSize={12}
          maxSize={28}
          collapsible
          collapsedSize={0}
          onCollapse={() => setOperationsPanelCollapsed(true)}
          onExpand={() => setOperationsPanelCollapsed(false)}
          className="composer-panel composer-panel-ops min-w-0"
        >
          <GateLibrary
            selectedGate={selectedGate}
            onGateSelect={onGateSelect}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
          />
        </Panel>

        <PanelResizeHandle className="composer-resize-handle composer-resize-handle--horizontal" />

        <Panel id="composer-main" order={1} minSize={30} defaultSize={54}>
          <PanelGroup
            key={`composer-v-${layoutResetKey}`}
            direction="vertical"
            autoSaveId="react-resizable-panels:qci-composer-v"
            className="h-full min-h-0"
          >
            <Panel id="composer-canvas-stack" order={0} minSize={25} defaultSize={showVizPanels ? 65 : 100}>
              <PanelGroup direction="horizontal" className="h-full min-h-0">
                <Panel id="composer-canvas" order={0} minSize={35} defaultSize={showInspectorPanel ? 72 : 100}>
                  <div className="composer-canvas-column h-full min-h-0 overflow-hidden bg-[var(--color-canvas)]">
                    <CircuitCanvas
                      draggingGate={draggingGate}
                      onDragEnd={onDragEnd}
                      placementGate={selectedGate}
                      onPlacementComplete={onPlacementComplete}
                    />
                  </div>
                </Panel>

                {showInspector && (
                  <>
                    <PanelResizeHandle className="composer-resize-handle composer-resize-handle--horizontal" />
                    <Panel
                      ref={inspectorPanelRef}
                      id="composer-inspector"
                      order={1}
                      defaultSize={28}
                      minSize={18}
                      maxSize={40}
                      collapsible
                      collapsedSize={0}
                      className="composer-panel min-w-0 border-l border-[var(--color-border)]"
                    >
                      <OperationInspector />
                    </Panel>
                  </>
                )}
              </PanelGroup>
            </Panel>

            <PanelResizeHandle className="composer-resize-handle composer-resize-handle--vertical" />

            <Panel
              ref={vizPanelRef}
              id="composer-viz"
              order={1}
              defaultSize={35}
              minSize={15}
              collapsible
              collapsedSize={0}
              onCollapse={() => setShowVizPanels(false)}
              onExpand={() => setShowVizPanels(true)}
              className="composer-viz-band min-h-0 border-t border-[var(--color-border)]"
            >
              <VisualizationPanels
                circuit={circuit}
                useVizTabs={useVizTabs}
                layoutTier={tier}
                resizable={tier === "desktop"}
                layoutResetKey={layoutResetKey}
              />
            </Panel>
          </PanelGroup>
        </Panel>

        <PanelResizeHandle className="composer-resize-handle composer-resize-handle--horizontal" />

        <Panel
          ref={codePanelRef}
          id="composer-code"
          order={2}
          defaultSize={30}
          minSize={18}
          maxSize={42}
          collapsible
          collapsedSize={0}
          onCollapse={() => setShowCodePanel(false)}
          onExpand={() => setShowCodePanel(true)}
          className="composer-panel composer-panel-code min-w-0 border-l border-[var(--color-border)]"
        >
          <MultiLanguageCodePanel />
        </Panel>
      </PanelGroup>
    </div>
  );
}

export function ComposerCollapseButtons() {
  const {
    showCodePanel,
    showVizPanels,
    operationsPanelCollapsed,
    setShowCodePanel,
    setShowVizPanels,
    setOperationsPanelCollapsed,
  } = useEditorUiStore();

  return (
    <div className="composer-collapse-rails pointer-events-none absolute inset-0 z-20 hidden lg:block">
      <button
        type="button"
        className={cn(
          "composer-panel-rail pointer-events-auto absolute bottom-0 left-0 top-0 border-r",
          operationsPanelCollapsed && "composer-panel-rail--collapsed"
        )}
        style={{ width: "1rem" }}
        onClick={() => setOperationsPanelCollapsed(!operationsPanelCollapsed)}
        title={operationsPanelCollapsed ? "Expand operations" : "Collapse operations"}
        aria-label={operationsPanelCollapsed ? "Expand operations" : "Collapse operations"}
      >
        {operationsPanelCollapsed ? (
          <PanelLeftOpen className="h-3.5 w-3.5" />
        ) : (
          <PanelLeftClose className="h-3.5 w-3.5" />
        )}
      </button>
      <button
        type="button"
        className="composer-panel-rail pointer-events-auto absolute bottom-0 right-0 top-0 border-l"
        style={{ width: "1rem" }}
        onClick={() => setShowCodePanel(!showCodePanel)}
        title={showCodePanel ? "Collapse code editor" : "Expand code editor"}
        aria-label={showCodePanel ? "Collapse code editor" : "Expand code editor"}
      >
        {showCodePanel ? (
          <PanelRightClose className="h-3.5 w-3.5" />
        ) : (
          <PanelRightOpen className="h-3.5 w-3.5" />
        )}
      </button>
      <button
        type="button"
        className="composer-panel-rail pointer-events-auto absolute bottom-0 left-1/2 -translate-x-1/2 border-t"
        style={{ height: "1rem", width: "4rem" }}
        onClick={() => setShowVizPanels(!showVizPanels)}
        title={showVizPanels ? "Collapse results" : "Expand results"}
        aria-label={showVizPanels ? "Collapse results" : "Expand results"}
      >
        {showVizPanels ? (
          <ChevronDown className="h-3.5 w-3.5" />
        ) : (
          <ChevronUp className="h-3.5 w-3.5" />
        )}
      </button>
    </div>
  );
}
