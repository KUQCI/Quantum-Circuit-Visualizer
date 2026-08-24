"use client";

import { ExternalAnchor, QCI_HOME_URL, QCI_RD_URL } from "@/components/navigation/ExternalAnchor";
import { ExternalLink } from "lucide-react";

/** Site footer for content pages — links back to the main QCI ecosystem. */
export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-[var(--color-border)] bg-[var(--color-surface)]/60">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-end sm:justify-between sm:px-6">
        <div className="max-w-md space-y-2">
          <p className="mono-label text-[0.65rem] text-[var(--color-brand)]">
            QCI R&amp;D
          </p>
          <p className="text-sm leading-relaxed text-[var(--color-muted-foreground)]">
            A Khalifa University Quantum Computing Initiative R&amp;D project.
          </p>
          <p className="text-xs text-[var(--color-muted-foreground)]/80">
            Circuit Visualizer v1.0 · Deployed on GitHub Pages
          </p>
        </div>
        <div className="flex flex-wrap gap-4 text-sm">
          <ExternalAnchor
            href={QCI_HOME_URL}
            className="inline-flex items-center gap-1.5 font-medium text-[var(--color-brand)] transition-colors hover:text-[var(--color-gold-duck)]"
          >
            Back to QCI
            <ExternalLink className="h-3.5 w-3.5" />
          </ExternalAnchor>
          <ExternalAnchor
            href={QCI_RD_URL}
            className="inline-flex items-center gap-1.5 text-[var(--color-muted-foreground)] transition-colors hover:text-[var(--color-foreground)]"
          >
            View R&amp;D Projects
            <ExternalLink className="h-3.5 w-3.5" />
          </ExternalAnchor>
        </div>
      </div>
    </footer>
  );
}
