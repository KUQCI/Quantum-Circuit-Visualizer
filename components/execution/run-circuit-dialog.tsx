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
import { BACKENDS } from "@/lib/backends";
import { NOISE_PRESETS } from "@/lib/noise-model";
import { MeasurementHistogram } from "@/components/visualizations/measurement-histogram";
import { cn } from "@/lib/utils";
import { Loader2, Play, ExternalLink, CheckCircle2 } from "lucide-react";

interface RunCircuitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

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

  const selectedBackend = BACKENDS.find((b) => b.id === backendId)!;

  const handleRun = async () => {
    setShots(parseInt(localShots, 10) || selectedBackend.defaultShots);
    const result = await runCircuit(circuit);
    if (result) {
      setShowVizPanels(true);
      setVizPanel("histogram", true);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Set up and run</DialogTitle>
          <DialogDescription>
            Execute <strong>{circuit.name}</strong> on a simulator backend and
            view measurement histograms.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="mb-2 text-xs font-medium text-[var(--color-muted-foreground)]">
              Backend
            </p>
            <div className="space-y-2">
              {BACKENDS.map((backend) => (
                <button
                  key={backend.id}
                  type="button"
                  className={cn(
                    "w-full rounded-xl border p-3 text-left transition-colors",
                    backendId === backend.id
                      ? "border-[var(--color-brand-border)] bg-[var(--color-brand-subtle)]"
                      : "border-[var(--color-border)] hover:border-[var(--color-border-strong)]"
                  )}
                  onClick={() => setBackendId(backend.id)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">{backend.name}</span>
                    {backend.requiresIbmApi && (
                      <span className="rounded-full bg-[var(--color-secondary)] px-2 py-0.5 text-[10px] text-[var(--color-muted-foreground)]">
                        IBM API
                      </span>
                    )}
                    {backend.local && !backend.requiresIbmApi && (
                      <span className="rounded-full bg-[var(--color-success-subtle)] px-2 py-0.5 text-[10px] text-[var(--color-success-foreground)]">
                        Local
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
                    {backend.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {selectedBackend.local && !selectedBackend.requiresIbmApi && backendId === "local-sampler" && (
            <div>
              <label
                htmlFor="run-shots"
                className="mb-1 block text-xs font-medium text-[var(--color-muted-foreground)]"
              >
                Shots
              </label>
              <Input
                id="run-shots"
                type="number"
                min={1}
                max={selectedBackend.maxShots}
                value={localShots}
                onChange={(e) => setLocalShots(e.target.value)}
                className="h-9"
              />
              <p className="mt-1 text-[10px] text-[var(--color-muted-foreground)]">
                1 – {selectedBackend.maxShots.toLocaleString()} shots
              </p>
            </div>
          )}

          {selectedBackend.local &&
            !selectedBackend.requiresIbmApi &&
            backendId === "local-sampler" && (
              <div>
                <p className="mb-2 text-xs font-medium text-[var(--color-muted-foreground)]">
                  Noise
                </p>
                <div className="grid grid-cols-4 gap-1 rounded-lg bg-[var(--color-muted)] p-1">
                  {NOISE_PRESETS.map((preset) => {
                    const selected =
                      noise.enabled === preset.model.enabled &&
                      noise.depolarizing1q === preset.model.depolarizing1q &&
                      noise.depolarizing2q === preset.model.depolarizing2q &&
                      noise.readoutError === preset.model.readoutError;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        className={cn(
                          "rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
                          selected
                            ? "bg-[var(--color-background)] text-[var(--color-brand)] shadow-sm"
                            : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
                        )}
                        onClick={() => setNoise(preset.model)}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  className="mt-2 text-xs font-medium text-[var(--color-brand)] hover:underline"
                  onClick={() => setShowAdvancedNoise((open) => !open)}
                  aria-expanded={showAdvancedNoise}
                >
                  {showAdvancedNoise ? "Hide advanced" : "Advanced"}
                </button>
                {showAdvancedNoise && (
                  <div className="mt-3 space-y-3 rounded-lg border border-[var(--color-border)] p-3">
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
            )}

          {selectedBackend.requiresIbmApi && (
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-muted)] p-3 text-sm">
              <p className="text-[var(--color-muted-foreground)]">
                IBM backends run on IBM Quantum Platform. Export your circuit as
                Qiskit Runtime code and submit with your API token.
              </p>
              <Button asChild variant="outline" size="sm" className="mt-3">
                <Link href="/docs/api">
                  IBM API docs
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          )}

          {backendId === "local-statevector" && (
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-muted)] p-3 text-sm">
              <p className="text-[var(--color-muted-foreground)]">
                Statevector preview is already live in the bottom panels. Edit
                your circuit to see Probabilities, Q-sphere, and Statevector
                update in real time — no shots required.
              </p>
            </div>
          )}

          {runError && (
            <p className="text-xs text-[var(--color-destructive)]">{runError}</p>
          )}

          {lastResult && !runError && (
            <div className="rounded-xl border border-[var(--color-border)] p-3">
              <div className="mb-2 flex items-center gap-2 text-xs text-[var(--color-success-foreground)]">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Completed in {lastResult.executionTimeMs.toFixed(0)} ms
              </div>
              <div className="max-h-48 overflow-auto">
                <MeasurementHistogram
                  histogram={lastResult.histogram}
                  shots={lastResult.shots}
                  registerLabel={lastResult.registerLabel}
                  noise={lastResult.noise}
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            {selectedBackend.requiresIbmApi ? (
              <Button asChild>
                <Link href="/export">Export for IBM</Link>
              </Button>
            ) : backendId === "local-sampler" ? (
              <Button onClick={handleRun} disabled={isRunning}>
                {isRunning ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                Run circuit
              </Button>
            ) : backendId === "local-statevector" ? (
              <Button onClick={() => onOpenChange(false)}>Done</Button>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
