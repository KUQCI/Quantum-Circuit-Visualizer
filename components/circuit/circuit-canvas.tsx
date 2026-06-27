"use client";

import { useCallback, useRef, useState } from "react";
import { useCircuitStore, createOperationFromGateType } from "@/store/circuit-store";
import { GateLibrary } from "@/components/gates/gate-library";
import { getGateByType, getGateColorByType } from "@/components/gates/gate-definitions";
import {
  COLUMN_WIDTH,
  WIRE_HEIGHT,
  WIRE_LABEL_WIDTH,
} from "@/components/gates/gate-definitions";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QiskitCodePanel } from "@/components/code/qiskit-code-panel";
import { formatParam, parseParamExpression } from "@/lib/translator-core";
import {
  Undo2,
  Redo2,
  Plus,
  Minus,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { VisualizationPanels } from "@/components/visualizations/visualization-panels";
import type { Operation } from "@/lib/circuit-schema";

function GateBlock({
  operation,
  isSelected,
  onSelect,
  onDelete,
  wireIndex,
  numWires,
}: {
  operation: Operation;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  wireIndex: number;
  numWires: number;
}) {
  const isControl = operation.controls.length > 0;
  const isTarget = operation.targets.some((t) => t === `q${wireIndex}`);
  const isControlQubit = operation.controls.some((c) => c === `q${wireIndex}`);
  const isBarrier = operation.type === "barrier";
  const isMeasure = operation.type === "measure";

  if (isBarrier) {
    if (wireIndex !== 0) return null;
    return (
      <div
        className="absolute inset-y-2 flex items-center"
        style={{
          left: operation.column * COLUMN_WIDTH + 8,
          width: 4,
          height: numWires * WIRE_HEIGHT - 16,
        }}
        onClick={onSelect}
      >
        <div
          className={cn(
            "h-full w-1 rounded-full bg-[var(--color-gate-barrier)]",
            isSelected && "ring-2 ring-[var(--color-ring)]"
          )}
        />
      </div>
    );
  }

  if (isControl && !isControlQubit && !isTarget) return null;

  const paramDisplay = operation.parameters?.[0]?.display;

  return (
    <div
      className="absolute flex items-center justify-center"
      style={{
        left: operation.column * COLUMN_WIDTH + 12,
        top: wireIndex * WIRE_HEIGHT + WIRE_HEIGHT / 2 - 18,
        width: 36,
        height: 36,
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      {isControl && isControlQubit && operation.targets.length > 0 && (
        <div
          className="absolute w-0.5 bg-[var(--color-gate-two)]"
          style={{
            height:
              Math.abs(
                parseInt(operation.targets[0].replace("q", ""), 10) -
                  parseInt(operation.controls[0].replace("q", ""), 10)
              ) * WIRE_HEIGHT,
            top:
              parseInt(operation.controls[0].replace("q", ""), 10) <
              parseInt(operation.targets[0].replace("q", ""), 10)
                ? 18
                : -Math.abs(
                    parseInt(operation.targets[0].replace("q", ""), 10) -
                      parseInt(operation.controls[0].replace("q", ""), 10)
                  ) *
                    WIRE_HEIGHT +
                  18,
          }}
        />
      )}
      {(isTarget ||
        (!isControl &&
          !["cx", "cz", "swap"].includes(operation.type))) && (
        <div
          className={cn(
            "relative flex h-9 w-9 flex-col items-center justify-center rounded border text-xs font-bold shadow-sm transition-all",
            getGateColorByType(operation.type),
            isSelected && "ring-2 ring-[var(--color-ring)] ring-offset-1 ring-offset-[var(--color-card)]",
            "cursor-pointer hover:brightness-110"
          )}
        >
          {operation.label}
          {paramDisplay && (
            <span className="absolute -bottom-4 text-[9px] font-normal text-[var(--color-muted-foreground)]">
              {paramDisplay}
            </span>
          )}
        </div>
      )}
      {isControlQubit && isControl && !isTarget && (
        <div className="h-3 w-3 rounded-full border-2 border-[var(--color-gate-two)] bg-[var(--color-card)]" />
      )}
      {isSelected && (
        <button
          className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <Trash2 className="h-2.5 w-2.5" />
        </button>
      )}
    </div>
  );
}

export function CircuitCanvas() {
  const {
    circuit,
    selectedOperationId,
    validationWarnings,
    setSelectedOperation,
    addOperation,
    removeOperation,
    updateOperation,
    addQubit,
    removeQubit,
    addClassicalBit,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useCircuitStore();

  const canvasRef = useRef<HTMLDivElement>(null);
  const [draggingGate, setDraggingGate] = useState<string | null>(null);
  const [editingParam, setEditingParam] = useState<string | null>(null);
  const [paramValue, setParamValue] = useState("");

  const numColumns = Math.max(
    8,
    ...circuit.operations.map((op) => op.column + 2)
  );

  const handleDrop = useCallback(
    (e: React.DragEvent, qubitIndex: number) => {
      e.preventDefault();
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = e.clientX - rect.left - WIRE_LABEL_WIDTH;
      const column = Math.max(0, Math.round(x / COLUMN_WIDTH));

      const gateType = e.dataTransfer.getData("gateType") || draggingGate;
      if (!gateType) return;

      const gateDef = getGateByType(gateType);
      if (!gateDef) return;

      if (gateType === "barrier") {
        addOperation(
          createOperationFromGateType(
            "barrier",
            circuit.qubits.map((q) => q.id),
            [],
            column
          )
        );
        return;
      }

      if (gateType === "measure") {
        if (circuit.classicalBits.length === 0) {
          addClassicalBit();
        }
        addOperation(
          createOperationFromGateType(
            "measure",
            [`q${qubitIndex}`],
            [],
            column,
            ["c0"]
          )
        );
        return;
      }

      if (gateDef.category === "two") {
        const controlIdx = qubitIndex;
        const targetIdx =
          qubitIndex + 1 < circuit.qubits.length
            ? qubitIndex + 1
            : qubitIndex - 1;
        if (targetIdx < 0 || targetIdx === controlIdx) return;
        addOperation(
          createOperationFromGateType(
            gateType,
            [`q${targetIdx}`],
            [`q${controlIdx}`],
            column,
            [],
            gateDef.defaultParams ? [gateDef.defaultParams] : undefined
          )
        );
        return;
      }

      addOperation(
        createOperationFromGateType(
          gateType,
          [`q${qubitIndex}`],
          [],
          column,
          [],
          gateDef.defaultParams ? [gateDef.defaultParams] : undefined
        )
      );
      setDraggingGate(null);
    },
    [circuit, addOperation, addClassicalBit, draggingGate]
  );

  const selectedOp = circuit.operations.find(
    (op) => op.id === selectedOperationId
  );

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-2">
        <div className="flex items-center gap-2">
          <Input
            value={circuit.name}
            onChange={(e) =>
              useCircuitStore.setState({
                circuit: { ...circuit, name: e.target.value },
              })
            }
            className="h-8 w-48 text-sm font-medium"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={undo}
            disabled={!canUndo()}
            title="Undo"
          >
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={redo}
            disabled={!canRedo()}
            title="Redo"
          >
            <Redo2 className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={addQubit}>
            <Plus className="h-3 w-3" /> Qubit
          </Button>
          <Button variant="outline" size="sm" onClick={addClassicalBit}>
            <Plus className="h-3 w-3" /> Classical
          </Button>
          {circuit.qubits.length > 1 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                removeQubit(`q${circuit.qubits.length - 1}`)
              }
            >
              <Minus className="h-3 w-3" /> Qubit
            </Button>
          )}
        </div>
      </div>

      {validationWarnings.length > 0 && (
        <div className="mx-4 mt-2 flex items-start gap-2 rounded border border-[var(--color-warning)]/40 bg-[var(--color-warning)]/10 px-3 py-2 text-xs text-[var(--color-warning)]">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <div>
            {validationWarnings.map((w, i) => (
              <div key={i}>{w}</div>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-auto p-4">
        <div
          ref={canvasRef}
          className="relative min-w-max rounded-lg border border-[var(--color-border)] bg-[var(--color-card)]"
          style={{
            width: WIRE_LABEL_WIDTH + numColumns * COLUMN_WIDTH + 40,
          }}
          onClick={() => setSelectedOperation(null)}
        >
          {Array.from({ length: numColumns }).map((_, col) => (
            <div
              key={col}
              className="absolute top-0 border-l border-dashed border-[var(--color-border)]/60"
              style={{
                left: WIRE_LABEL_WIDTH + col * COLUMN_WIDTH,
                height:
                  circuit.qubits.length * WIRE_HEIGHT +
                  (circuit.classicalBits.length > 0
                    ? circuit.classicalBits.length * WIRE_HEIGHT
                    : 0),
              }}
            />
          ))}

          {circuit.qubits.map((qubit, idx) => (
            <div
              key={qubit.id}
              className="relative flex items-center"
              style={{ height: WIRE_HEIGHT }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, idx)}
            >
              <div
                className="flex shrink-0 items-center justify-end pr-2 font-mono text-xs text-[var(--color-muted-foreground)]"
                style={{ width: WIRE_LABEL_WIDTH }}
              >
                {qubit.label}
              </div>
              <div className="relative flex-1">
                <div className="absolute left-0 right-0 top-1/2 h-px bg-[var(--color-border)]" />
              </div>
            </div>
          ))}

          {circuit.classicalBits.length > 0 && (
            <div className="border-t border-dashed border-[var(--color-border)]" />
          )}
          {circuit.classicalBits.map((bit) => (
            <div
              key={bit.id}
              className="relative flex items-center"
              style={{ height: WIRE_HEIGHT }}
            >
              <div
                className="flex shrink-0 items-center justify-end pr-2 font-mono text-xs text-[var(--color-muted-foreground)]"
                style={{ width: WIRE_LABEL_WIDTH }}
              >
                {bit.label}
              </div>
              <div className="relative flex-1">
                <div
                  className="absolute left-0 right-0 top-1/2 h-px border-t-2 border-double border-[var(--color-muted-foreground)]"
                />
              </div>
            </div>
          ))}

          {circuit.operations.map((op) => {
            const affectedWires = [
              ...op.targets.map((t) => parseInt(t.replace("q", ""), 10)),
              ...op.controls.map((c) => parseInt(c.replace("q", ""), 10)),
            ];
            if (op.type === "barrier") {
              return (
                <GateBlock
                  key={op.id}
                  operation={op}
                  isSelected={selectedOperationId === op.id}
                  onSelect={() => setSelectedOperation(op.id)}
                  onDelete={() => removeOperation(op.id)}
                  wireIndex={0}
                  numWires={circuit.qubits.length}
                />
              );
            }
            return affectedWires.map((wireIdx) => (
              <GateBlock
                key={`${op.id}-${wireIdx}`}
                operation={op}
                isSelected={selectedOperationId === op.id}
                onSelect={() => setSelectedOperation(op.id)}
                onDelete={() => removeOperation(op.id)}
                wireIndex={wireIdx}
                numWires={circuit.qubits.length}
              />
            ));
          })}
        </div>
      </div>

      {selectedOp && ["rx", "ry", "rz"].includes(selectedOp.type) && (
        <div className="border-t border-[var(--color-border)] px-4 py-3">
          <label className="text-xs font-medium text-[var(--color-muted-foreground)]">
            Rotation parameter (e.g. pi/2, 3*pi/4)
          </label>
          <div className="mt-1 flex gap-2">
            <Input
              value={
                editingParam === selectedOp.id
                  ? paramValue
                  : selectedOp.parameters?.[0]?.display ?? "pi/2"
              }
              onFocus={() => {
                setEditingParam(selectedOp.id);
                setParamValue(
                  selectedOp.parameters?.[0]?.display ?? "pi/2"
                );
              }}
              onChange={(e) => setParamValue(e.target.value)}
              onBlur={() => {
                if (editingParam === selectedOp.id) {
                  try {
                    const value = parseParamExpression(paramValue);
                    updateOperation(selectedOp.id, {
                      parameters: [{ value, display: formatParam(value) }],
                    });
                  } catch {
                    /* keep existing value */
                  }
                  setEditingParam(null);
                }
              }}
              className="h-8 w-40 font-mono text-sm"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export function EditorLayout() {
  const { circuit } = useCircuitStore();

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
      <aside className="w-52 shrink-0 overflow-y-auto border-r border-[var(--color-border)] bg-[var(--color-card)]">
        <GateLibrary onDragStart={() => {}} />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-[var(--color-surface)]">
        <div className="min-h-0 flex-1 overflow-hidden">
          <CircuitCanvas />
        </div>
        <VisualizationPanels circuit={circuit} />
      </div>
      <QiskitCodePanel />
    </div>
  );
}
