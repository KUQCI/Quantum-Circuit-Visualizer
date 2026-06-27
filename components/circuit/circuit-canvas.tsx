"use client";

import { useCallback, useRef, useState } from "react";
import { useCircuitStore, createOperationFromGateType } from "@/store/circuit-store";
import {
  getGateByType,
  getGateColorByType,
  COLUMN_WIDTH,
  WIRE_HEIGHT,
  WIRE_LABEL_WIDTH,
  columnToX,
  qubitToY,
} from "@/components/gates/gate-definitions";
import { GateSymbol, GateTooltipContent } from "@/components/gates/gate-symbol";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatParam, parseParamExpression } from "@/lib/translator-core";
import {
  Undo2,
  Redo2,
  Plus,
  Minus,
  Trash2,
  AlertTriangle,
  AlignLeft,
  Info,
  Copy,
  Scissors,
} from "lucide-react";
import type { Operation } from "@/lib/circuit-schema";

interface DropPosition {
  column: number;
  qubitIndex: number;
}

interface CircuitCanvasProps {
  draggingGate?: string | null;
  onDragEnd?: () => void;
}

function resolveDropPosition(
  clientX: number,
  clientY: number,
  canvasEl: HTMLElement,
  numQubits: number
): DropPosition | null {
  const rect = canvasEl.getBoundingClientRect();
  const x = clientX - rect.left;
  const y = clientY - rect.top;

  if (x < WIRE_LABEL_WIDTH || y < 0 || y >= numQubits * WIRE_HEIGHT) {
    return null;
  }

  const column = Math.max(
    0,
    Math.floor((x - WIRE_LABEL_WIDTH + COLUMN_WIDTH / 2) / COLUMN_WIDTH)
  );
  const qubitIndex = Math.max(
    0,
    Math.min(numQubits - 1, Math.floor(y / WIRE_HEIGHT))
  );

  return { column, qubitIndex };
}

function GateBlock({
  operation,
  isSelected,
  onSelect,
  onDelete,
  wireIndex,
  numWires,
  isPaletteDragging,
}: {
  operation: Operation;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  wireIndex: number;
  numWires: number;
  isPaletteDragging: boolean;
}) {
  const gateDef = getGateByType(operation.type);
  const isControl = operation.controls.length > 0;
  const isTarget = operation.targets.some((t) => t === `q${wireIndex}`);
  const isControlQubit = operation.controls.some((c) => c === `q${wireIndex}`);
  const isBarrier = operation.type === "barrier";
  const isMeasure = operation.type === "measure";

  if (isBarrier) {
    if (wireIndex !== 0) return null;
    const block = (
      <div
        className={cn(
          "absolute inset-y-2 flex items-center",
          isPaletteDragging ? "pointer-events-none" : "cursor-pointer"
        )}
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

    if (!gateDef || isPaletteDragging) return block;

    return (
      <Tooltip>
        <TooltipTrigger asChild>{block}</TooltipTrigger>
        <TooltipContent side="top">
          <GateTooltipContent gate={gateDef} />
        </TooltipContent>
      </Tooltip>
    );
  }

  if (isControl && !isControlQubit && !isTarget) return null;

  const paramDisplay = operation.parameters?.[0]?.display;
  const displayLabel = gateDef?.label ?? operation.label;
  const boxClass = cn(
    "relative flex h-8 w-8 flex-col items-center justify-center rounded-sm text-[11px] font-bold shadow-md transition-all",
    getGateColorByType(operation.type),
    isSelected &&
      "ring-2 ring-[var(--color-ring)] ring-offset-1 ring-offset-[var(--color-canvas)]",
    !isPaletteDragging && "hover:brightness-110"
  );

  const renderGateBox = () => {
    if (isControlQubit && isControl && !isTarget) {
      return (
        <div className="h-3 w-3 rounded-full border-2 border-[var(--color-gate-two)] bg-[var(--color-card)]" />
      );
    }

    if (!isTarget) return null;

    if (operation.type === "cx") {
      return (
        <div className={cn(boxClass, "text-lg")}>⊕</div>
      );
    }
    if (operation.type === "cz") {
      return <div className={boxClass}>Z</div>;
    }
    if (operation.type === "swap" && gateDef) {
      return (
        <div className={boxClass}>
          <GateSymbol gate={gateDef} className="h-4 w-4" />
        </div>
      );
    }
    if (isMeasure && gateDef) {
      return (
        <div className={boxClass}>
          <GateSymbol gate={gateDef} className="h-4 w-4" />
        </div>
      );
    }

    return (
      <div className={boxClass}>
        {gateDef ? (
          <GateSymbol gate={gateDef} className="h-3.5 w-3.5" />
        ) : (
          displayLabel
        )}
        {paramDisplay && (
          <span className="absolute -bottom-4 text-[9px] font-normal text-[var(--color-muted-foreground)]">
            {paramDisplay}
          </span>
        )}
      </div>
    );
  };

  const gateBox = renderGateBox();
  if (!gateBox && !(isControl && isControlQubit && operation.targets.length > 0)) {
    return null;
  }

  const gateBody = (
    <div
      className={cn(
        "absolute flex items-center justify-center",
        isPaletteDragging ? "pointer-events-none" : "cursor-pointer"
      )}
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
      {gateBox}
    </div>
  );

  if (!gateDef || isPaletteDragging) return gateBody;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{gateBody}</TooltipTrigger>
      <TooltipContent side="top">
        <GateTooltipContent gate={gateDef} />
        {paramDisplay && (
          <div className="mt-1 text-[10px] text-[var(--color-muted-foreground)]">
            θ = {paramDisplay}
          </div>
        )}
      </TooltipContent>
    </Tooltip>
  );
}

