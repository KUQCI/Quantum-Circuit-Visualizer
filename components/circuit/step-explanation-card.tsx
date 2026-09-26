"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  computeStepSnapshots,
  explainStep,
  formatPhaseForExplanation,
} from "@/lib/step-explanations";
import { useCircuitStore } from "@/store/circuit-store";
import { useEditorUiStore } from "@/store/editor-ui-store";
import { QuantaMessage } from "@/components/mascot/QuantaMessage";

const HINTS: Record<string, string> = {
  h: "Superposition gives the next gates more possibilities to work with.",
  cx: "A controlled gate can turn superposition into entanglement.",
  z: "A phase change may be invisible in probabilities until interference reveals it.",
  swap: "Track both wires: SWAP moves their complete quantum states.",
  measure: "Measurement turns a quantum possibility into a classical outcome.",
  default: "Compare the before and after columns to see what this step changed.",
};

function amplitudeText(amplitude: { re: number; im: number }): string {
  if (Math.abs(amplitude.im) < 1e-9) return amplitude.re.toFixed(2);
  return `${amplitude.re.toFixed(2)} ${amplitude.im < 0 ? "-" : "+"} ${Math.abs(
    amplitude.im
  ).toFixed(2)}i`;
}

export function StepExplanationCard() {
  const circuit = useCircuitStore((state) => state.circuit);
  const setSelectedOperation = useCircuitStore(
    (state) => state.setSelectedOperation
  );
  const inspectStep = useEditorUiStore((state) => state.inspectStep);
  const snapshots = useMemo(
    () => computeStepSnapshots(circuit),
    [circuit]
  );
  const snapshot = snapshots[Math.min(inspectStep, snapshots.length - 1)];
  const explanation = useMemo(
    () => explainStep(snapshot, circuit),
    [snapshot, circuit]
  );
  const hintType = snapshot.layer[0]?.type ?? "default";
  const hint = HINTS[hintType] ?? HINTS.default;

  return (
    <div className="space-y-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] p-3">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
          Step explanation
        </p>
        <h4 className="mt-1 text-sm font-semibold text-[var(--color-foreground)]">
          {explanation.title}
        </h4>
      </div>

      {snapshot.step === 0 && (
        <div className="rounded border border-[var(--color-border)] p-2 text-[11px]">
          <p className="font-medium text-[var(--color-foreground)]">
            Initial state |{"0".repeat(circuit.qubits.length)}⟩
          </p>
          <p className="mt-1 font-mono text-[var(--color-muted-foreground)]">
            {snapshot.after.amplitudes
              .map((amplitude, index) => {
                const label =
                  snapshot.after.probabilities[index]?.label ?? `|${index}⟩`;
                return `${label}: ${amplitudeText(amplitude)}`;
              })
              .join(" · ")}
          </p>
        </div>
      )}

      {explanation.gateSummaries.length > 0 && (
        <section>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
            Gates in this step
          </p>
          <div className="space-y-1">
            {explanation.gateSummaries.map((summary) => (
              <button
                key={summary.opId}
                type="button"
                className="block w-full rounded border border-transparent px-2 py-1 text-left text-[11px] text-[var(--color-muted-foreground)] hover:border-[var(--color-brand-border)] hover:bg-[var(--color-brand-subtle)]"
                onClick={() => setSelectedOperation(summary.opId)}
              >
                <span className="font-medium text-[var(--color-foreground)]">
                  {summary.type.toUpperCase()}
                </span>{" "}
                {summary.text.slice(summary.type.length + 1)}
              </button>
            ))}
          </div>
        </section>
      )}

      <section>
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
          Computed
        </p>
        <ul className="space-y-1 text-[11px] text-[var(--color-muted-foreground)]">
          {explanation.computed.map((sentence) => (
            <li key={sentence}>• {sentence}</li>
          ))}
        </ul>
      </section>

      <div className="overflow-x-auto rounded border border-[var(--color-border)]">
        <table className="w-full text-[10px]">
          <thead className="bg-[var(--color-muted)] text-left text-[var(--color-muted-foreground)]">
            <tr>
              <th className="px-2 py-1">State</th>
              <th className="px-2 py-1">Prob. before</th>
              <th className="px-2 py-1">Prob. after</th>
              <th className="px-2 py-1">Phase before</th>
              <th className="px-2 py-1">Phase after</th>
            </tr>
          </thead>
          <tbody>
            {explanation.changes.map((change) => {
              const changed =
                Math.abs(change.afterProb - change.beforeProb) > 1e-9 ||
                Math.abs(change.afterPhase - change.beforePhase) > 1e-9;
              return (
                <tr
                  key={change.label}
                  className={cn(
                    "border-t border-[var(--color-border)]",
                    changed && "bg-[var(--color-brand-subtle)]"
                  )}
                >
                  <td className="px-2 py-1 font-mono">{change.label}</td>
                  <td className="px-2 py-1">{Math.round(change.beforeProb * 100)}%</td>
                  <td className="px-2 py-1">{Math.round(change.afterProb * 100)}%</td>
                  <td className="px-2 py-1">
                    {formatPhaseForExplanation(change.beforePhase)}
                  </td>
                  <td className="px-2 py-1">
                    {formatPhaseForExplanation(change.afterPhase)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <QuantaMessage message={hint} variant="hint" />
    </div>
  );
}
