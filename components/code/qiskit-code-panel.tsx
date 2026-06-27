"use client";

import { Button } from "@/components/ui/button";
import { CodeEditor } from "@/components/code/code-editor";
import { CodePanelActions } from "@/components/code/code-panel";
import { useCodeSync } from "@/components/code/use-code-sync";
import { useCircuitStore } from "@/store/circuit-store";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function QiskitCodePanel() {
  const { resetCircuit } = useCircuitStore();
  const {
    code,
    parseError,
    syncStatus,
    handleCodeChange,
    forceSyncFromCircuit,
  } = useCodeSync();

  return (
    <aside className="flex h-full w-80 shrink-0 flex-col border-l border-[var(--color-border)] bg-[var(--color-card)]">
      <div className="border-b border-[var(--color-border)] px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold">Qiskit Code</h2>
            <p className="text-xs text-[var(--color-muted-foreground)]">
              Edit code — circuit updates live
            </p>
          </div>
          <SyncBadge status={syncStatus} error={parseError} />
        </div>
      </div>

      {parseError && (
        <div className="mx-3 mt-2 flex items-start gap-2 rounded border border-[var(--color-destructive)]/40 bg-[var(--color-destructive)]/10 px-2.5 py-2 text-xs text-[var(--color-destructive)]">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span className="line-clamp-3">{parseError}</span>
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-3">
        <CodeEditor
          value={code}
          onChange={handleCodeChange}
          readOnly={false}
          height="calc(100vh - 16rem)"
        />
      </div>

      <div className="flex flex-wrap gap-2 border-t border-[var(--color-border)] p-3">
        <CodePanelActions code={code} />
        <Button
          variant="outline"
          size="sm"
          onClick={forceSyncFromCircuit}
          title="Regenerate code from circuit"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Sync
        </Button>
        <Button variant="outline" size="sm" onClick={resetCircuit}>
          <RotateCcw className="h-3.5 w-3.5" />
          Reset
        </Button>
      </div>
    </aside>
  );
}

function SyncBadge({
  status,
  error,
}: {
  status: "synced" | "editing" | "error";
  error: string | null;
}) {
  if (status === "editing") {
    return (
      <span className="flex items-center gap-1 text-[10px] text-[var(--color-muted-foreground)]">
        <Loader2 className="h-3 w-3 animate-spin" />
        Editing
      </span>
    );
  }
  if (status === "error" || error) {
    return (
      <span className="flex items-center gap-1 text-[10px] text-red-400">
        <AlertCircle className="h-3 w-3" />
        Error
      </span>
    );
  }
  return (
    <span
      className={cn(
        "flex items-center gap-1 text-[10px]",
        "text-[var(--color-success)]"
      )}
    >
      <CheckCircle2 className="h-3 w-3" />
      Synced
    </span>
  );
}
