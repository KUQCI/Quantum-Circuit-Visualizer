"use client";

import { useCircuitStore } from "@/store/circuit-store";
import { getCircuitDepth } from "@/lib/circuit-schema";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Compact Build status bar — validation + circuit stats.
 */
export function ComposerStatusBar() {
  const circuit = useCircuitStore((s) => s.circuit);
  const warnings = useCircuitStore((s) => s.validationWarnings);
  const selectedId = useCircuitStore((s) => s.selectedOperationId);
  const depth = getCircuitDepth(circuit);
  const ok = warnings.length === 0;
  const selected = circuit.operations.find((op) => op.id === selectedId);

  return (
    <div
      className="composer-status-bar flex h-7 shrink-0 items-center gap-3 border-t border-[var(--color-border)] bg-[var(--color-toolbar)] px-2 text-[10px] sm:px-3"
      role="status"
      aria-live="polite"
    >
      <div
        className={cn(
          "flex min-w-0 flex-1 items-center gap-1.5 truncate",
          ok
            ? "text-[var(--color-muted-foreground)]"
            : "text-[var(--color-warning)]"
        )}
      >
        {ok ? (
          <CheckCircle2 className="h-3 w-3 shrink-0 text-[var(--color-success)]" />
        ) : (
          <AlertTriangle className="h-3 w-3 shrink-0" />
        )}
        <span className="truncate">
          {ok
            ? "Ready"
            : warnings[0] ?? `${warnings.length} validation warning(s)`}
        </span>
      </div>
      <div className="hidden shrink-0 items-center gap-2 text-[var(--color-muted-foreground)] sm:flex">
        <span>
          q={circuit.qubits.length} · c={circuit.classicalBits.length}
        </span>
        <span aria-hidden>·</span>
        <span>
          ops={circuit.operations.length} · depth={depth}
        </span>
        {selected && (
          <>
            <span aria-hidden>·</span>
            <span className="text-[var(--color-brand)]">
              {selected.label} @ col {selected.column + 1}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
