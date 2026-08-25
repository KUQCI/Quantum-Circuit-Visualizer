"use client";

import { Suspense, useState } from "react";
import { ComposerToolbar } from "@/components/layout/composer-toolbar";
import { ComposerFooter } from "@/components/layout/composer-footer";
import { EditorBootstrap } from "@/components/layout/editor-bootstrap";
import { ComposerValidationBanner } from "@/components/layout/composer-validation-banner";
import {
  ComposerResizableWorkspace,
  ComposerCollapseButtons,
} from "@/components/layout/composer-resizable-workspace";
import { ComposerStatusBar } from "@/components/layout/composer-status-bar";
import { FeatureErrorBoundary } from "@/components/errors/FeatureErrorBoundary";

export function ComposerEditorLayout() {
  const [draggingGate, setDraggingGate] = useState<string | null>(null);
  const [selectedGate, setSelectedGate] = useState<string | null>(null);

  return (
    <div className="composer-shell flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-[var(--color-background)]">
      <Suspense fallback={null}>
        <EditorBootstrap />
      </Suspense>

      <ComposerToolbar />
      <ComposerValidationBanner />

      <FeatureErrorBoundary
        title="Build workspace error"
        description="The circuit editor hit an unexpected error. Your saved data may need repair."
        resetHref="/"
      >
        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
          <ComposerResizableWorkspace
            draggingGate={draggingGate}
            selectedGate={selectedGate}
            onGateSelect={setSelectedGate}
            onDragStart={setDraggingGate}
            onDragEnd={() => setDraggingGate(null)}
            onPlacementComplete={() => setSelectedGate(null)}
          />
          <ComposerCollapseButtons />
        </div>
      </FeatureErrorBoundary>

      <ComposerStatusBar />
      <ComposerFooter />
    </div>
  );
}
