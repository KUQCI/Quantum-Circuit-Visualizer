"use client";

import { useEffect } from "react";
import { Pause, Play, SkipBack, SkipForward, StepBack, StepForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getMaxInspectStep } from "@/lib/circuit-layout";
import { circuitSignature } from "@/lib/step-explanations";
import { useCircuitStore } from "@/store/circuit-store";
import { useEditorUiStore } from "@/store/editor-ui-store";

export function StepTimeline() {
  const circuit = useCircuitStore((state) => state.circuit);
  const {
    inspectStep,
    inspectPlaying,
    setInspectPlaying,
    setInspectStep,
  } = useEditorUiStore();
  const maxStep = getMaxInspectStep(circuit.operations);
  const signature = circuitSignature(circuit);

  useEffect(() => {
    setInspectPlaying(false);
  }, [signature, setInspectPlaying]);

  useEffect(() => {
    if (!inspectPlaying) return;
    if (inspectStep >= maxStep) {
      setInspectPlaying(false);
      return;
    }

    const interval = window.setInterval(() => {
      const nextStep = useEditorUiStore.getState().inspectStep + 1;
      if (nextStep >= maxStep) {
        setInspectStep(maxStep);
        setInspectPlaying(false);
      } else {
        setInspectStep(nextStep);
      }
    }, 1200);

    return () => window.clearInterval(interval);
  }, [
    inspectPlaying,
    inspectStep,
    maxStep,
    setInspectPlaying,
    setInspectStep,
  ]);

  const chooseStep = (step: number) => {
    setInspectPlaying(false);
    setInspectStep(step);
  };

  return (
    <div className="space-y-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] p-2">
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          aria-label="Start at initial state"
          title="Start"
          onClick={() => chooseStep(0)}
        >
          <SkipBack className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          aria-label="Previous step"
          title="Previous"
          disabled={inspectStep <= 0}
          onClick={() => chooseStep(Math.max(0, inspectStep - 1))}
        >
          <StepBack className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          aria-label={inspectPlaying ? "Pause playback" : "Play steps"}
          title={inspectPlaying ? "Pause" : "Play"}
          disabled={maxStep === 0}
          onClick={() => {
            if (!inspectPlaying && inspectStep >= maxStep) setInspectStep(0);
            setInspectPlaying(!inspectPlaying);
          }}
        >
          {inspectPlaying ? (
            <Pause className="h-3.5 w-3.5" />
          ) : (
            <Play className="h-3.5 w-3.5" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          aria-label="Next step"
          title="Next"
          disabled={inspectStep >= maxStep}
          onClick={() => chooseStep(Math.min(maxStep, inspectStep + 1))}
        >
          <StepForward className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          aria-label="End at final step"
          title="End"
          onClick={() => chooseStep(maxStep)}
        >
          <SkipForward className="h-3.5 w-3.5" />
        </Button>
        <span className="ml-auto text-[10px] text-[var(--color-muted-foreground)]">
          {inspectStep}/{maxStep}
        </span>
      </div>
      <div className="flex gap-1 overflow-x-auto" role="list" aria-label="Circuit steps">
        {Array.from({ length: maxStep + 1 }, (_, step) => (
          <button
            key={step}
            type="button"
            role="listitem"
            aria-label={step === 0 ? "Initial state" : `Step ${step}`}
            aria-current={inspectStep === step ? "step" : undefined}
              className={`shrink-0 rounded px-2 py-1 text-[10px] ${
                inspectStep === step
                ? "bg-[var(--color-brand)] text-[var(--color-primary-foreground)]"
                : "bg-[var(--color-muted)] text-[var(--color-muted-foreground)]"
            }`}
            onClick={() => chooseStep(step)}
          >
            {step === 0 ? "0 (initial)" : step}
          </button>
        ))}
      </div>
    </div>
  );
}
