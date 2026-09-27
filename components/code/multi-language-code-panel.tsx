"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { CodeEditor, type CodeDiagnostic } from "@/components/code/code-editor";
import { CodePanelActions } from "@/components/code/code-panel";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useCodeSync } from "@/components/code/use-code-sync";
import { useCircuitStore, circuitHasContent } from "@/store/circuit-store";
import { useEditorUiStore } from "@/store/editor-ui-store";
import { CODE_LANGUAGES, type CodeLanguageId } from "@/lib/code-adapters";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Loader2,
  RefreshCw,
  RotateCcw,
} from "lucide-react";

export function MultiLanguageCodePanel({
  active = true,
  onExport,
  onCodeApplied,
}: {
  active?: boolean;
  onExport?: () => void;
  onCodeApplied?: () => void;
}) {
  const { resetCircuit, circuit } = useCircuitStore();
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const codePanelLanguage = useEditorUiStore((s) => s.codePanelLanguage);
  const setCodePanelLanguage = useEditorUiStore((s) => s.setCodePanelLanguage);
  const {
    code,
    parseError,
    warnings,
    exportWarnings,
    syncStatus,
    adapter,
    handleCodeChange,
    forceSyncFromCircuit,
    applyPending,
    discardPending,
    readOnly,
  } = useCodeSync(active, { onCodeApplied });

  const filename = `${circuit.name.replace(/\s+/g, "_").toLowerCase()}.${adapter.defaultFilename.split(".").pop()}`;
  const displayedWarnings =
    syncStatus === "partial" ? exportWarnings : warnings;
  const ignoredWarningCount = warnings.filter(
    (warning) =>
      !/^(?:Line \d+:\s*)?unbound parameter ".+" — bind a value before simulating$/.test(
        warning
      )
  ).length;
  const diagnostics = useMemo<CodeDiagnostic[]>(() => {
    const entries = [
      ...(parseError ? [{ message: parseError, severity: "error" as const }] : []),
      ...displayedWarnings.map((message) => ({
        message,
        severity: "warning" as const,
      })),
    ];
    return entries.flatMap(({ message, severity }) => {
      const match = /^Line (\d+):\s*(.*)$/.exec(message);
      return match
        ? [{ line: Number(match[1]), message: match[2], severity }]
        : [];
    });
  }, [displayedWarnings, parseError]);

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
        <div
          role="alert"
          className="mx-2 mt-1.5 flex items-start gap-1.5 rounded border border-[var(--color-destructive)]/40 bg-[var(--color-destructive)]/10 px-2 py-2 text-xs leading-relaxed text-[var(--color-destructive)] sm:text-sm"
        >
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          <span>{parseError}</span>
        </div>
      )}

      {displayedWarnings.length > 0 && (
        <div
          role="status"
          className="mx-2 mb-1.5 rounded border border-[var(--color-warning)]/40 bg-[var(--color-warning)]/10 px-2 py-2 text-xs text-[var(--color-warning)]"
        >
          <p className="font-medium">
            {syncStatus === "partial"
              ? "Export cannot represent every operation"
              : "Code warnings"}
          </p>
          <ul className="mt-1 space-y-0.5">
            {displayedWarnings.map((warning, index) => (
              <li key={`${warning}-${index}`}>{warning}</li>
            ))}
          </ul>
          {syncStatus === "blocked" && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Button
                variant="outline"
                size="sm"
                className="h-6 border-[var(--color-warning)]/50 px-2 text-[10px] text-[var(--color-warning)]"
                onClick={applyPending}
              >
                Apply anyway ({ignoredWarningCount} line
                {ignoredWarningCount === 1 ? "" : "s"} ignored)
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-[10px] text-[var(--color-warning)]"
                onClick={discardPending}
              >
                Revert to circuit
              </Button>
            </div>
          )}
        </div>
      )}

      <div className="code-editor-shell min-h-0 flex-1 p-2">
        <div className="h-full min-h-[120px]">
          <CodeEditor
            key={codePanelLanguage}
            value={code}
            onChange={handleCodeChange}
            readOnly={readOnly}
            language={adapter.monacoLanguage}
            completionProfile={codePanelLanguage}
            height="100%"
            diagnostics={diagnostics}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 border-t border-[var(--color-border)] p-2">
        <CodePanelActions
          code={code}
          filename={filename}
          onExport={onExport}
        />
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
  status: "synced" | "editing" | "error" | "blocked" | "partial";
  error: string | null;
}) {
  if (status === "editing") {
    return (
      <span className="flex items-center gap-1 text-[10px] text-[var(--color-muted-foreground)]">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span>Parsing…</span>
      </span>
    );
  }
  if (status === "error" || error) {
    return (
      <span className="flex items-center gap-1 text-[10px] text-[var(--color-destructive)]">
        <AlertCircle className="h-3 w-3" />
        <span>Error</span>
      </span>
    );
  }
  if (status === "blocked") {
    return (
      <span className="flex items-center gap-1 text-[10px] text-[var(--color-warning)]">
        <AlertTriangle className="h-3 w-3" />
        <span>Not applied</span>
      </span>
    );
  }
  if (status === "partial") {
    return (
      <span className="flex items-center gap-1 text-[10px] text-[var(--color-warning)]">
        <AlertTriangle className="h-3 w-3" />
        <span>Export incomplete</span>
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-[10px] text-[var(--color-muted-foreground)]">
      <CheckCircle2 className="h-3 w-3 text-[var(--color-success)]" />
      <span>Synced</span>
    </span>
  );
}
