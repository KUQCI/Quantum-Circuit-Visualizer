"use client";

import { Button } from "@/components/ui/button";
import { getWalkthrough } from "@/lib/learning/walkthroughs";
import { useEditorUiStore } from "@/store/editor-ui-store";

export function WalkthroughPanel() {
  const activeId = useEditorUiStore((state) => state.activeWalkthroughId);
  const inspectStep = useEditorUiStore((state) => state.inspectStep);
  const setActiveWalkthroughId = useEditorUiStore(
    (state) => state.setActiveWalkthroughId
  );
  const setInspectMode = useEditorUiStore((state) => state.setInspectMode);
  const walkthrough = getWalkthrough(activeId);

  if (!walkthrough) return null;

  return (
    <div className="space-y-2 rounded-lg border border-[var(--color-brand-border)] bg-[var(--color-brand-subtle)] p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-brand)]">
            Guided walkthrough
          </p>
          <h4 className="mt-1 text-sm font-semibold text-[var(--color-foreground)]">
            {walkthrough.title}
          </h4>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-[10px]"
          onClick={() => {
            setActiveWalkthroughId(null);
            setInspectMode(false);
          }}
        >
          Exit walkthrough
        </Button>
      </div>
      <div className="space-y-1">
        {walkthrough.steps.map((step, index) => (
          <div
            key={step.title}
            className={`rounded border p-2 text-[11px] ${
              inspectStep === index
                ? "border-[var(--color-brand)] bg-[var(--color-background)]"
                : "border-transparent"
            }`}
          >
            <p className="font-medium text-[var(--color-foreground)]">
              {index}. {step.title}
            </p>
            <p className="mt-0.5 text-[var(--color-muted-foreground)]">
              {step.text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
