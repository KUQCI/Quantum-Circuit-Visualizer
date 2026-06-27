"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CodeEditor } from "@/components/code/code-editor";
import { CodePanelActions } from "@/components/code/code-panel";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useCodeSync } from "@/components/code/use-code-sync";
import { useCircuitStore, circuitHasContent } from "@/store/circuit-store";
import { useEditorUiStore } from "@/store/editor-ui-store";
import { CODE_LANGUAGES, type CodeLanguageId } from "@/lib/code-adapters";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Loader2,
  RefreshCw,
  RotateCcw,
} from "lucide-react";

export function MultiLanguageCodePanel() {
  const { resetCircuit, circuit } = useCircuitStore();
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const codePanelLanguage = useEditorUiStore((s) => s.codePanelLanguage);
  const setCodePanelLanguage = useEditorUiStore((s) => s.setCodePanelLanguage);
  const {
    code,
    parseError,
    syncStatus,
    adapter,
    handleCodeChange,
    forceSyncFromCircuit,
    readOnly,
  } = useCodeSync();

  const filename = `${circuit.name.replace(/\s+/g, "_").toLowerCase()}.${adapter.defaultFilename.split(".").pop()}`;

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-[var(--color-border)] px-2 py-2">
        <div className="mb-2 flex items-center justify-between px-1">
          <h2 className="text-xs font-semibold text-[var(--color-foreground)]">
            Code editor
          </h2>
          <SyncBadge status={syncStatus} error={parseError} />
        </div>
        <div className="flex flex-wrap gap-1">
          {CODE_LANGUAGES.map((lang) => (
            <button
              key={lang.id}
              type="button"
              className={cn(
                "segment-btn px-2 py-0.5 text-[10px]",
                codePanelLanguage === lang.id && "segment-btn-active"
              )}
              onClick={() => setCodePanelLanguage(lang.id as CodeLanguageId)}
              title={lang.description}
              aria-pressed={codePanelLanguage === lang.id}
            >
              {lang.label}
            </button>
          ))}
        </div>
        <p className="mt-1.5 px-1 text-[10px] text-[var(--color-muted-foreground)]">
          {adapter.description}
          {!adapter.bidirectional && " · Export only"}
        </p>
      </div>

      {parseError && (
        <div className="mx-2 mt-1.5 flex items-start gap-1.5 rounded border border-[var(--color-destructive)]/40 bg-[var(--color-destructive)]/10 px-2 py-1.5 text-[10px] text-[var(--color-destructive)]">
          <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
          <span className="line-clamp-3">{parseError}</span>
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-hidden p-2">
        <div className="h-full min-h-[120px]">
          <CodeEditor
            value={code}
            onChange={handleCodeChange}
            readOnly={readOnly}
            language={adapter.monacoLanguage}
            height="100%"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 border-t border-[var(--color-border)] p-2">
        <CodePanelActions code={code} filename={filename} />
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
          onClick={() => {
            if (circuitHasContent(circuit)) {
              setConfirmResetOpen(true);
            } else {
              resetCircuit();
            }
          }}
          title="Reset circuit"
          aria-label="Reset circuit"
        >
          <RotateCcw className="h-3 w-3" />
        </Button>
        {adapter.docsUrl && (
          <a
            href={adapter.docsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto flex items-center gap-1 text-[10px] text-[var(--color-brand)] hover:underline"
          >
            API docs
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>

      <ConfirmDialog
        open={confirmResetOpen}
        onOpenChange={setConfirmResetOpen}
        title="Reset circuit?"
        description="All gates and changes will be cleared from the canvas."
        confirmLabel="Reset"
        destructive
        onConfirm={resetCircuit}
      />
    </div>
  );
}

/** @deprecated Use MultiLanguageCodePanel */
export const QiskitCodePanel = MultiLanguageCodePanel;

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
