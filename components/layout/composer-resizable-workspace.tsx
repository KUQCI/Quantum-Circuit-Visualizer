"use client";

import { useEffect, useRef, type KeyboardEvent } from "react";
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
import {
  getLayoutTier,
  shouldAutoOpenNarrowInspector,
} from "@/lib/composer-layout";
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
import type { NarrowActiveTab } from "@/store/editor-ui-store";
import type { Circuit } from "@/lib/circuit-schema";

interface ComposerResizableWorkspaceProps {
  draggingGate: string | null;
  selectedGate: string | null;
  onGateSelect: (gate: string | null) => void;
  onDragStart: (gate: string | null) => void;
  onDragEnd: () => void;
  onPlacementComplete: () => void;
}

const NARROW_TABS: { id: NarrowActiveTab; label: string }[] = [
  { id: "gates", label: "Gates" },
  { id: "inspector", label: "Inspector" },
  { id: "results", label: "Results" },
  { id: "code", label: "Code" },
];

function NarrowWorkspace({
  draggingGate,
  selectedGate,
  onGateSelect,
  onDragStart,
  onDragEnd,
  onPlacementComplete,
  circuit,
  tier,
  layoutResetKey,
}: ComposerResizableWorkspaceProps & {
  circuit: Circuit;
  tier: ReturnType<typeof getLayoutTier>;
  layoutResetKey: number;
}) {
  const { narrowActiveTab, setNarrowActiveTab } = useEditorUiStore();
  const selectedOperationId = useCircuitStore((s) => s.selectedOperationId);
  const previousSelectedOperationId = useRef(selectedOperationId);
  const activeIndex = NARROW_TABS.findIndex((tab) => tab.id === narrowActiveTab);

  useEffect(() => {
    const shouldOpen = shouldAutoOpenNarrowInspector(
      previousSelectedOperationId.current,
      selectedOperationId,
      narrowActiveTab
    );
    previousSelectedOperationId.current = selectedOperationId;
    if (shouldOpen) setNarrowActiveTab("inspector");
  }, [narrowActiveTab, selectedOperationId, setNarrowActiveTab]);

  const selectTab = (id: NarrowActiveTab) => setNarrowActiveTab(id);
  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    let nextIndex = activeIndex;
    if (event.key === "ArrowRight") nextIndex = (activeIndex + 1) % NARROW_TABS.length;
    else if (event.key === "ArrowLeft") {
      nextIndex = (activeIndex - 1 + NARROW_TABS.length) % NARROW_TABS.length;
    } else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = NARROW_TABS.length - 1;
    else return;
    event.preventDefault();
    const next = NARROW_TABS[nextIndex].id;
    selectTab(next);
    requestAnimationFrame(() => {
      document.querySelector<HTMLButtonElement>(`[data-narrow-tab="${next}"]`)?.focus();
    });
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="min-h-0 basis-[55%] shrink-0 overflow-hidden bg-[var(--color-canvas)]">
        <CircuitCanvas
          draggingGate={draggingGate}
          onDragEnd={onDragEnd}
          placementGate={selectedGate}
          onPlacementComplete={onPlacementComplete}
        />
      </div>
      <div className="flex min-h-0 flex-1 flex-col border-t border-[var(--color-border)]">
        <div
          role="tablist"
          aria-label="Composer panels"
          className="flex shrink-0 border-b border-[var(--color-border)] bg-[var(--color-toolbar)]"
        >
          {NARROW_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={narrowActiveTab === tab.id}
              tabIndex={narrowActiveTab === tab.id ? 0 : -1}
              data-narrow-tab={tab.id}
              className={cn(
                "flex-1 px-2 py-2 text-xs font-medium",
                narrowActiveTab === tab.id
                  ? "border-b-2 border-[var(--color-brand)] text-[var(--color-foreground)]"
                  : "text-[var(--color-muted-foreground)]"
              )}
              onClick={() => selectTab(tab.id)}
              onKeyDown={handleKeyDown}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div
          className="flex min-h-0 flex-1 flex-col overflow-auto"
          tabIndex={0}
          aria-label="Composer panel content"
        >
          {narrowActiveTab === "gates" && (
            <GateLibrary
              selectedGate={selectedGate}
              onGateSelect={onGateSelect}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
            />
          )}
          {narrowActiveTab === "inspector" && <OperationInspector />}
          {narrowActiveTab === "results" && (
            <VisualizationPanels
              circuit={circuit}
              useVizTabs
              layoutTier={tier}
              resizable={false}
              layoutResetKey={layoutResetKey}
            />
          )}
          <div
            className={cn(
              "min-w-0 min-h-[160px] flex-1 flex-col",
              narrowActiveTab === "code" ? "flex h-full" : "hidden"
            )}
          >
            <MultiLanguageCodePanel active={narrowActiveTab === "code"} />
          </div>
        </div>
      </div>
    </div>
  );
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
    vizLayout,
    operationsPanelCollapsed,
    layoutResetKey,
  } = useEditorUiStore();

  const { ref: workspaceRef, size } = useElementSize<HTMLDivElement>();
  const tier = getLayoutTier(size.width, size.height);
  const useVizTabs = tier !== "desktop";

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
    if (!showInspector) panel.collapse();
    else panel.expand();
  }, [showInspector, layoutResetKey]);

  useEffect(() => {
    if (selectedOperationId && !showInspector) {
      useEditorUiStore.getState().setShowInspector(true);
    }
  }, [selectedOperationId, showInspector]);

  return (
    <div ref={workspaceRef} className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {tier !== "desktop" ? (
        <NarrowWorkspace
          draggingGate={draggingGate}
          selectedGate={selectedGate}
          onGateSelect={onGateSelect}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          onPlacementComplete={onPlacementComplete}
          circuit={circuit}
          tier={tier}
          layoutResetKey={layoutResetKey}
        />
      ) : (
        <PanelGroup
          key={`composer-h-${layoutResetKey}`}
          direction="horizontal"
          autoSaveId="qci-composer-h"
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
          onCollapse={() => {
            if (useEditorUiStore.getState().operationsPanelCollapsed) return;
            requestAnimationFrame(() => opsPanelRef.current?.expand());
          }}
          onExpand={() =>
            useEditorUiStore.getState().setOperationsPanelCollapsed(false)
          }
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

        <Panel id="composer-main" order={1} minSize={32} defaultSize={58}>
          <PanelGroup
            key={`composer-v-${layoutResetKey}`}
            direction="vertical"
            autoSaveId="qci-composer-v"
            className="h-full min-h-0"
          >
            <Panel
              id="composer-canvas-stack"
              order={0}
              minSize={28}
              defaultSize={showVizPanels ? 70 : 100}
            >
              <PanelGroup direction="horizontal" className="h-full min-h-0">
                <Panel
                  id="composer-canvas"
                  order={0}
                  minSize={40}
                  defaultSize={showInspector ? 70 : 100}
                >
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
                      defaultSize={30}
                      minSize={16}
                      maxSize={40}
                      collapsible
                      collapsedSize={0}
                      onCollapse={() => {
                        if (useEditorUiStore.getState().showInspector) {
                          requestAnimationFrame(() => inspectorPanelRef.current?.expand());
                        }
                      }}
                      onExpand={() =>
                        useEditorUiStore.getState().setShowInspector(true)
                      }
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
              defaultSize={30}
              minSize={16}
              collapsible
              collapsedSize={0}
              onCollapse={() => {
                if (useEditorUiStore.getState().showVizPanels) {
                  requestAnimationFrame(() => vizPanelRef.current?.expand());
                }
              }}
              onExpand={() => useEditorUiStore.getState().setShowVizPanels(true)}
              className="composer-viz-band min-h-0 border-t border-[var(--color-border)]"
            >
              <VisualizationPanels
                circuit={circuit}
                useVizTabs={useVizTabs || vizLayout === "tabs"}
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
          defaultSize={26}
          minSize={18}
          maxSize={42}
          collapsible
          collapsedSize={0}
          onCollapse={() => {
            if (useEditorUiStore.getState().showCodePanel) {
              requestAnimationFrame(() => codePanelRef.current?.expand());
            }
          }}
          onExpand={() => useEditorUiStore.getState().setShowCodePanel(true)}
          className="composer-panel composer-panel-code min-w-0 border-l border-[var(--color-border)]"
        >
          <MultiLanguageCodePanel active />
        </Panel>
        </PanelGroup>
      )}
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
