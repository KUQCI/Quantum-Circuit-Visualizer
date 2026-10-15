"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCircuitStore } from "@/store/circuit-store";
import { useExecutionStore } from "@/store/execution-store";
import { useEditorUiStore } from "@/store/editor-ui-store";
import { getBackend } from "@/lib/backends";
import { NOISE_PRESETS, type NoiseModel } from "@/lib/noise-model";
import { MeasurementHistogram } from "@/components/visualizations/measurement-histogram";
import { cn } from "@/lib/utils";
import { Loader2, Play, ExternalLink, CheckCircle2, Cpu, Monitor } from "lucide-react";

interface RunCircuitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SHOT_PRESETS = [100, 1024, 8192] as const;

const NOISE_HINTS: Record<(typeof NOISE_PRESETS)[number]["id"], string> = {
  ideal: "Perfect qubits: you get the textbook answer.",
  light: "Small errors, like a well-tuned real device.",
  realistic: "Typical error rates on today's hardware.",
  noisy: "Lots of errors, so you can clearly see their effect.",
};

function matchesPreset(noise: NoiseModel, preset: NoiseModel): boolean {
  return (
    noise.enabled === preset.enabled &&
    noise.depolarizing1q === preset.depolarizing1q &&
    noise.depolarizing2q === preset.depolarizing2q &&
    noise.readoutError === preset.readoutError
  );
}

const segmentClass = (selected: boolean) =>
  cn(
    "inline-flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
    selected
      ? "bg-[var(--color-background)] text-[var(--color-brand)] shadow-sm"
      : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
  );

