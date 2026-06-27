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
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-[var(--color-border)] px-3 py-2">
        <h2 className="text-xs font-semibold text-[var(--color-foreground)]">
          Qiskit Python
        </h2>
        <SyncBadge status={syncStatus} error={parseError} />
      </div>

      {parseError && (
        <div className="mx-2 mt-1.5 flex items-start gap-1.5 rounded border border-[var(--color-destructive)]/40 bg-[var(--color-destructive)]/10 px-2 py-1.5 text-[10px] text-[var(--color-destructive)]">
          <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
          <span className="line-clamp-2">{parseError}</span>
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-hidden p-2">
        <div className="h-[calc(100vh-22rem)] min-h-[120px]">
          <CodeEditor
            value={code}
            onChange={handleCodeChange}
            readOnly={false}
            height="100%"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 border-t border-[var(--color-border)] p-2">
        <CodePanelActions code={code} />
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1 text-xs"
          onClick={forceSyncFromCircuit}
          title="Sync from circuit"
        >
          <RefreshCw className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1 text-xs"
          onClick={resetCircuit}
          title="Reset circuit"
        >
          <RotateCcw className="h-3 w-3" />
        </Button>
      </div>
    </div>
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
      </span>
    );
  }
  if (status === "error" || error) {
    return <AlertCircle className="h-3 w-3 text-[var(--color-destructive)]" />;
  }
  return (
    <CheckCircle2 className="h-3 w-3 text-[var(--color-success)]" />
  );
}
