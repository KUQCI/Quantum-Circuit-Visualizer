"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ModeSwitcher } from "@/components/navigation/ModeSwitcher";
import { useCircuitStore, circuitHasContent } from "@/store/circuit-store";
import { useEditorUiStore } from "@/store/editor-ui-store";
import { ManageRegistersDialog } from "@/components/circuit/manage-registers-dialog";
import { RunCircuitDialog } from "@/components/execution/run-circuit-dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
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

export function ComposerToolbar({ immersive = false }: { immersive?: boolean }) {
  const router = useRouter();
  const { circuit, saveProject, resetCircuit, undo, redo, canUndo, canRedo } =
    useCircuitStore();
  const [registersOpen, setRegistersOpen] = useState(false);
  const [runOpen, setRunOpen] = useState(false);
  const [confirmNewOpen, setConfirmNewOpen] = useState(false);
  const {
    showCodePanel,
    showVizPanels,
    showPhaseDisks,
    vizPanels,
    alignmentMode,
    setShowCodePanel,
    setShowVizPanels,
    setShowPhaseDisks,
    setVizPanel,
    setAlignmentMode,
  } = useEditorUiStore();

  const handleNewCircuit = () => {
    if (circuitHasContent(circuit)) {
      setConfirmNewOpen(true);
      return;
    }
    resetCircuit();
  };

  const fileItems = [
    { label: "Home", action: () => router.push("/") },
    { label: "New circuit", action: handleNewCircuit },
    { label: "Save file", action: () => saveProject() },
    { label: "Open projects", action: () => router.push("/projects") },
    { label: "Import circuit", action: () => router.push("/import") },
    { label: "Export Qiskit", action: () => router.push("/export") },
  ];

  const editItems = [
    { label: "Undo", action: undo, disabled: !canUndo() },
    { label: "Redo", action: redo, disabled: !canRedo() },
    { label: "Manage registers", action: () => setRegistersOpen(true) },
    {
      label: "Left alignment",
      action: () => useCircuitStore.getState().alignOperationsLeft(),
    },
  ];

  const helpItems = [
    { label: "Composer guide", action: () => router.push("/docs/composer") },
    { label: "API reference", action: () => router.push("/docs/api") },
    { label: "Roadmap", action: () => router.push("/roadmap") },
  ];

  return (
    <>
      <div className="composer-toolbar flex h-9 shrink-0 items-center justify-between gap-2 border-b border-[var(--color-border)] bg-[var(--color-toolbar)] px-2 sm:px-3">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
          {immersive && (
            <Link
              href="/"
              className="flex shrink-0 items-center gap-1.5 rounded-md px-1.5 py-1 text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-brand-hover)] hover:text-[var(--color-brand)]"
              title="Home"
            >
              <Image
                src="https://kuqci.github.io/logo.png"
                alt=""
                width={18}
                height={18}
                className="rounded"
                unoptimized
                aria-hidden
              />
              <span className="hidden text-xs font-medium sm:inline">Home</span>
            </Link>
          )}
          <Input
            value={circuit.name}
            onChange={(e) =>
              useCircuitStore.setState({
                circuit: { ...circuit, name: e.target.value },
              })
            }
            aria-label="Circuit name"
            className="h-7 min-w-0 max-w-[140px] border-none bg-transparent px-1 text-sm font-medium shadow-none focus-visible:ring-0 sm:max-w-[176px]"
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
                Visualizations panel
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
                      Visualizations
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
          {immersive && <ModeSwitcher size="sm" className="inline-flex" />}
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1.5 px-2 text-xs sm:px-3"
            onClick={() => saveProject()}
          >
            <Save className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Save file</span>
          </Button>
          <Button
            size="sm"
            className="h-7 gap-1.5 px-2 text-xs sm:px-3"
            onClick={() => setRunOpen(true)}
            title="Set up and run on simulator"
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
    </>
  );
}

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
