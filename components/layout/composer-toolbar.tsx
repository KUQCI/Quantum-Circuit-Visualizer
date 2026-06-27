"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCircuitStore } from "@/store/circuit-store";
import {
  Save,
  Play,
  ChevronDown,
  FileText,
  Edit3,
  Eye,
  HelpCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ComposerToolbar() {
  const router = useRouter();
  const { circuit, saveProject } = useCircuitStore();

  return (
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
          <ToolbarMenu label="File" icon={FileText} items={[
            { label: "New circuit", action: () => useCircuitStore.getState().resetCircuit() },
            { label: "Save project", action: () => saveProject() },
            { label: "Open projects", action: () => router.push("/projects") },
            { label: "Import Qiskit", action: () => router.push("/import") },
          ]} />
          <ToolbarMenu label="Edit" icon={Edit3} items={[
            { label: "Undo", action: () => useCircuitStore.getState().undo() },
            { label: "Redo", action: () => useCircuitStore.getState().redo() },
          ]} />
          <ToolbarMenu label="View" icon={Eye} items={[
            { label: "Export code", action: () => router.push("/export") },
          ]} />
          <ToolbarMenu label="Help" icon={HelpCircle} items={[
            { label: "Roadmap", action: () => router.push("/roadmap") },
          ]} />
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
        >
          <Play className="h-3.5 w-3.5" />
          Export Qiskit
        </Button>
      </div>
    </div>
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
      <DropdownMenuContent align="start" className="min-w-[140px]">
        {items.map((item) => (
          <DropdownMenuItem key={item.label} onClick={item.action} className="text-xs">
            {item.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