export function RunCircuitDialog({ open, onOpenChange }: RunCircuitDialogProps) {
  const circuit = useCircuitStore((s) => s.circuit);
  const {
    backendId,
    shots,
    noise,
    lastResult,
    isRunning,
    runError,
    setBackendId,
    setShots,
    setNoise,
    runCircuit,
  } = useExecutionStore();
  const { setShowVizPanels, setVizPanel } = useEditorUiStore();
  const [localShots, setLocalShots] = useState(String(shots));
  const [showAdvancedNoise, setShowAdvancedNoise] = useState(false);

  const sampler = getBackend("local-sampler");
  const isIbm = getBackend(backendId).requiresIbmApi;
  const activePreset = NOISE_PRESETS.find((p) => matchesPreset(noise, p.model));
  const noiseHint = activePreset ? NOISE_HINTS[activePreset.id] : "Custom error rates.";
  const topOutcomes = lastResult
    ? [...lastResult.histogram].sort((a, b) => b.count - a.count).slice(0, 4)
    : [];

  const handleRun = async () => {
    if (backendId !== "local-sampler") setBackendId("local-sampler");
    setShots(parseInt(localShots, 10) || sampler.defaultShots);
    const result = await runCircuit(circuit);
    if (result) {
      setLocalShots(String(result.shots));
      setShowVizPanels(true);
      setVizPanel("histogram", true);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        aria-busy={isRunning || undefined}
        className="gap-0 p-0"
      >
        <DialogHeader className="px-5 pb-3 pt-5">
          <DialogTitle>Run circuit</DialogTitle>
          <DialogDescription>
            Run <strong className="text-[var(--color-foreground)]">{circuit.name}</strong>{" "}
            many times and count how often each result comes out.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-5 pb-4">
          <div
            role="radiogroup"
            aria-label="Where to run"
            className="grid grid-cols-2 gap-1 rounded-lg bg-[var(--color-muted)] p-1"
          >
            <button
              type="button"
              role="radio"
              aria-checked={!isIbm}
              className={segmentClass(!isIbm)}
              onClick={() => setBackendId("local-sampler")}
            >
              <Monitor className="h-3.5 w-3.5" aria-hidden />
              Simulator
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={isIbm}
              className={segmentClass(isIbm)}
              onClick={() => setBackendId("ibm-hardware")}
            >
              <Cpu className="h-3.5 w-3.5" aria-hidden />
              IBM Quantum
            </button>
          </div>

          {isIbm ? (
            <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-muted)] p-3 text-sm text-[var(--color-muted-foreground)]">
              <p>
                Real IBM hardware runs on IBM Quantum Platform. Export your
                circuit as Qiskit Runtime code and run it with your IBM account.
              </p>
              <Link
                href="/docs/api"
                className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-[var(--color-brand)] hover:underline"
              >
                How to run on IBM
                <ExternalLink className="h-3 w-3" aria-hidden />
              </Link>
            </div>
          ) : (
            <>
              <div>
                <label
                  htmlFor="run-shots"
                  className="mb-1.5 block text-xs font-medium text-[var(--color-foreground)]"
                >
                  Shots{" "}
                  <span className="font-normal text-[var(--color-muted-foreground)]">
                    (how many times to run)
                  </span>
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    id="run-shots"
                    type="number"
                    min={1}
                    max={sampler.maxShots}
                    value={localShots}
                    onChange={(e) => setLocalShots(e.target.value)}
                    className="h-8 w-24"
                  />
                  {SHOT_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      className={cn(
                        "rounded-md border px-2 py-1 text-xs transition-colors",
                        localShots === String(preset)
                          ? "border-[var(--color-brand-border)] bg-[var(--color-brand-subtle)] text-[var(--color-brand)]"
                          : "border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
                      )}
                      onClick={() => setLocalShots(String(preset))}
                    >
                      {preset.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <p className="text-xs font-medium text-[var(--color-foreground)]">
                    Noise
                  </p>
                  <button
                    type="button"
                    className="text-xs text-[var(--color-brand)] hover:underline"
                    onClick={() => setShowAdvancedNoise((v) => !v)}
                    aria-expanded={showAdvancedNoise}
                  >
                    {showAdvancedNoise ? "Hide advanced" : "Advanced"}
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-1 rounded-lg bg-[var(--color-muted)] p-1">
                  {NOISE_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      aria-pressed={activePreset?.id === preset.id}
                      className={segmentClass(activePreset?.id === preset.id)}
                      onClick={() => setNoise(preset.model)}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
                <p className="mt-1.5 text-xs text-[var(--color-muted-foreground)]">
                  {noiseHint}
                </p>
                {showAdvancedNoise && (
                  <div className="mt-2 space-y-3 rounded-lg border border-[var(--color-border)] p-3">
                    {(
                      [
                        ["depolarizing1q", "1-qubit depolarizing", 0.1],
                        ["depolarizing2q", "2-qubit depolarizing", 0.2],
                        ["readoutError", "Readout error", 0.1],
                      ] as const
                    ).map(([key, label, max]) => (
                      <label key={key} className="block text-xs">
                        <span className="mb-1 flex justify-between gap-2 text-[var(--color-muted-foreground)]">
                          <span>{label}</span>
                          <span>{(noise[key] * 100).toFixed(1)}%</span>
                        </span>
                        <input
                          type="range"
                          min={0}
                          max={max}
                          step={0.001}
                          value={noise[key]}
                          onChange={(event) =>
                            setNoise({
                              ...noise,
                              enabled: true,
                              [key]: Number(event.target.value),
                            })
                          }
                          className="w-full accent-[var(--color-brand)]"
                        />
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {runError && (
                <p className="rounded-lg border border-[var(--color-destructive)]/40 p-2 text-xs text-[var(--color-destructive)]">
                  {runError}
                </p>
              )}

              {lastResult && !runError && (
                <div className="rounded-lg border border-[var(--color-border)] p-3">
                  <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-[var(--color-success-foreground)]">
                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                    Ran {lastResult.shots.toLocaleString()} shots
                  </div>
                  <ul className="mb-2 flex flex-wrap gap-1.5" aria-label="Most common results">
                    {topOutcomes.map((entry) => (
                      <li
                        key={entry.label}
                        className="rounded-md bg-[var(--color-muted)] px-2 py-1 text-xs text-[var(--color-foreground)]"
                      >
                        <span className="font-mono">{entry.label}</span>
                        <span className="ml-1.5 text-[var(--color-muted-foreground)]">
                          {entry.percentage.toFixed(1)}%
                        </span>
                      </li>
                    ))}
                  </ul>
                  <div className="h-44">
                    <MeasurementHistogram
                      histogram={lastResult.histogram}
                      shots={lastResult.shots}
                      registerLabel={lastResult.registerLabel}
                      noise={lastResult.noise}
                    />
                  </div>
                  <p className="mt-2 text-[11px] text-[var(--color-muted-foreground)]">
                    Also shown in the Measurement Results panel below the canvas.
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        <div className="sticky bottom-0 flex justify-end gap-2 border-t border-[var(--color-border)] bg-[var(--color-card)] px-5 py-3">
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {isIbm ? (
            <Button asChild size="sm">
              <Link href="/export">Export for IBM</Link>
            </Button>
          ) : (
            <Button size="sm" onClick={handleRun} disabled={isRunning}>
              {isRunning ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Play className="h-4 w-4" aria-hidden />
              )}
              {lastResult ? "Run again" : "Run"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
