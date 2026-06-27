"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCircuitStore } from "@/store/circuit-store";
import { useEditorUiStore } from "@/store/editor-ui-store";
import { ManageRegistersDialog } from "@/components/circuit/manage-registers-dialog";
import {
  Save,
  Play,
  ChevronDown,
  FileText,
  Edit3,
  Eye,
  HelpCircle,
  Check,
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

export function ComposerToolbar() {
  const router = useRouter();
  const { circuit, saveProject } = useCircuitStore();
  const [registersOpen, setRegistersOpen] = useState(false);
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

  return (
    <>
      <div className="flex h-10 shrink-0 items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-toolbar)] px-3">
        <div className="flex items-center gap-3">
          <Input
            value={circuit.name}
            onChange={(e) =>
              useCircuitStore.setState({
                circuit: { ...circuit, name: e.target.value },
              })
            }
            className="h-7 w-44 border-none bg-transparent px-1 text-sm font-medium shadow-none focus-visible:ring-0"
          />
          <nav className="hidden items-center gap-0.5 sm:flex">
            <ToolbarMenu
              label="File"
              icon={FileText}
              items={[
                {
                  label: "New circuit",
                  action: () => useCircuitStore.getState().resetCircuit(),
                },
                { label: "Save file", action: () => saveProject() },
                {
                  label: "Open projects",
                  action: () => router.push("/projects"),
                },
                { label: "Import Qiskit", action: () => router.push("/import") },
                {
                  label: "Export Qiskit",
                  action: () => router.push("/export"),
                },
              ]}
            />
            <ToolbarMenu
              label="Edit"
              icon={Edit3}
              items={[
                {
                  label: "Undo",
                  action: () => useCircuitStore.getState().undo(),
                },
                {
                  label: "Redo",
                  action: () => useCircuitStore.getState().redo(),
                },
                {
                  label: "Manage registers",
                  action: () => setRegistersOpen(true),
                },
                {
                  label: "Left alignment",
                  action: () => useCircuitStore.getState().alignOperationsLeft(),
                },
              ]}
            />
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
                  <DropdownMenuSubTrigger className="text-xs">
                    Panels
                  </DropdownMenuSubTrigger>
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
                  <DropdownMenuSubTrigger className="text-xs">
                    Alignment
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    {(
                      [
                        ["freeform", "Freeform"],
                        ["left", "Left alignment"],
                        ["layers", "Layers alignment"],
                      ] as const
                    ).map(([mode, label]) => (
                      <DropdownMenuItem
                        key={mode}
                        className="text-xs"
                        onClick={() => {
                          setAlignmentMode(mode);
                          if (mode !== "freeform") {
                            useCircuitStore.getState().alignOperationsLeft();
                          }
                        }}
                      >
                        {alignmentMode === mode && (
                          <Check className="mr-2 h-3 w-3" />
                        )}
                        {label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              </DropdownMenuContent>
            </DropdownMenu>
            <ToolbarMenu
              label="Help"
              icon={HelpCircle}
              items={[
                {
                  label: "Composer guide",
                  action: () => router.push("/docs/composer"),
                },
                { label: "Roadmap", action: () => router.push("/roadmap") },
              ]}
            />
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1.5 border-[var(--color-border)] bg-transparent text-xs"
            onClick={() => saveProject()}
          >
            <Save className="h-3.5 w-3.5" />
            Save file
          </Button>
          <Button
            size="sm"
            className="h-7 gap-1.5 bg-[var(--color-primary)] text-xs hover:brightness-110"
            onClick={() => router.push("/export")}
            title="Export Qiskit code (Run on hardware coming soon)"
          >
            <Play className="h-3.5 w-3.5" />
            Run circuit
          </Button>
        </div>
      </div>
      <ManageRegistersDialog open={registersOpen} onOpenChange={setRegistersOpen} />
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
  items: { label: string; action: () => void }[];
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
            className="text-xs"
          >
            {item.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
