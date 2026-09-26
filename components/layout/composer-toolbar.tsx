"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCircuitStore, circuitHasContent } from "@/store/circuit-store";
import { useEditorUiStore } from "@/store/editor-ui-store";
import { ManageRegistersDialog } from "@/components/circuit/manage-registers-dialog";
import { RunCircuitDialog } from "@/components/execution/run-circuit-dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { getCodeLanguage } from "@/lib/code-adapters";
import { downloadTextFile } from "@/lib/utils";
import { sampleCircuitsMap } from "@/lib/sample-circuits";
import {
  Save,
  Play,
  ChevronDown,
  FileText,
  Edit3,
  Eye,
  HelpCircle,
  Check,
  Menu,
  Download,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * Build-only secondary toolbar (below the global navbar).
 * Editor actions only — no site navigation.
 */
export function ComposerToolbar() {
  const router = useRouter();
  const {
    circuit,
    saveProject,
    resetCircuit,
    undo,
    redo,
    canUndo,
    canRedo,
    clearCircuit,
    loadSampleCircuit,
    selectedOperationId,
    removeOperation,
    duplicateOperation,
  } = useCircuitStore();
  const [registersOpen, setRegistersOpen] = useState(false);
  const [runOpen, setRunOpen] = useState(false);
  const [confirmNewOpen, setConfirmNewOpen] = useState(false);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const {
    showCodePanel,
    showVizPanels,
    showPhaseDisks,
    showInspector,
    operationsPanelCollapsed,
    vizPanels,
    alignmentMode,
    codePanelLanguage,
    setShowCodePanel,
    setShowVizPanels,
    setShowPhaseDisks,
    setShowInspector,
    setVizPanel,
    setAlignmentMode,
    setOperationsPanelCollapsed,
    resetLayout,
  } = useEditorUiStore();

  const handleNewCircuit = () => {
    if (circuitHasContent(circuit)) {
      setConfirmNewOpen(true);
      return;
    }
    resetCircuit();
  };

  const handleSaveProject = () => {
    saveProject(circuit.name.trim() || "Untitled Circuit");
  };

  const handleDownloadFile = () => {
    const adapter = getCodeLanguage(codePanelLanguage);
    const result = adapter.generate(circuit);
    if (!result.success || !result.code) return;
    const ext = adapter.defaultFilename.split(".").pop() ?? "txt";
    const base = (circuit.name.trim() || "untitled_circuit")
      .replace(/\s+/g, "_")
      .toLowerCase();
    downloadTextFile(result.code, `${base}.${ext}`);
  };

  const fileItems = [
    { label: "New Circuit", action: handleNewCircuit },
    { label: "Open Project", action: () => router.push("/projects") },
    { label: "Save Project", action: handleSaveProject },
    { label: "Import Qiskit", action: () => router.push("/import") },
    { label: "Export Code", action: () => router.push("/export") },
    { label: "Download .py", action: handleDownloadFile },
  ];

  const sampleItems = [
    { label: "Bell state", key: "bell" as const },
    { label: "GHZ state", key: "ghz" as const },
    { label: "Superposition", key: "superposition" as const },
    { label: "Teleportation demo", key: "teleportation" as const },
  ];

  const editItems = [
    { label: "Undo", action: undo, disabled: !canUndo() },
    { label: "Redo", action: redo, disabled: !canRedo() },
    {
      label: "Duplicate Gate",
      action: () => selectedOperationId && duplicateOperation(selectedOperationId),
      disabled: !selectedOperationId,
    },
    {
      label: "Delete Gate",
      action: () => selectedOperationId && removeOperation(selectedOperationId),
      disabled: !selectedOperationId,
    },
    { label: "Clear Circuit", action: () => setConfirmClearOpen(true) },
    { label: "Manage registers", action: () => setRegistersOpen(true) },
  ];

  const helpItems = [
    { label: "Supported Gates", action: () => router.push("/docs/composer") },
    { label: "Keyboard Shortcuts", action: () => router.push("/docs/composer") },
    { label: "Translator Limitations", action: () => router.push("/docs/debug") },
    { label: "About this Visualizer", action: () => router.push("/") },
  ];

  return (
    <>
      <div
        className="editor-toolbar composer-toolbar flex h-10 shrink-0 items-center justify-between gap-2 border-b border-[var(--color-border)] bg-[var(--color-toolbar)] px-2 sm:px-3"
        role="toolbar"
        aria-label="Circuit editor"
      >
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
          <Input
            value={circuit.name}
            onChange={(e) =>
              useCircuitStore.setState({
                circuit: { ...circuit, name: e.target.value },
              })
            }
            placeholder="Untitled Circuit"
            aria-label="Circuit name"
            className="h-7 min-w-0 max-w-[160px] border-none bg-transparent px-1 text-sm font-medium shadow-none focus-visible:ring-1 sm:max-w-[220px]"
          />

          {/* Mobile menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="composer-toolbar-btn touch-target flex h-10 w-10 items-center justify-center rounded sm:hidden sm:h-7 sm:w-7"
                aria-label="Open editor menu"
              >
                <Menu className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="max-h-[70vh] w-56 overflow-y-auto">
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="text-xs">File</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {fileItems.map((item) => (
                    <DropdownMenuItem key={item.label} className="text-xs" onClick={item.action}>
                      {item.label}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger className="text-xs">Load sample</DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      {sampleItems.map((item) => (
                        <DropdownMenuItem
                          key={item.key}
                          className="text-xs"
                          onClick={() => loadSampleCircuit(sampleCircuitsMap[item.key])}
                        >
                          {item.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="text-xs">Edit</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {editItems.map((item) => (
                    <DropdownMenuItem
                      key={item.label}
                      className="text-xs"
                      disabled={item.disabled}
                      onClick={item.action}
                    >
                      {item.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuCheckboxItem
                checked={!operationsPanelCollapsed}
                onCheckedChange={(v) => setOperationsPanelCollapsed(!v)}
                className="text-xs"
              >
                Operations panel
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={showCodePanel}
                onCheckedChange={setShowCodePanel}
                className="text-xs"
              >
                Code editor panel
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={showVizPanels}
                onCheckedChange={setShowVizPanels}
                className="text-xs"
              >
                Results panel
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={showInspector}
                onCheckedChange={setShowInspector}
                className="text-xs"
              >
                Inspector panel
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={showPhaseDisks}
                onCheckedChange={setShowPhaseDisks}
                className="text-xs"
              >
                Phase disks
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={vizPanels.probabilities}
                onCheckedChange={(v) => setVizPanel("probabilities", !!v)}
                className="text-xs"
              >
                Probabilities
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={vizPanels.qsphere}
                onCheckedChange={(v) => setVizPanel("qsphere", !!v)}
                className="text-xs"
              >
                Q-sphere
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={vizPanels.histogram}
                onCheckedChange={(v) => setVizPanel("histogram", !!v)}
                className="text-xs"
              >
                Measurement histogram
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={vizPanels.statevector}
                onCheckedChange={(v) => setVizPanel("statevector", !!v)}
                className="text-xs"
              >
                Statevector
              </DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="text-xs">Help</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {helpItems.map((item) => (
                    <DropdownMenuItem key={item.label} className="text-xs" onClick={item.action}>
                      {item.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Desktop menus */}
          <nav className="hidden items-center gap-0.5 sm:flex">
            <ToolbarMenu label="File" icon={FileText} items={fileItems} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="composer-toolbar-btn hidden items-center gap-1 rounded px-2 py-1 text-xs sm:flex">
                  <FileText className="h-3 w-3 opacity-60" />
                  Samples
                  <ChevronDown className="h-3 w-3 opacity-50" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="min-w-[160px]">
                {sampleItems.map((item) => (
                  <DropdownMenuItem
                    key={item.key}
                    className="text-xs"
                    onClick={() => loadSampleCircuit(sampleCircuitsMap[item.key])}
                  >
                    {item.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <ToolbarMenu label="Edit" icon={Edit3} items={editItems} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="composer-toolbar-btn flex items-center gap-1 rounded px-2 py-1 text-xs">
                  <Eye className="h-3 w-3 opacity-60" />
                  View
                  <ChevronDown className="h-3 w-3 opacity-50" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="min-w-[180px]">
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="text-xs">Panels</DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuCheckboxItem
                      checked={!operationsPanelCollapsed}
                      onCheckedChange={(v) => setOperationsPanelCollapsed(!v)}
                      className="text-xs"
                    >
                      Operations
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={showCodePanel}
                      onCheckedChange={setShowCodePanel}
                      className="text-xs"
                    >
                      Code editor
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={showVizPanels}
                      onCheckedChange={setShowVizPanels}
                      className="text-xs"
                    >
                      Results
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={showInspector}
                      onCheckedChange={setShowInspector}
                      className="text-xs"
                    >
                      Inspector
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={vizPanels.probabilities}
                      onCheckedChange={(v) => setVizPanel("probabilities", !!v)}
                      className="text-xs"
                    >
                      Probabilities
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={vizPanels.qsphere}
                      onCheckedChange={(v) => setVizPanel("qsphere", !!v)}
                      className="text-xs"
                    >
                      Q-sphere
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={vizPanels.statevector}
                      onCheckedChange={(v) => setVizPanel("statevector", !!v)}
                      className="text-xs"
                    >
                      Statevector
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={vizPanels.histogram}
                      onCheckedChange={(v) => setVizPanel("histogram", !!v)}
                      className="text-xs"
                    >
                      Measurement histogram
                    </DropdownMenuCheckboxItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuItem className="text-xs" onClick={resetLayout}>
                  Reset layout
                </DropdownMenuItem>
                <DropdownMenuCheckboxItem
                  checked={showPhaseDisks}
                  onCheckedChange={setShowPhaseDisks}
                  className="text-xs"
                >
                  Phase disks
                </DropdownMenuCheckboxItem>
                <DropdownMenuSeparator />
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="text-xs">Alignment</DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    {(
                      [
                        ["freeform", "Freeform"],
                        ["left", "Left alignment"],
                        ["layers", "Layers view"],
                      ] as const
                    ).map(([mode, label]) => (
                      <DropdownMenuItem
                        key={mode}
                        className="text-xs"
                        onClick={() => {
                          setAlignmentMode(mode);
                          if (mode === "left") {
                            useCircuitStore.getState().alignOperationsLeft();
                          }
                        }}
                      >
                        {alignmentMode === mode && <Check className="mr-2 h-3 w-3" />}
                        {label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              </DropdownMenuContent>
            </DropdownMenu>
            <ToolbarMenu label="Help" icon={HelpCircle} items={helpItems} />
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1.5 px-2 text-xs sm:px-3"
            onClick={handleSaveProject}
            aria-label="Save project to browser"
            title="Save Project — stores this circuit in Projects (localStorage)"
          >
            <Save className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Save Project</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 px-2 text-xs sm:px-3"
            onClick={handleDownloadFile}
            aria-label="Download circuit file"
            title="Download File — export generated code to disk"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Download</span>
          </Button>
          <Button
            size="sm"
            className="h-7 gap-1.5 px-2 text-xs sm:px-3"
            onClick={() => setRunOpen(true)}
            title="Set up and run on simulator"
            aria-label="Run circuit"
          >
            <Play className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Run circuit</span>
          </Button>
        </div>
      </div>
      <ManageRegistersDialog open={registersOpen} onOpenChange={setRegistersOpen} />
      <RunCircuitDialog open={runOpen} onOpenChange={setRunOpen} />
      <ConfirmDialog
        open={confirmNewOpen}
        onOpenChange={setConfirmNewOpen}
        title="Start a new circuit?"
        description="This will replace the current circuit. Save your work first if you want to keep it."
        confirmLabel="New circuit"
        destructive
        onConfirm={resetCircuit}
      />
      <ConfirmDialog
        open={confirmClearOpen}
        onOpenChange={setConfirmClearOpen}
        title="Clear circuit?"
        description="Remove all gates from the canvas. Registers and circuit name are kept."
        confirmLabel="Clear circuit"
        destructive
        onConfirm={clearCircuit}
      />
    </>
  );
}

/** Alias matching product language for the Build secondary toolbar */
export const EditorToolbar = ComposerToolbar;

function ToolbarMenu({
  label,
  icon: Icon,
  items,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  items: { label: string; action: () => void; disabled?: boolean }[];
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="composer-toolbar-btn flex items-center gap-1 rounded px-2 py-1 text-xs">
          <Icon className="h-3 w-3 opacity-60" />
          {label}
          <ChevronDown className="h-3 w-3 opacity-50" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[160px]">
        {items.map((item) => (
          <DropdownMenuItem
            key={item.label}
            onClick={item.action}
            disabled={item.disabled}
            className="text-xs"
          >
            {item.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
