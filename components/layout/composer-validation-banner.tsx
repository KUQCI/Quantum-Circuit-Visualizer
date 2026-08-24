"use client";

import { AlertTriangle } from "lucide-react";
import { useCircuitStore } from "@/store/circuit-store";
import { useEditorUiStore } from "@/store/editor-ui-store";
import Link from "next/link";

/**
 * Visible strip for placement / translator validation warnings in Build mode.
 */
export function ComposerValidationBanner() {
  const validationWarnings = useCircuitStore((s) => s.validationWarnings);
  const showVizPanels = useEditorUiStore((s) => s.showVizPanels);
  const setShowVizPanels = useEditorUiStore((s) => s.setShowVizPanels);

  if (validationWarnings.length === 0) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex shrink-0 items-start gap-2 border-b border-[var(--color-warning)]/35 bg-[var(--color-warning-subtle)] px-3 py-2 text-sm text-[var(--color-warning)]"
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="font-medium">Circuit warnings</p>
        <ul className="mt-0.5 list-inside list-disc text-xs leading-relaxed sm:text-sm">
          {validationWarnings.map((w, i) => (
            <li key={i}>{w}</li>
          ))}
        </ul>
        <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
          Translator details:{" "}
          <Link
            href="/docs/debug"
            className="text-[var(--color-brand)] underline-offset-2 hover:underline"
          >
            Debug panel
          </Link>
          {!showVizPanels && (
            <>
              {" · "}
              <button
                type="button"
                className="text-[var(--color-brand)] underline-offset-2 hover:underline"
                onClick={() => setShowVizPanels(true)}
              >
                Show simulator panels
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
