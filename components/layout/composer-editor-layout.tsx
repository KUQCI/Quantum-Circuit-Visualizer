"use client";

import Link from "next/link";
import { ComposerToolbar } from "@/components/layout/composer-toolbar";
import { ComposerFooter } from "@/components/layout/composer-footer";
import { GateLibrary } from "@/components/gates/gate-library";
import { CircuitCanvas } from "@/components/circuit/circuit-canvas";
import { QiskitCodePanel } from "@/components/code/qiskit-code-panel";
import { VisualizationPanels } from "@/components/visualizations/visualization-panels";
import { useCircuitStore } from "@/store/circuit-store";
import { Atom } from "lucide-react";

export function ComposerEditorLayout() {
  const circuit = useCircuitStore((s) => s.circuit);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[var(--color-background)]">
      {/* Global slim header */}
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-background)] px-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-semibold text-[var(--color-foreground)]"
        >
          <Atom className="h-4 w-4 text-[var(--color-primary)]" />
          Qiskit Visualizer
        </Link>
        <span className="text-xs text-[var(--color-muted-foreground)]">
          Quantum Circuit Composer
        </span>
      </header>

      <ComposerToolbar />

      {/* Main workspace: Operations | Circuit | Code */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <aside className="composer-panel w-[200px] shrink-0 overflow-hidden border-r">
          <GateLibrary onDragStart={() => {}} />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-[var(--color-canvas)]">
          <div className="min-h-0 flex-[3] overflow-hidden">
            <CircuitCanvas />
          </div>
          <div className="min-h-[200px] flex-[2] shrink-0 overflow-hidden border-t border-[var(--color-border)]">
            <VisualizationPanels circuit={circuit} />
          </div>
        </div>

        <aside className="composer-panel w-[280px] shrink-0 overflow-hidden border-l xl:w-[320px]">
          <QiskitCodePanel />
        </aside>
      </div>

      <ComposerFooter />
    </div>
  );
}