function DropPreview({
  gateType,
  position,
  numQubits,
}: {
  gateType: string;
  position: DropPosition;
  numQubits: number;
}) {
  const gateDef = getGateByType(gateType);
  if (!gateDef) return null;

  const isTwoQubit = gateDef.category === "two";
  const controlIdx = position.qubitIndex;
  const targetIdx =
    position.qubitIndex + 1 < numQubits
      ? position.qubitIndex + 1
      : position.qubitIndex - 1;

  const previewStyle =
    "pointer-events-none absolute z-30 flex h-8 w-8 items-center justify-center rounded-sm border-2 border-dashed border-[var(--color-primary)] bg-[var(--color-primary)]/20 text-[11px] font-bold text-[var(--color-primary)]";

  if (gateDef.type === "barrier") {
    return (
      <div
        className="pointer-events-none absolute z-30 w-1 rounded-full border-2 border-dashed border-[var(--color-primary)] bg-[var(--color-primary)]/20"
        style={{
          left: columnToX(position.column) + 8,
          top: 8,
          height: numQubits * WIRE_HEIGHT - 16,
        }}
      />
    );
  }

  return (
    <>
      <div
        className={previewStyle}
        style={{
          left: columnToX(position.column) + 12,
          top: qubitToY(position.qubitIndex) + WIRE_HEIGHT / 2 - 16,
        }}
      >
        <GateSymbol gate={gateDef} className="h-3.5 w-3.5" />
      </div>
      {isTwoQubit && targetIdx >= 0 && targetIdx !== controlIdx && (
        <>
          <div
            className="pointer-events-none absolute z-30 w-0.5 bg-[var(--color-primary)]/60"
            style={{
              left: columnToX(position.column) + 28,
              top:
                Math.min(controlIdx, targetIdx) * WIRE_HEIGHT +
                WIRE_HEIGHT / 2,
              height: Math.abs(targetIdx - controlIdx) * WIRE_HEIGHT,
            }}
          />
          <div
            className={previewStyle}
            style={{
              left: columnToX(position.column) + 12,
              top: qubitToY(targetIdx) + WIRE_HEIGHT / 2 - 16,
            }}
          >
            {gateDef.type === "cx" ? (
              "⊕"
            ) : gateDef.type === "cz" ? (
              "Z"
            ) : (
              <GateSymbol gate={gateDef} className="h-3.5 w-3.5" />
            )}
          </div>
          <div
            className="pointer-events-none absolute z-30 h-3 w-3 rounded-full border-2 border-[var(--color-primary)] bg-[var(--color-primary)]/30"
            style={{
              left: columnToX(position.column) + 22,
              top: qubitToY(controlIdx) + WIRE_HEIGHT / 2 - 6,
            }}
          />
        </>
      )}
    </>
  );
}

