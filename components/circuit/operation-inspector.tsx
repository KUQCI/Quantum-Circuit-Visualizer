"use client";

import { useEffect, useState } from "react";
import { useCircuitStore } from "@/store/circuit-store";
import { getGateByType } from "@/components/gates/gate-definitions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatParam, parseParamExpression } from "@/lib/translator-core";
import { Copy, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

function QubitSelect({
  label,
  value,
  options,
  onChange,
  exclude,
}: {
  label: string;
  value: string;
  options: { id: string; label: string }[];
  onChange: (id: string) => void;
  exclude?: string;
}) {
  return (
    <div>
      <label className="text-[10px] font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "mt-1 h-8 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-2 text-xs",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)]"
        )}
      >
        {options
          .filter((q) => q.id !== exclude)
          .map((q) => (
            <option key={q.id} value={q.id}>
              {q.label}
            </option>
          ))}
      </select>
    </div>
  );
}

export function OperationInspector() {
  const {
    circuit,
    selectedOperationId,
    validationWarnings,
    updateOperation,
    removeOperation,
    duplicateOperation,
  } = useCircuitStore();

  const selected = circuit.operations.find((op) => op.id === selectedOperationId);
  const [paramDraft, setParamDraft] = useState("");

  useEffect(() => {
    if (selected?.parameters?.[0]?.display) {
      setParamDraft(selected.parameters[0].display);
    } else if (selected && ["rx", "ry", "rz"].includes(selected.type)) {
      setParamDraft("pi/2");
    } else {
      setParamDraft("");
    }
  }, [selected?.id, selected?.parameters, selected?.type]);

  if (!selected) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-4 text-center text-xs text-[var(--color-muted-foreground)]">
        Select a gate on the canvas to inspect and edit its properties.
      </div>
    );
  }

  const gateDef = getGateByType(selected.type);
  const opWarnings = validationWarnings.filter((w) => w.includes(selected.id));

  const applyParam = () => {
    try {
      const value = parseParamExpression(paramDraft);
      updateOperation(selected.id, {
        parameters: [{ value, display: formatParam(value) }],
      });
    } catch {
      /* keep existing */
    }
  };

  const updateControlledGate = (controlId: string, targetId: string) => {
    if (controlId === targetId) return;
    updateOperation(selected.id, {
      controls: [controlId],
      targets: [targetId],
    });
  };

  const updateSwap = (aId: string, bId: string) => {
    if (aId === bId) return;
    const [a, b] = aId < bId ? [aId, bId] : [bId, aId];
    updateOperation(selected.id, {
      controls: [],
      targets: [a, b],
    });
  };

  const updateMeasure = (qubitId: string, classicalId: string) => {
    updateOperation(selected.id, {
      targets: [qubitId],
      classicalTargets: classicalId ? [classicalId] : [],
    });
  };

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[var(--color-surface)]">
      <div className="flex shrink-0 items-center justify-between border-b border-[var(--color-border)] px-3 py-2">
        <div>
          <h3 className="text-xs font-semibold text-[var(--color-foreground)]">
            Inspector
          </h3>
          <p className="text-[10px] text-[var(--color-muted-foreground)]">
            {gateDef?.fullName ?? selected.label}
          </p>
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            title="Duplicate gate"
            onClick={() => duplicateOperation(selected.id)}
          >
            <Copy className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-[var(--color-destructive)]"
            title="Delete gate"
            onClick={() => removeOperation(selected.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3 text-xs">
        <InspectorField label="Type" value={selected.type.toUpperCase()} />
        <InspectorField label="Column" value={String(selected.column + 1)} />

        {selected.type === "measure" && (
          <>
            <QubitSelect
              label="Qubit"
              value={selected.targets[0] ?? circuit.qubits[0]?.id ?? "q0"}
              options={circuit.qubits}
              onChange={(id) =>
                updateMeasure(
                  id,
                  selected.classicalTargets[0] ?? circuit.classicalBits[0]?.id ?? ""
                )
              }
            />
            {circuit.classicalBits.length > 0 && (
              <QubitSelect
                label="Classical bit"
                value={
                  selected.classicalTargets[0] ?? circuit.classicalBits[0]?.id ?? "c0"
                }
                options={circuit.classicalBits}
                onChange={(id) =>
                  updateMeasure(selected.targets[0] ?? "q0", id)
                }
              />
            )}
          </>
        )}

        {(selected.type === "cx" || selected.type === "cz") && (
          <>
            <QubitSelect
              label="Control"
              value={selected.controls[0] ?? "q0"}
              options={circuit.qubits}
              exclude={selected.targets[0]}
              onChange={(id) =>
                updateControlledGate(id, selected.targets[0] ?? "q1")
              }
            />
            <QubitSelect
              label="Target"
              value={selected.targets[0] ?? "q1"}
              options={circuit.qubits}
              exclude={selected.controls[0]}
              onChange={(id) =>
                updateControlledGate(selected.controls[0] ?? "q0", id)
              }
            />
          </>
        )}

        {selected.type === "swap" && selected.targets.length >= 2 && (
          <>
            <QubitSelect
              label="Qubit A"
              value={selected.targets[0]}
              options={circuit.qubits}
              exclude={selected.targets[1]}
              onChange={(id) => updateSwap(id, selected.targets[1])}
            />
            <QubitSelect
              label="Qubit B"
              value={selected.targets[1]}
              options={circuit.qubits}
              exclude={selected.targets[0]}
              onChange={(id) => updateSwap(selected.targets[0], id)}
            />
          </>
        )}

        {selected.type !== "measure" &&
          selected.type !== "cx" &&
          selected.type !== "cz" &&
          selected.type !== "swap" &&
          selected.type !== "barrier" &&
          selected.targets.length > 0 && (
            <QubitSelect
              label="Target qubit"
              value={selected.targets[0]}
              options={circuit.qubits}
              onChange={(id) => updateOperation(selected.id, { targets: [id] })}
            />
          )}

        {["rx", "ry", "rz"].includes(selected.type) && (
          <div>
            <label className="text-[10px] font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">
              Angle (e.g. pi/2, 1.57)
            </label>
            <div className="mt-1 flex gap-2">
              <Input
                value={paramDraft}
                onChange={(e) => setParamDraft(e.target.value)}
                onBlur={applyParam}
                onKeyDown={(e) => e.key === "Enter" && applyParam()}
                className="h-8 font-mono text-xs"
              />
            </div>
          </div>
        )}

        {opWarnings.length > 0 && (
          <div className="rounded border border-[var(--color-warning)]/40 bg-[var(--color-warning)]/10 p-2 text-[10px] text-[var(--color-warning)]">
            {opWarnings.map((w, i) => (
              <div key={i}>{w}</div>
            ))}
          </div>
        )}

        {gateDef && (
          <p className="text-[10px] leading-relaxed text-[var(--color-muted-foreground)]">
            {gateDef.description}
          </p>
        )}
      </div>
    </div>
  );
}

function InspectorField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-[10px] font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">
        {label}
      </span>
      <p className="mt-0.5 font-mono text-[var(--color-foreground)]">{value}</p>
    </div>
  );
}
