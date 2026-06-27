"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useCircuitStore, createOperationFromGateType } from "@/store/circuit-store";
import { useEditorUiStore } from "@/store/editor-ui-store";
import {
  getGateByType,
  getGateColorByType,
  getQubitsNeeded,
  COLUMN_WIDTH,
  WIRE_HEIGHT,
  WIRE_LABEL_WIDTH,
  GATE_COLUMN_INSET,
  BARRIER_COLUMN_INSET,
  columnToX,
  qubitToY,
} from "@/components/gates/gate-definitions";
import { GateSymbol, GateTooltipContent } from "@/components/gates/gate-symbol";
import { PhaseDisk, getMarginalDiskForQubit, QubitStateTooltipContent } from "@/components/visualizations/phase-disk";
import { simulateCircuit } from "@/lib/quantum-state";
import {
  getExecutionLayers,
  getMaxInspectStep,
  getOperationsUpToStep,
} from "@/lib/circuit-layout";
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
  ChevronLeft,
  ChevronRight,
  ChevronsDown,
} from "lucide-react";
import type { Operation } from "@/lib/circuit-schema";

interface DropPosition {
  column: number;
  qubitIndex: number;
}

interface CircuitCanvasProps {
  draggingGate?: string | null;
  onDragEnd?: () => void;
  /** Tap-to-place: gate selected from palette, placed on canvas click */
  placementGate?: string | null;
  onPlacementComplete?: () => void;
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
  onMoveStart,
  isInspectLocked,
}: {
  operation: Operation;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  wireIndex: number;
  numWires: number;
  isPaletteDragging: boolean;
  onMoveStart?: () => void;
  isInspectLocked?: boolean;
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
          left: columnToX(operation.column) + BARRIER_COLUMN_INSET,
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
        isPaletteDragging || isInspectLocked
          ? "pointer-events-none"
          : "cursor-pointer"
      )}
      style={{
        left: columnToX(operation.column) + GATE_COLUMN_INSET,
        top: wireIndex * WIRE_HEIGHT + WIRE_HEIGHT / 2 - 18,
        width: 36,
        height: 36,
      }}
      draggable={isSelected && !isPaletteDragging && !isInspectLocked}
      onDragStart={(e) => {
        e.dataTransfer.setData("moveOperationId", operation.id);
        e.dataTransfer.effectAllowed = "move";
        onMoveStart?.();
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
          left: columnToX(position.column) + BARRIER_COLUMN_INSET,
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
          left: columnToX(position.column) + GATE_COLUMN_INSET,
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
              left: columnToX(position.column) + GATE_COLUMN_INSET + 16,
              top:
                Math.min(controlIdx, targetIdx) * WIRE_HEIGHT +
                WIRE_HEIGHT / 2,
              height: Math.abs(targetIdx - controlIdx) * WIRE_HEIGHT,
            }}
          />
          <div
            className={previewStyle}
            style={{
              left: columnToX(position.column) + GATE_COLUMN_INSET,
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
              left: columnToX(position.column) + GATE_COLUMN_INSET + 10,
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
  onCopy,
  onMoveStart,
  draggable,
}: {
  operation: Operation;
  wireIndex: number;
  onDelete: () => void;
  onInspect: () => void;
  onCopy: () => void;
  onMoveStart: () => void;
  draggable?: boolean;
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
        className="composer-toolbar-btn flex h-7 w-7 items-center justify-center rounded"
        title="Copy gate"
        onClick={onCopy}
      >
        <Copy className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        className="composer-toolbar-btn flex h-7 w-7 items-center justify-center rounded"
        title="Drag gate to move"
        onMouseDown={onMoveStart}
        draggable={draggable}
      >
        <ChevronsDown className="h-3.5 w-3.5 rotate-90" />
      </button>
      <button
        type="button"
        className="composer-toolbar-btn flex h-7 w-7 items-center justify-center rounded text-[var(--color-destructive)] hover:bg-[var(--color-error-subtle)]"
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
  placementGate = null,
  onPlacementComplete,
}: CircuitCanvasProps) {
  const {
    circuit,
    selectedOperationId,
    validationWarnings,
    clipboard,
    setSelectedOperation,
    addOperation,
    removeOperation,
    updateOperation,
    moveOperation,
    copyOperation,
    pasteOperation,
    alignOperationsLeft,
    addQubit,
    removeQubit,
    addClassicalBit,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useCircuitStore();

  const {
    alignmentMode,
    showPhaseDisks,
    inspectMode,
    inspectStep,
    setInspectMode,
    setInspectStep,
  } = useEditorUiStore();

  const canvasRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [dropPreview, setDropPreview] = useState<DropPosition | null>(null);
  const [movingOperationId, setMovingOperationId] = useState<string | null>(null);
  const [editingParam, setEditingParam] = useState<string | null>(null);
  const [paramValue, setParamValue] = useState("");

  const isPaletteDragging = draggingGate !== null;
  const isPlacementMode = placementGate !== null;
  const maxInspectStep = getMaxInspectStep(circuit.operations);
  const executionLayers = useMemo(
    () => getExecutionLayers(circuit.operations),
    [circuit.operations]
  );

  const inspectCircuit = useMemo(() => {
    if (!inspectMode) return circuit;
    if (inspectStep === 0) return { ...circuit, operations: [] };
    return {
      ...circuit,
      operations: getOperationsUpToStep(circuit.operations, inspectStep),
    };
  }, [circuit, inspectMode, inspectStep]);

  const phaseSim = useMemo(
    () => simulateCircuit(inspectCircuit),
    [inspectCircuit]
  );

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
      if (inspectMode) return;

      const gateDef = getGateByType(gateType);
      if (!gateDef) return;

      if (gateType === "control") return;

      if (gateType === "barrier") {
        addOperation(
          createOperationFromGateType(
            "barrier",
            circuit.qubits.map((q) => q.id),
            [],
            column
          )
        );
        if (alignmentMode !== "freeform") alignOperationsLeft();
        return;
      }

      if (gateType === "measure") {
        if (circuit.classicalBits.length === 0) addClassicalBit();
        addOperation(
          createOperationFromGateType(
            "measure",
            [`q${qubitIndex}`],
            [],
            column,
            [`c${Math.min(qubitIndex, circuit.classicalBits.length - 1)}`]
          )
        );
        if (alignmentMode !== "freeform") alignOperationsLeft();
        return;
      }

      if (gateType === "reset") {
        addOperation(
          createOperationFromGateType("reset", [`q${qubitIndex}`], [], column)
        );
        if (alignmentMode !== "freeform") alignOperationsLeft();
        return;
      }

      if (gateDef.category === "three") {
        const needed = getQubitsNeeded(gateDef);
        if (circuit.qubits.length < needed) return;
        const controls =
          gateType === "rc3x"
            ? [`q${qubitIndex}`, `q${qubitIndex + 1}`, `q${qubitIndex + 2}`]
            : [`q${qubitIndex}`, `q${qubitIndex + 1}`];
        const target = [`q${qubitIndex + needed - 1}`];
        addOperation(
          createOperationFromGateType(gateType, target, controls, column)
        );
        if (alignmentMode !== "freeform") alignOperationsLeft();
        return;
      }

      if (gateDef.category === "two") {
        const controlIdx = qubitIndex;
        const targetIdx =
          qubitIndex + 1 < circuit.qubits.length
            ? qubitIndex + 1
            : qubitIndex - 1;
        if (targetIdx < 0 || targetIdx === controlIdx) return;

        if (gateType === "swap") {
          addOperation(
            createOperationFromGateType(
              gateType,
              [`q${controlIdx}`, `q${targetIdx}`],
              [],
              column
            )
          );
        } else if (gateType === "rxx" || gateType === "rzz") {
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
        } else {
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
        }
        if (alignmentMode !== "freeform") alignOperationsLeft();
        return;
      }

      const params = gateDef.defaultParams3
        ? gateDef.defaultParams3
        : gateDef.defaultParams
          ? [gateDef.defaultParams]
          : undefined;

      addOperation(
        createOperationFromGateType(
          gateType,
          [`q${qubitIndex}`],
          [],
          column,
          [],
          params
        )
      );
      if (alignmentMode !== "freeform") alignOperationsLeft();
    },
    [circuit, addOperation, addClassicalBit, alignOperationsLeft, alignmentMode, inspectMode]
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

      const moveId =
        e.dataTransfer.getData("moveOperationId") || movingOperationId;
      const gateType =
        e.dataTransfer.getData("gateType") || draggingGate || null;

      if (!canvasRef.current) {
        setDropPreview(null);
        setMovingOperationId(null);
        onDragEnd?.();
        return;
      }

      const pos = resolveDropPosition(
        e.clientX,
        e.clientY,
        canvasRef.current,
        circuit.qubits.length
      );

      if (moveId && pos && !inspectMode) {
        moveOperation(moveId, pos.column);
        if (alignmentMode !== "freeform") alignOperationsLeft();
      } else if (gateType && pos && !inspectMode) {
        placeGate(gateType, pos.qubitIndex, pos.column);
      }

      setDropPreview(null);
      setMovingOperationId(null);
      onDragEnd?.();
    },
    [
      draggingGate,
      movingOperationId,
      circuit.qubits.length,
      placeGate,
      moveOperation,
      alignOperationsLeft,
      alignmentMode,
      inspectMode,
      onDragEnd,
    ]
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
              aria-label="Undo"
            >
              <Undo2 className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              className="composer-toolbar-btn flex h-7 w-7 items-center justify-center rounded"
              onClick={redo}
              disabled={!canRedo()}
              title="Redo"
              aria-label="Redo"
            >
              <Redo2 className="h-3.5 w-3.5" />
            </button>
            <div className="mx-1.5 h-4 w-px bg-[var(--color-border)]" />
            <button
              type="button"
              className="composer-toolbar-btn flex items-center gap-1 rounded px-2 py-1 text-xs"
              title="Compact columns (left alignment)"
              onClick={() => alignOperationsLeft()}
            >
              <AlignLeft className="h-3.5 w-3.5" />
              <span className="hidden sm:inline capitalize">{alignmentMode}</span>
            </button>
            <button
              type="button"
              className={cn(
                "composer-toolbar-btn flex items-center gap-1 rounded px-2 py-1 text-xs",
                inspectMode &&
                  "bg-[var(--color-secondary)] text-[var(--color-foreground)]"
              )}
              onClick={() => {
                if (!inspectMode && alignmentMode === "freeform") {
                  alignOperationsLeft();
                }
                setInspectMode(!inspectMode);
              }}
              aria-pressed={inspectMode}
              title="Inspect circuit step-by-step"
            >
              <Info className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Inspect</span>
            </button>
            {inspectMode && (
              <>
                <button
                  type="button"
                  className="composer-toolbar-btn flex h-7 w-7 items-center justify-center rounded"
                  disabled={inspectStep <= 0}
                  onClick={() => setInspectStep(inspectStep - 1)}
                  title="Previous layer"
                  aria-label="Previous inspect layer"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <span className="text-[10px] text-[var(--color-muted-foreground)]">
                  {inspectStep}/{maxInspectStep}
                </span>
                <button
                  type="button"
                  className="composer-toolbar-btn flex h-7 w-7 items-center justify-center rounded"
                  disabled={inspectStep >= maxInspectStep}
                  onClick={() => setInspectStep(inspectStep + 1)}
                  title="Next layer"
                  aria-label="Next inspect layer"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </>
            )}
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
            isPaletteDragging && "cursor-copy",
            isPlacementMode && "cursor-crosshair"
          )}
          onClick={(e) => {
            if (!placementGate || inspectMode || !canvasRef.current) return;
            const pos = resolveDropPosition(
              e.clientX,
              e.clientY,
              canvasRef.current,
              circuit.qubits.length
            );
            if (pos) {
              placeGate(placementGate, pos.qubitIndex, pos.column);
              onPlacementComplete?.();
            }
          }}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onDragLeave={handleDragLeave}
          onContextMenu={(e) => {
            if (!clipboard || inspectMode) return;
            e.preventDefault();
            const pos = canvasRef.current
              ? resolveDropPosition(
                  e.clientX,
                  e.clientY,
                  canvasRef.current,
                  circuit.qubits.length
                )
              : null;
            if (pos) pasteOperation(pos.column, pos.qubitIndex);
          }}
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
            <div
              className="pointer-events-none absolute top-0 z-10 border-r border-[var(--color-border)]"
              style={{
                left: WIRE_LABEL_WIDTH - 1,
                height: canvasHeight,
                width: 0,
              }}
              aria-hidden
            />

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

            {alignmentMode === "layers" &&
              executionLayers.map((layer, layerIdx) => (
                <div
                  key={layerIdx}
                  className="pointer-events-none absolute top-0 flex items-start justify-center pt-1 text-[9px] font-medium text-[var(--color-primary)]"
                  style={{
                    left: WIRE_LABEL_WIDTH + layerIdx * COLUMN_WIDTH,
                    width: COLUMN_WIDTH,
                    height: circuit.qubits.length * WIRE_HEIGHT,
                  }}
                >
                  {layerIdx + 1}
                </div>
              ))}

            {circuit.qubits.map((qubit, idx) => {
              const diskProps =
                showPhaseDisks && phaseSim.amplitudes.length > 0
                  ? getMarginalDiskForQubit(
                      phaseSim.amplitudes,
                      circuit.qubits.length,
                      idx
                    )
                  : null;

              return (
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
                  <div className="absolute right-0 top-1/2 flex -translate-y-1/2 items-center justify-center">
                    {showPhaseDisks && diskProps ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)]"
                            aria-label={`${qubit.label} state details`}
                          >
                            <PhaseDisk
                              amplitude={diskProps.amplitude}
                              purity={diskProps.purity}
                              size={20}
                            />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="left" className="max-w-xs p-3">
                          <QubitStateTooltipContent
                            amplitude={diskProps.amplitude}
                            purity={diskProps.purity}
                            label={qubit.label}
                          />
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <div className="flex h-5 w-5 items-center justify-center rounded-full border border-[var(--color-muted-foreground)] bg-[var(--color-canvas)]">
                        <div className="h-2.5 w-2.5 rounded-full border border-[var(--color-muted-foreground)]" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
            })}

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
                      isInspectLocked={inspectMode}
                      onMoveStart={() => setMovingOperationId(op.id)}
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
                    isInspectLocked={inspectMode}
                    onMoveStart={() => setMovingOperationId(op.id)}
                  />
                ));
              })}
            </div>

            {selectedOp && !isPaletteDragging && !inspectMode && (
              <SelectedGateActionBar
                operation={selectedOp}
                wireIndex={selectedWireIndex}
                onDelete={() => removeOperation(selectedOp.id)}
                onInspect={() => setInspectMode(true)}
                onCopy={() => copyOperation(selectedOp.id)}
                onMoveStart={() => setMovingOperationId(selectedOp.id)}
                draggable
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
          ["rx", "ry", "rz", "p"].includes(selectedOp.type) &&
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