function SelectedGateActionBar({
  operation,
  wireIndex,
  onDelete,
  onInspect,
}: {
  operation: Operation;
  wireIndex: number;
  onDelete: () => void;
  onInspect: () => void;
}) {
  const gateDef = getGateByType(operation.type);

  return (
    <div
      className="absolute z-40 flex items-center gap-0.5 rounded-md border border-[var(--color-border)] bg-[var(--color-card)] px-1 py-0.5 shadow-lg"
      style={{
        left: columnToX(operation.column) + 4,
        top: qubitToY(wireIndex) + WIRE_HEIGHT - 4,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        className="composer-toolbar-btn flex h-7 w-7 items-center justify-center rounded"
        title={gateDef?.fullName ?? operation.label}
        onClick={onInspect}
      >
        <Info className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        className="composer-toolbar-btn flex h-7 w-7 items-center justify-center rounded opacity-40"
        title="Copy (coming soon)"
        disabled
      >
        <Copy className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        className="composer-toolbar-btn flex h-7 w-7 items-center justify-center rounded opacity-40"
        title="Cut (coming soon)"
        disabled
      >
        <Scissors className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        className="composer-toolbar-btn flex h-7 w-7 items-center justify-center rounded text-red-400 hover:bg-red-500/10"
        title="Delete gate"
        onClick={onDelete}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function CircuitCanvas({
  draggingGate = null,
  onDragEnd,
}: CircuitCanvasProps) {
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const [dropPreview, setDropPreview] = useState<DropPosition | null>(null);
  const [inspectMode, setInspectMode] = useState(false);
  const [editingParam, setEditingParam] = useState<string | null>(null);
  const [paramValue, setParamValue] = useState("");

  const isPaletteDragging = draggingGate !== null;

  const numColumns = Math.max(
    8,
    ...circuit.operations.map((op) => op.column + 2)
  );

  const canvasHeight =
    circuit.qubits.length * WIRE_HEIGHT +
    (circuit.classicalBits.length > 0
      ? circuit.classicalBits.length * WIRE_HEIGHT + 4
      : 0);

  const placeGate = useCallback(
    (gateType: string, qubitIndex: number, column: number) => {
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
    },
    [circuit, addOperation, addClassicalBit]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";

      const gateType =
        e.dataTransfer.getData("gateType") || draggingGate || null;
      if (!gateType || !canvasRef.current) return;

      const pos = resolveDropPosition(
        e.clientX,
        e.clientY,
        canvasRef.current,
        circuit.qubits.length
      );
      setDropPreview(pos);
    },
    [draggingGate, circuit.qubits.length]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const gateType =
        e.dataTransfer.getData("gateType") || draggingGate || null;
      if (!gateType || !canvasRef.current) {
        setDropPreview(null);
        onDragEnd?.();
        return;
      }

      const pos = resolveDropPosition(
        e.clientX,
        e.clientY,
        canvasRef.current,
        circuit.qubits.length
      );

      if (pos) {
        placeGate(gateType, pos.qubitIndex, pos.column);
      }

      setDropPreview(null);
      onDragEnd?.();
    },
    [draggingGate, circuit.qubits.length, placeGate, onDragEnd]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    const related = e.relatedTarget as Node | null;
    if (related && scrollRef.current?.contains(related)) return;
    setDropPreview(null);
  }, []);

  const selectedOp = circuit.operations.find(
    (op) => op.id === selectedOperationId
  );

  const selectedWireIndex = selectedOp
    ? Math.min(
        ...[
          ...selectedOp.targets.map((t) => parseInt(t.replace("q", ""), 10)),
          ...selectedOp.controls.map((c) => parseInt(c.replace("q", ""), 10)),
        ]
      )
    : 0;

  return (
    <TooltipProvider delayDuration={400}>
      <div className="flex h-full flex-col bg-[var(--color-canvas)]">
        <div className="flex h-9 shrink-0 items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-toolbar)] px-3">
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              className="composer-toolbar-btn flex h-7 w-7 items-center justify-center rounded"
              onClick={undo}
              disabled={!canUndo()}
              title="Undo"
            >
              <Undo2 className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              className="composer-toolbar-btn flex h-7 w-7 items-center justify-center rounded"
              onClick={redo}
              disabled={!canRedo()}
              title="Redo"
            >
              <Redo2 className="h-3.5 w-3.5" />
            </button>
            <div className="mx-1.5 h-4 w-px bg-[var(--color-border)]" />
            <button
              type="button"
              className="composer-toolbar-btn flex items-center gap-1 rounded px-2 py-1 text-xs"
              title="Left alignment"
            >
              <AlignLeft className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Left alignment</span>
            </button>
            <button
              type="button"
              className={cn(
                "composer-toolbar-btn flex items-center gap-1 rounded px-2 py-1 text-xs",
                inspectMode &&
                  "bg-[var(--color-secondary)] text-[var(--color-foreground)]"
              )}
              onClick={() => setInspectMode(!inspectMode)}
              title="Inspect"
            >
              <Info className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Inspect</span>
            </button>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 text-xs"
              onClick={addQubit}
            >
              <Plus className="h-3 w-3" /> Qubit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 text-xs"
              onClick={addClassicalBit}
            >
              <Plus className="h-3 w-3" /> Classical
            </Button>
            {circuit.qubits.length > 1 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 text-xs"
                onClick={() => removeQubit(`q${circuit.qubits.length - 1}`)}
              >
                <Minus className="h-3 w-3" />
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

        <div
          ref={scrollRef}
          className={cn(
            "relative flex-1 overflow-auto p-3",
            isPaletteDragging && "cursor-copy"
          )}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onDragLeave={handleDragLeave}
        >
          <div
            ref={canvasRef}
            className="relative min-w-max"
            style={{
              width: WIRE_LABEL_WIDTH + numColumns * COLUMN_WIDTH + 60,
              height: canvasHeight,
            }}
            onClick={() => setSelectedOperation(null)}
          >
            {Array.from({ length: numColumns }).map((_, col) => (
              <div
                key={col}
                className="absolute top-0 border-l border-dashed border-[var(--color-border)]/60"
                style={{
                  left: WIRE_LABEL_WIDTH + col * COLUMN_WIDTH,
                  height: circuit.qubits.length * WIRE_HEIGHT,
                }}
              />
            ))}

            {circuit.qubits.map((qubit, idx) => (
              <div
                key={qubit.id}
                className="relative flex items-center"
                style={{ height: WIRE_HEIGHT }}
              >
                <div
                  className="flex shrink-0 items-center justify-end pr-2 font-mono text-xs text-[var(--color-muted-foreground)]"
                  style={{ width: WIRE_LABEL_WIDTH }}
                >
                  {qubit.label}
                </div>
                <div className="relative flex-1 pr-8">
                  <div className="absolute left-0 right-0 top-1/2 h-px bg-[var(--color-muted-foreground)]/50" />
                  <div className="absolute right-0 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--color-muted-foreground)] bg-[var(--color-canvas)]">
                    <div className="h-2.5 w-2.5 rounded-full border border-[var(--color-muted-foreground)]" />
                  </div>
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
                  <div className="absolute left-0 right-0 top-1/2 h-px border-t-2 border-double border-[var(--color-muted-foreground)]" />
                </div>
              </div>
            ))}

            {isPaletteDragging && dropPreview && draggingGate && (
              <DropPreview
                gateType={draggingGate}
                position={dropPreview}
                numQubits={circuit.qubits.length}
              />
            )}

            {isPaletteDragging && (
              <div
                className="absolute inset-0 z-20"
                style={{ pointerEvents: "none" }}
                aria-hidden
              />
            )}

            <div
              className={cn(
                "absolute inset-0",
                isPaletteDragging && "pointer-events-none"
              )}
            >
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
                      isPaletteDragging={isPaletteDragging}
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
                    isPaletteDragging={isPaletteDragging}
                  />
                ));
              })}
            </div>

            {selectedOp && !isPaletteDragging && (
              <SelectedGateActionBar
                operation={selectedOp}
                wireIndex={selectedWireIndex}
                onDelete={() => removeOperation(selectedOp.id)}
                onInspect={() => setInspectMode(true)}
              />
            )}
          </div>
        </div>

        {inspectMode && selectedOp && (
          <div className="shrink-0 border-t border-[var(--color-border)] bg-[var(--color-toolbar)] px-3 py-2 text-xs text-[var(--color-muted-foreground)]">
            {(() => {
              const def = getGateByType(selectedOp.type);
              return (
                <>
                  <span className="font-medium text-[var(--color-foreground)]">
                    {def?.fullName ?? selectedOp.label}
                  </span>
                  {" · "}Column {selectedOp.column + 1}
                  {def && (
                    <>
                      {" · "}
                      <span className="font-mono">{def.qiskitExample}</span>
                    </>
                  )}
                  {selectedOp.parameters?.[0]?.display &&
                    ` · θ = ${selectedOp.parameters[0].display}`}
                  {def && (
                    <div className="mt-1 text-[var(--color-muted-foreground)]">
                      {def.description}
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}

        {selectedOp &&
          ["rx", "ry", "rz"].includes(selectedOp.type) &&
          !inspectMode && (
            <div className="border-t border-[var(--color-border)] px-4 py-3">
              <label className="text-xs font-medium text-[var(--color-muted-foreground)]">
                Rotation parameter (e.g. pi/2, 3*pi/4)
              </label>
              <div className="mt-1 flex gap-2">
                <Input
                  value={
                    editingParam === selectedOp.id
                      ? paramValue
                      : (selectedOp.parameters?.[0]?.display ?? "pi/2")
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
    </TooltipProvider>
  );
}
