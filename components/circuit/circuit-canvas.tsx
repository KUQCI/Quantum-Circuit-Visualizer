"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  findPlacementConflict,
  primaryWireIndex,
} from "@/lib/circuit-edit";
import {
  getExecutionLayers,
  getMaxInspectStep,
  getOperationsUpToStep,
  predictLeftAlignedColumn,
} from "@/lib/circuit-layout";
import { showAppToast } from "@/lib/app-toast";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ManageRegistersDialog } from "@/components/circuit/manage-registers-dialog";
import { QuantaImage } from "@/components/mascot/QuantaImage";
import { useElementSize } from "@/lib/use-element-size";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  formatParam,
  isSymbolicExpression,
  parseParamExpression,
} from "@/lib/translator-core";
import { usePersistHydrated } from "@/lib/use-persist-hydrated";
import {
  Undo2,
  Redo2,
  Plus,
  Trash2,
  AlertTriangle,
  AlignLeft,
  Info,
  Copy,
  ChevronLeft,
  ChevronRight,
  ChevronsDown,
  Rows3,
} from "lucide-react";
import type { Circuit, Operation } from "@/lib/circuit-schema";
import { ParameterBindingsPanel } from "@/components/circuit/parameter-bindings-panel";

interface DropPosition {
  column: number;
  qubitIndex: number;
}

interface BoxSelection {
  pointerId: number;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  addToSelection: boolean;
  dragging: boolean;
}

interface CircuitCanvasProps {
  draggingGate?: string | null;
  onDragEnd?: () => void;
  /** Tap-to-place: gate selected from palette, placed on canvas click */
  placementGate?: string | null;
  onPlacementComplete?: () => void;
  canvasLabel?: string;
  variant?: "default" | "learning";
  readOnly?: boolean;
  circuitOverride?: Circuit;
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

function gatePlacementWires(
  gateType: string,
  qubitIndex: number,
  numQubits: number
): Pick<Operation, "targets" | "controls"> {
  const gateDef = getGateByType(gateType);
  if (!gateDef || gateType === "control") {
    return { targets: [], controls: [] };
  }

  if (gateType === "barrier") {
    return {
      targets: Array.from({ length: numQubits }, (_, index) => `q${index}`),
      controls: [],
    };
  }

  if (gateType === "measure" || gateType === "reset") {
    return { targets: [`q${qubitIndex}`], controls: [] };
  }

  if (gateDef.category === "three") {
    const needed = getQubitsNeeded(gateDef);
    if (numQubits < needed) return { targets: [], controls: [] };
    const baseIndex = Math.min(qubitIndex, numQubits - needed);
    const controls =
      gateType === "rc3x"
        ? [`q${baseIndex}`, `q${baseIndex + 1}`, `q${baseIndex + 2}`]
        : [`q${baseIndex}`, `q${baseIndex + 1}`];
    return { targets: [`q${baseIndex + needed - 1}`], controls };
  }

  if (gateDef.category === "two") {
    const controlIndex = qubitIndex;
    const targetIndex =
      qubitIndex + 1 < numQubits ? qubitIndex + 1 : qubitIndex - 1;
    if (targetIndex < 0 || targetIndex === controlIndex) {
      return { targets: [], controls: [] };
    }
    if (gateType === "swap") {
      return {
        targets: [`q${controlIndex}`, `q${targetIndex}`],
        controls: [],
      };
    }
    return {
      targets: [`q${targetIndex}`],
      controls: [`q${controlIndex}`],
    };
  }

  return { targets: [`q${qubitIndex}`], controls: [] };
}

function GateBlock({
  operation,
  isSelected,
  onSelect,
  wireIndex,
  numWires,
  isPaletteDragging,
  onMoveStart,
  isInspectLocked,
}: {
  operation: Operation;
  isSelected: boolean;
  onSelect: (event?: React.MouseEvent) => void;
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
  const paramDisplay = operation.parameters?.[0]?.display;
  const accessibleLabel = `${gateDef?.fullName ?? operation.label} on ${operation.targets.join(", ")}${
    operation.controls.length
      ? `, controlled by ${operation.controls.join(", ")}`
      : ""
  }${paramDisplay ? ` (${paramDisplay})` : ""}`;

  if (isBarrier) {
    if (wireIndex !== 0) return null;
    const block = (
      <div
        className={cn(
          "absolute inset-y-2 flex items-center",
          isPaletteDragging ? "pointer-events-none" : "cursor-pointer"
        )}
        role="button"
        tabIndex={0}
        aria-pressed={isSelected}
        aria-label={accessibleLabel}
        data-operation-id={operation.id}
        style={{
          left: columnToX(operation.column) + BARRIER_COLUMN_INSET,
          width: 4,
          height: numWires * WIRE_HEIGHT - 16,
        }}
        onClick={(event) => {
          event.stopPropagation();
          onSelect(event);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            e.stopPropagation();
            onSelect();
          }
        }}
      >
        <div
          className={cn(
            "h-full w-1 rounded-full bg-[var(--color-gate-barrier)]",
            isSelected && "ring-2 ring-[var(--color-gold-duck)]"
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

  const displayLabel = gateDef?.label ?? operation.label;
  const boxClass = cn(
    "relative flex h-8 w-8 flex-col items-center justify-center text-[11px] font-bold",
    getGateColorByType(operation.type),
    isSelected && "quanta-gate--selected",
    isPaletteDragging && "pointer-events-none"
  );

  const renderGateBox = () => {
    if (isControlQubit && isControl && !isTarget) {
      return (
        <div className="quanta-control-dot h-3 w-3" />
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
  const isFocusableGate = Boolean(
    gateBox && operation.targets[0] === `q${wireIndex}`
  );

  const gateBody = (
    <div
      className={cn(
        "absolute flex items-center justify-center",
        isPaletteDragging
          ? "pointer-events-none"
          : "cursor-pointer"
      )}
      role={isFocusableGate ? "button" : undefined}
      tabIndex={isFocusableGate ? 0 : undefined}
      aria-pressed={isFocusableGate ? isSelected : undefined}
      aria-label={isFocusableGate ? accessibleLabel : undefined}
      data-operation-id={operation.id}
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
        onSelect(e);
      }}
      onKeyDown={(e) => {
        if (isFocusableGate && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          e.stopPropagation();
          onSelect();
        }
      }}
    >
      {isControl && isControlQubit && operation.targets.length > 0 && (
        <div
          className="absolute w-0.5 rounded-full bg-[var(--color-gate-two)]"
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
  operations,
  alignmentMode,
}: {
  gateType: string;
  position: DropPosition;
  numQubits: number;
  operations: Operation[];
  alignmentMode: string;
}) {
  const gateDef = getGateByType(gateType);
  if (!gateDef) return null;

  const needed = getQubitsNeeded(gateDef);
  const hasInsufficientQubits =
    (gateDef.category === "two" || gateDef.category === "three") &&
    numQubits < needed;
  const placementWires = gatePlacementWires(
    gateType,
    position.qubitIndex,
    numQubits
  );
  const isConflict =
    !hasInsufficientQubits &&
    Boolean(
      findPlacementConflict(operations, {
        ...placementWires,
        column: position.column,
      })
    );
  const isInvalid = hasInsufficientQubits || isConflict;
  const candidate: Operation = {
    id: "__preview__",
    type: gateDef.type,
    label: gateDef.label,
    ...placementWires,
    classicalTargets: [],
    parameters: [],
    column: position.column,
  };
  const landingColumn =
    !isInvalid && alignmentMode !== "freeform"
      ? predictLeftAlignedColumn(operations, candidate)
      : position.column;
  const landingWireIndices = [
    ...new Set([...placementWires.targets, ...placementWires.controls]),
  ]
    .map((id) => parseInt(id.replace("q", ""), 10))
    .filter(Number.isInteger);
  const hasLandingGhost =
    !isInvalid &&
    alignmentMode !== "freeform" &&
    landingColumn !== position.column &&
    landingWireIndices.length > 0;

  const isTwoQubit = gateDef.category === "two";
  const wireIndex = (id: string | undefined) =>
    id ? parseInt(id.replace("q", ""), 10) : -1;
  const controlIdx =
    placementWires.controls.length > 0
      ? wireIndex(placementWires.controls[0])
      : wireIndex(placementWires.targets[0]);
  const targetIdx =
    placementWires.controls.length > 0
      ? wireIndex(placementWires.targets[0])
      : wireIndex(placementWires.targets[1]);

  const previewStyle = cn(
    "pointer-events-none absolute z-30 flex h-8 w-8 items-center justify-center rounded-lg border-2 border-dashed text-[11px] font-bold",
    isInvalid
      ? "border-[var(--color-destructive)] bg-[var(--color-destructive)]/20 text-[var(--color-destructive)]"
      : "border-[var(--color-cyan-quantum)] bg-[var(--color-cyan-quantum)]/20 text-[var(--color-cyan-quantum)]"
  );

  if (gateDef.type === "barrier") {
    return (
      <>
        {hasLandingGhost && (
          <>
            <div
              aria-hidden
              className="pointer-events-none absolute z-20 w-1 rounded-full border-2 border-dashed border-[var(--color-cyan-quantum)] bg-[var(--color-cyan-quantum)]/10 opacity-50"
              style={{
                left: columnToX(landingColumn) + BARRIER_COLUMN_INSET,
                top: 8,
                height: numQubits * WIRE_HEIGHT - 16,
              }}
            />
            <div
              className="pointer-events-none absolute z-40 rounded bg-[var(--color-cyan-quantum)] px-1.5 py-0.5 text-[9px] font-medium text-white"
              style={{
                left: columnToX(landingColumn) + GATE_COLUMN_INSET - 4,
                top: 4,
              }}
            >
              Lands here
            </div>
          </>
        )}
        <div
          className={cn(
            "pointer-events-none absolute z-30 w-1 rounded-full border-2 border-dashed",
            isInvalid
              ? "border-[var(--color-destructive)] bg-[var(--color-destructive)]/20"
              : "border-[var(--color-cyan-quantum)] bg-[var(--color-cyan-quantum)]/20"
          )}
          style={{
            left: columnToX(position.column) + BARRIER_COLUMN_INSET,
            top: 8,
            height: numQubits * WIRE_HEIGHT - 16,
          }}
        />
        {isConflict && (
          <div
            className="pointer-events-none absolute z-40 rounded bg-[var(--color-destructive)] px-1.5 py-0.5 text-[9px] font-medium text-white"
            style={{
              left: columnToX(position.column) + GATE_COLUMN_INSET - 4,
              top: 4,
            }}
          >
            Occupied
          </div>
        )}
      </>
    );
  }

  return (
    <>
      {hasLandingGhost && (
        <>
          {landingWireIndices.map((wire) => (
            <div
              key={`landing-${wire}`}
              aria-hidden
              className="pointer-events-none absolute z-20 h-8 w-8 rounded-lg border-2 border-dashed border-[var(--color-cyan-quantum)] bg-[var(--color-cyan-quantum)]/5 opacity-50"
              style={{
                left: columnToX(landingColumn) + GATE_COLUMN_INSET,
                top: qubitToY(wire) + WIRE_HEIGHT / 2 - 16,
              }}
            />
          ))}
          <div
            className="pointer-events-none absolute z-40 rounded bg-[var(--color-cyan-quantum)] px-1.5 py-0.5 text-[9px] font-medium text-white"
            style={{
              left: columnToX(landingColumn) + GATE_COLUMN_INSET - 4,
              top: Math.max(0, Math.min(...landingWireIndices) * WIRE_HEIGHT + 4),
            }}
          >
            Lands here
          </div>
        </>
      )}
      <div
        className={previewStyle}
        style={{
          left: columnToX(position.column) + GATE_COLUMN_INSET,
          top: qubitToY(position.qubitIndex) + WIRE_HEIGHT / 2 - 16,
        }}
      >
        <GateSymbol gate={gateDef} className="h-3.5 w-3.5" />
      </div>
      {isInvalid && (
        <div
          className="pointer-events-none absolute z-40 rounded bg-[var(--color-destructive)] px-1.5 py-0.5 text-[9px] font-medium text-white"
          style={{
            left: columnToX(position.column) + GATE_COLUMN_INSET - 4,
            top: qubitToY(position.qubitIndex) + 4,
          }}
        >
          {isConflict ? "Occupied" : `Need ${needed} qubits`}
        </div>
      )}
      {!isInvalid && isTwoQubit && targetIdx >= 0 && targetIdx !== controlIdx && (
        <>
          <div
            className="pointer-events-none absolute z-30 w-0.5 bg-[var(--color-cyan-quantum)]/60"
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
            className="pointer-events-none absolute z-30 h-3 w-3 rounded-full border-2 border-[var(--color-cyan-quantum)] bg-[var(--color-cyan-quantum)]/30"
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
      data-canvas-overlay
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
        title="Duplicate gate"
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
  canvasLabel = "Circuit canvas",
  variant = "default",
  readOnly = false,
  circuitOverride,
}: CircuitCanvasProps) {
  const {
    circuit: storeCircuit,
    selectedOperationId: storedSelectedOperationId,
    selectedOperationIds: storedSelectedOperationIds,
    validationWarnings,
    clipboard,
    setSelectedOperation,
    toggleOperationSelection,
    setOperationSelection,
    addOperation,
    addMeasureOperation,
    removeOperation,
    removeOperations,
    updateOperation,
    relocateOperation,
    moveOperations,
    duplicateOperation,
    copyOperation,
    pasteOperation,
    alignOperationsLeft,
    addQubit,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useCircuitStore();
  const circuit = circuitOverride ?? storeCircuit;
  const selectedOperationId = readOnly ? null : storedSelectedOperationId;
  const selectedOperationIds = useMemo(
    () => (readOnly ? [] : storedSelectedOperationIds),
    [readOnly, storedSelectedOperationIds]
  );
  const hydrated = usePersistHydrated(useCircuitStore.persist);

  const {
    alignmentMode,
    showPhaseDisks,
    inspectMode,
    inspectStep,
    setInspectMode,
    setInspectStep,
    setShowInspector,
  } = useEditorUiStore();

  const canvasRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [dropPreview, setDropPreview] = useState<DropPosition | null>(null);
  const [boxSelection, setBoxSelection] = useState<BoxSelection | null>(null);
  const boxSelectionRef = useRef<BoxSelection | null>(null);
  const suppressCanvasClick = useRef(false);
  const [movingOperationId, setMovingOperationId] = useState<string | null>(null);
  const [editingParam, setEditingParam] = useState<string | null>(null);
  const [paramValue, setParamValue] = useState("");
  const [registersOpen, setRegistersOpen] = useState(false);
  const { ref: canvasRootRef, size: canvasRootSize } =
    useElementSize<HTMLDivElement>();

  const isPaletteDragging = draggingGate !== null;
  const isPlacementMode = placementGate !== null;
  const maxInspectStep = getMaxInspectStep(circuit.operations);
  const executionLayers = useMemo(
    () => getExecutionLayers(circuit.operations),
    [circuit.operations]
  );
  const inspectLayers = useMemo(
    () =>
      getExecutionLayers(
        circuit.operations.filter((operation) => operation.type !== "barrier")
      ),
    [circuit.operations]
  );

  const selectOperationForInspect = (operationId: string) => {
    if (readOnly) return;
    setSelectedOperation(operationId);
    if (!inspectMode) return;
    const layerIndex = inspectLayers.findIndex((layer) =>
      layer.some((operation) => operation.id === operationId)
    );
    if (layerIndex >= 0) setInspectStep(layerIndex + 1);
  };

  const handleOperationSelect = (
    operationId: string,
    event?: React.MouseEvent
  ) => {
    if (readOnly) return;
    if (event?.shiftKey || event?.ctrlKey || event?.metaKey) {
      toggleOperationSelection(operationId);
    } else {
      selectOperationForInspect(operationId);
    }
  };

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
      if (inspectMode || readOnly) return null;

      const gateDef = getGateByType(gateType);
      if (!gateDef) return null;

      if (gateType === "control") return null;

      const placementWires = gatePlacementWires(
        gateType,
        qubitIndex,
        circuit.qubits.length
      );
      if (
        (gateDef.category === "two" || gateDef.category === "three") &&
        placementWires.targets.length === 0
      ) {
        return null;
      }

      let newOpId: string | null = null;

      if (gateType === "barrier") {
        newOpId = addOperation(
          createOperationFromGateType(
            "barrier",
            placementWires.targets,
            [],
            column
          )
        );
        if (newOpId && alignmentMode !== "freeform") {
          alignOperationsLeft({ mergeWithLastEntry: true });
        }
        return newOpId;
      }

      if (gateType === "measure") {
        newOpId = addMeasureOperation(placementWires.targets[0], column);
        if (newOpId && alignmentMode !== "freeform") {
          alignOperationsLeft({ mergeWithLastEntry: true });
        }
        return newOpId;
      }

      if (gateType === "reset") {
        newOpId = addOperation(
          createOperationFromGateType(
            "reset",
            placementWires.targets,
            [],
            column
          )
        );
        if (newOpId && alignmentMode !== "freeform") {
          alignOperationsLeft({ mergeWithLastEntry: true });
        }
        return newOpId;
      }

      if (gateDef.category === "three") {
        newOpId = addOperation(
          createOperationFromGateType(
            gateType,
            placementWires.targets,
            placementWires.controls,
            column
          )
        );
        if (newOpId && alignmentMode !== "freeform") {
          alignOperationsLeft({ mergeWithLastEntry: true });
        }
        return newOpId;
      }

      if (gateDef.category === "two") {
        if (gateType === "swap") {
          newOpId = addOperation(
            createOperationFromGateType(
              gateType,
              placementWires.targets,
              [],
              column
            )
          );
        } else if (gateType === "rxx" || gateType === "rzz") {
          newOpId = addOperation(
            createOperationFromGateType(
              gateType,
              placementWires.targets,
              placementWires.controls,
              column,
              [],
              gateDef.defaultParams ? [gateDef.defaultParams] : undefined
            )
          );
        } else {
          newOpId = addOperation(
            createOperationFromGateType(
              gateType,
              placementWires.targets,
              placementWires.controls,
              column,
              [],
              gateDef.defaultParams ? [gateDef.defaultParams] : undefined
            )
          );
        }
        if (newOpId && alignmentMode !== "freeform") {
          alignOperationsLeft({ mergeWithLastEntry: true });
        }
        if (newOpId) setShowInspector(true);
        return newOpId;
      }

      const params = gateDef.defaultParams3
        ? gateDef.defaultParams3
        : gateDef.defaultParams
          ? [gateDef.defaultParams]
          : undefined;

      newOpId = addOperation(
        createOperationFromGateType(
          gateType,
          placementWires.targets,
          placementWires.controls,
          column,
          [],
          params
        )
      );
      if (newOpId && alignmentMode !== "freeform") {
        alignOperationsLeft({ mergeWithLastEntry: true });
      }
      if (newOpId && ["rx", "ry", "rz"].includes(gateType)) {
        setShowInspector(true);
      }
      return newOpId;
    },
    [
      circuit,
      addOperation,
      addMeasureOperation,
      alignOperationsLeft,
      alignmentMode,
      inspectMode,
      readOnly,
      setShowInspector,
    ]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      if (readOnly) return;
      e.preventDefault();
      const isMoveDrag =
        movingOperationId !== null ||
        e.dataTransfer.types.includes("moveoperationid");
      e.dataTransfer.dropEffect = isMoveDrag ? "move" : "copy";

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
    [draggingGate, movingOperationId, circuit.qubits.length, readOnly]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      if (readOnly) return;
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
        const moved = relocateOperation(moveId, pos.column, pos.qubitIndex);
        if (moved && alignmentMode !== "freeform") {
          alignOperationsLeft({ mergeWithLastEntry: true });
        }
      } else if (gateType && pos && !inspectMode) {
        const newId = placeGate(gateType, pos.qubitIndex, pos.column);
        if (newId) setSelectedOperation(newId);
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
      relocateOperation,
      setSelectedOperation,
      alignOperationsLeft,
      alignmentMode,
      inspectMode,
      onDragEnd,
      readOnly,
    ]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    if (readOnly) return;
    const related = e.relatedTarget as Node | null;
    if (related && scrollRef.current?.contains(related)) return;
    setDropPreview(null);
  }, [readOnly]);

  const selectedOp = circuit.operations.find(
    (op) => op.id === selectedOperationId
  );

  const applySelectedParam = () => {
    if (!selectedOp) return;
    const display = paramValue.trim();
    if (!display) return;

    try {
      const value = parseParamExpression(display);
      updateOperation(selectedOp.id, {
        parameters: [{ value, display: formatParam(value) }],
      });
    } catch {
      if (isSymbolicExpression(display)) {
        updateOperation(selectedOp.id, {
          parameters: [{ value: 0, display, symbol: display }],
        });
      }
    }
  };

  const selectedWireIndex = selectedOp
    ? Math.min(
        ...[
          ...selectedOp.targets.map((t) => parseInt(t.replace("q", ""), 10)),
          ...selectedOp.controls.map((c) => parseInt(c.replace("q", ""), 10)),
        ]
      )
    : 0;
  const nextPasteColumn = circuit.operations.reduce(
    (nextColumn, operation) => Math.max(nextColumn, operation.column + 1),
    0
  );

  const handleCanvasPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (
      readOnly ||
      inspectMode ||
      isPaletteDragging ||
      isPlacementMode ||
      event.button !== 0 ||
      !(event.target instanceof Element) ||
      event.target.closest(
        "[data-operation-id], [data-canvas-overlay], button, [role=button]"
      )
    ) {
      return;
    }

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const startX = event.clientX - rect.left;
    const startY = event.clientY - rect.top;
    boxSelectionRef.current = {
      pointerId: event.pointerId,
      startX,
      startY,
      currentX: startX,
      currentY: startY,
      addToSelection: event.shiftKey,
      dragging: false,
    };
    suppressCanvasClick.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleCanvasPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const selection = boxSelectionRef.current;
    if (!selection || selection.pointerId !== event.pointerId) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const currentX = event.clientX - rect.left;
    const currentY = event.clientY - rect.top;
    const dragging =
      selection.dragging ||
      Math.hypot(currentX - selection.startX, currentY - selection.startY) > 4;
    const nextSelection = { ...selection, currentX, currentY, dragging };
    boxSelectionRef.current = nextSelection;
    if (dragging) setBoxSelection(nextSelection);
  };

  const handleCanvasPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const selection = boxSelectionRef.current;
    if (!selection || selection.pointerId !== event.pointerId) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    const currentX = rect ? event.clientX - rect.left : selection.currentX;
    const currentY = rect ? event.clientY - rect.top : selection.currentY;
    const dragging =
      selection.dragging ||
      Math.hypot(currentX - selection.startX, currentY - selection.startY) > 4;
    boxSelectionRef.current = null;
    setBoxSelection(null);
    if (!dragging) return;

    suppressCanvasClick.current = true;
    requestAnimationFrame(() => {
      suppressCanvasClick.current = false;
    });

    const left = Math.min(selection.startX, currentX);
    const right = Math.max(selection.startX, currentX);
    const top = Math.min(selection.startY, currentY);
    const bottom = Math.max(selection.startY, currentY);
    const intersects = (x: number, y: number, width: number, height: number) =>
      x <= right && x + width >= left && y <= bottom && y + height >= top;
    const selectedIds = circuit.operations
      .filter((operation) => {
        if (operation.type === "barrier") {
          return intersects(
            columnToX(operation.column) + BARRIER_COLUMN_INSET,
            8,
            4,
            Math.max(0, circuit.qubits.length * WIRE_HEIGHT - 16)
          );
        }

        const wires = [
          ...new Set(
            [...operation.targets, ...operation.controls]
              .map((wire) => parseInt(wire.replace("q", ""), 10))
              .filter(Number.isFinite)
          ),
        ];
        return wires.some((wireIndex) =>
          intersects(
            columnToX(operation.column) + GATE_COLUMN_INSET,
            wireIndex * WIRE_HEIGHT + WIRE_HEIGHT / 2 - 18,
            36,
            36
          )
        );
      })
      .map((operation) => operation.id);
    setOperationSelection(
      selection.addToSelection
        ? [...selectedOperationIds, ...selectedIds]
        : selectedIds
    );
  };

  const handleCanvasPointerCancel = (event: React.PointerEvent<HTMLDivElement>) => {
    if (boxSelectionRef.current?.pointerId !== event.pointerId) return;
    boxSelectionRef.current = null;
    setBoxSelection(null);
  };

  useEffect(() => {
    if (readOnly) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return;
      if (inspectMode) return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable ||
          Boolean(target.closest(".monaco-editor")))
      ) {
        return;
      }

      if (e.ctrlKey || e.metaKey) {
        const key = e.key.toLowerCase();
        if (key === "z" && (e.shiftKey ? canRedo() : canUndo())) {
          e.preventDefault();
          if (e.shiftKey) redo();
          else undo();
          return;
        }
        if (key === "y" && canRedo()) {
          e.preventDefault();
          redo();
          return;
        }
      }

      const focusInCanvas =
        target === null ||
        target === document.body ||
        Boolean(scrollRef.current?.contains(target));
      if (!focusInCanvas) return;

      if (e.ctrlKey || e.metaKey) {
        const key = e.key.toLowerCase();
        if (key === "a") {
          e.preventDefault();
          setOperationSelection(circuit.operations.map((operation) => operation.id));
          return;
        }
        if (key === "c" && selectedOp) {
          e.preventDefault();
          copyOperation(selectedOp.id);
          showAppToast(
            "Gate copied — right-click a spot or press Ctrl+V to paste"
          );
          return;
        }
        if (key === "v" && clipboard) {
          e.preventDefault();
          const pastedId = pasteOperation(
            nextPasteColumn,
            primaryWireIndex(clipboard)
          );
          if (pastedId) setSelectedOperation(pastedId);
          return;
        }
      }

      if (selectedOperationIds.length > 1) {
        if (e.key === "Delete" || e.key === "Backspace") {
          e.preventDefault();
          removeOperations(selectedOperationIds);
          return;
        }
        if (e.key === "Escape") {
          e.preventDefault();
          setSelectedOperation(null);
          return;
        }

        const movement: [number, number] | null =
          e.key === "ArrowLeft"
            ? [-1, 0]
            : e.key === "ArrowRight"
              ? [1, 0]
              : e.key === "ArrowUp"
                ? [0, -1]
                : e.key === "ArrowDown"
                  ? [0, 1]
                  : null;
        if (movement) {
          e.preventDefault();
          moveOperations(selectedOperationIds, movement[0], movement[1]);
          return;
        }
      }

      if ((e.key === "Delete" || e.key === "Backspace") && selectedOperationId) {
        e.preventDefault();
        removeOperation(selectedOperationId);
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "d" && selectedOperationId) {
        e.preventDefault();
        duplicateOperation(selectedOperationId);
        return;
      }

      if (!selectedOp) return;

      const col = selectedOp.column;
      const wire = selectedWireIndex;

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        relocateOperation(selectedOp.id, Math.max(0, col - 1), wire);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        relocateOperation(selectedOp.id, col + 1, wire);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        if (wire > 0) relocateOperation(selectedOp.id, col, wire - 1);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        if (wire < circuit.qubits.length - 1) {
          relocateOperation(selectedOp.id, col, wire + 1);
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    readOnly,
    inspectMode,
    selectedOperationId,
    selectedOperationIds,
    selectedOp,
    selectedWireIndex,
    circuit.operations,
    circuit.qubits.length,
    removeOperation,
    removeOperations,
    duplicateOperation,
    copyOperation,
    pasteOperation,
    clipboard,
    nextPasteColumn,
    setSelectedOperation,
    setOperationSelection,
    moveOperations,
    relocateOperation,
    undo,
    redo,
    canUndo,
    canRedo,
  ]);

  return (
    <TooltipProvider delayDuration={400}>
      <div
        ref={canvasRootRef}
        className="flex h-full flex-col bg-[var(--color-canvas)]"
      >
        <div
          className={cn(
            "composer-canvas-toolbar @container flex h-8 shrink-0 items-center justify-between gap-2 border-b border-[var(--color-border)] bg-[var(--color-toolbar)] px-2 sm:px-3",
            readOnly && "hidden"
          )}
        >
          <div className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto">
            <button
              type="button"
              className="composer-toolbar-btn touch-target-sm flex shrink-0 items-center justify-center rounded"
              onClick={undo}
              disabled={!hydrated || !canUndo()}
              title="Undo"
              aria-label="Undo"
            >
              <Undo2 className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              className="composer-toolbar-btn touch-target-sm flex shrink-0 items-center justify-center rounded"
              onClick={redo}
              disabled={!hydrated || !canRedo()}
              title="Redo"
              aria-label="Redo"
            >
              <Redo2 className="h-3.5 w-3.5" />
            </button>
            <div className="mx-1.5 h-4 w-px shrink-0 bg-[var(--color-border)]" />
            <button
              type="button"
              className="composer-toolbar-btn flex shrink-0 items-center gap-1 rounded px-2 py-1 text-xs"
              title="Compact columns (left alignment)"
              onClick={() => alignOperationsLeft()}
            >
              <AlignLeft className="h-3.5 w-3.5" />
              <span className="hidden @md:inline capitalize">{alignmentMode}</span>
            </button>
            <button
              type="button"
              className={cn(
                "composer-toolbar-btn flex shrink-0 items-center gap-1 rounded px-2 py-1 text-xs",
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
              <span className="hidden @md:inline">Inspect</span>
            </button>
            {inspectMode && (
              <>
                <button
                  type="button"
                  className="composer-toolbar-btn touch-target-sm flex shrink-0 items-center justify-center rounded"
                  disabled={inspectStep <= 0}
                  onClick={() => setInspectStep(inspectStep - 1)}
                  title="Previous layer"
                  aria-label="Previous inspect layer"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <span className="shrink-0 text-[10px] text-[var(--color-muted-foreground)]">
                  {inspectStep}/{maxInspectStep}
                </span>
                <button
                  type="button"
                  className="composer-toolbar-btn touch-target-sm flex shrink-0 items-center justify-center rounded"
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
          <div className="flex shrink-0 items-center gap-1 overflow-x-auto">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 shrink-0 gap-1 px-2 text-xs sm:h-7"
              onClick={addQubit}
              aria-label="Add qubit"
            >
              <Plus className="h-3 w-3" />
              <span className={cn("hidden", inspectMode ? "@md:inline" : "@xs:inline")}>
                Qubit
              </span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 shrink-0 gap-1 px-2 text-xs sm:h-7"
              onClick={() => setRegistersOpen(true)}
              title="Manage registers"
              aria-label="Manage registers"
            >
              <Rows3 className={cn("h-3 w-3", inspectMode ? "@md:hidden" : "@xs:hidden")} />
              <span className={cn("hidden", inspectMode ? "@md:inline" : "@xs:inline")}>
                Registers…
              </span>
            </Button>
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
          tabIndex={0}
          role="region"
          aria-label={canvasLabel}
          data-tour="canvas"
          className={cn(
            "relative flex-1 overflow-auto p-3",
            isPaletteDragging && "cursor-copy",
            isPlacementMode && "cursor-crosshair"
          )}
          onClick={(e) => {
            if (readOnly) return;
            if (!placementGate || inspectMode || !canvasRef.current) return;
            const pos = resolveDropPosition(
              e.clientX,
              e.clientY,
              canvasRef.current,
              circuit.qubits.length
            );
            if (pos) {
              const newId = placeGate(placementGate, pos.qubitIndex, pos.column);
              if (newId) setSelectedOperation(newId);
              onPlacementComplete?.();
            }
          }}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onDragLeave={handleDragLeave}
          onContextMenu={(e) => {
            if (readOnly) return;
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
            onClickCapture={(event) => {
              if (!suppressCanvasClick.current) return;
              suppressCanvasClick.current = false;
              event.preventDefault();
              event.stopPropagation();
            }}
            onClick={() => {
              if (suppressCanvasClick.current) {
                suppressCanvasClick.current = false;
                return;
              }
              if (!readOnly) setSelectedOperation(null);
            }}
            onPointerDown={handleCanvasPointerDown}
            onPointerMove={handleCanvasPointerMove}
            onPointerUp={handleCanvasPointerUp}
            onPointerCancel={handleCanvasPointerCancel}
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
                className="absolute top-0 border-l border-dashed border-[var(--color-border)]/25"
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
                  <div className="quanta-wire absolute left-0 right-0 top-1/2 h-px" />
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
                      <div className="quanta-wire-cap flex h-5 w-5 items-center justify-center rounded-full border">
                        <div className="quanta-wire-cap h-2.5 w-2.5 rounded-full border" />
                      </div>
                    )}
                  </div>
                </div>
                {isPlacementMode && !inspectMode && (
                  <button
                    type="button"
                    className="sr-only focus:not-sr-only focus:absolute focus:left-1 focus:z-20 focus:rounded focus:bg-[var(--color-surface)] focus:px-2 focus:py-0.5 focus:text-xs"
                    aria-label={`Place ${getGateByType(placementGate)?.fullName ?? placementGate} on ${qubit.label}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      const col = Math.max(
                        0,
                        ...circuit.operations.map((op) => op.column + 1)
                      );
                      const id = placeGate(placementGate, idx, col);
                      if (id) {
                        setSelectedOperation(id);
                        requestAnimationFrame(() =>
                          scrollRef.current
                            ?.querySelector<HTMLElement>(
                              `[data-operation-id="${id}"][tabindex="0"]`
                            )
                            ?.focus()
                        );
                      }
                      onPlacementComplete?.();
                    }}
                  >
                    Place on {qubit.label}
                  </button>
                )}
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
                  <div className="quanta-wire-classical absolute left-0 right-0 top-1/2 h-px border-t-2 border-double" />
                </div>
              </div>
            ))}

            {boxSelection?.dragging && (
              <div
                className="pointer-events-none absolute z-20 border border-[var(--color-cyan-quantum)] bg-[var(--color-cyan-quantum)]/15"
                style={{
                  left: Math.min(boxSelection.startX, boxSelection.currentX),
                  top: Math.min(boxSelection.startY, boxSelection.currentY),
                  width: Math.abs(boxSelection.currentX - boxSelection.startX),
                  height: Math.abs(boxSelection.currentY - boxSelection.startY),
                }}
              />
            )}

            {isPaletteDragging && dropPreview && draggingGate && (
              <DropPreview
                gateType={draggingGate}
                position={dropPreview}
                numQubits={circuit.qubits.length}
                operations={circuit.operations}
                alignmentMode={alignmentMode}
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
                      isSelected={selectedOperationIds.includes(op.id)}
                      onSelect={(event) => handleOperationSelect(op.id, event)}
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
                    isSelected={selectedOperationIds.includes(op.id)}
                    onSelect={(event) => handleOperationSelect(op.id, event)}
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

            {selectedOp &&
              selectedOperationIds.length <= 1 &&
              !isPaletteDragging &&
              !inspectMode && (
              <SelectedGateActionBar
                operation={selectedOp}
                wireIndex={selectedWireIndex}
                onDelete={() => removeOperation(selectedOp.id)}
                onInspect={() => setShowInspector(true)}
                onCopy={() => duplicateOperation(selectedOp.id)}
                onMoveStart={() => setMovingOperationId(selectedOp.id)}
                draggable
              />
            )}
            {selectedOperationIds.length > 1 &&
              !isPaletteDragging &&
              !inspectMode && (
                <div
                  className="absolute left-2 top-2 z-40 flex items-center gap-2 rounded-md border border-[var(--color-border)] bg-[var(--color-card)] px-2 py-1 shadow-lg"
                  data-canvas-overlay
                  onClick={(event) => event.stopPropagation()}
                >
                  <span className="text-xs font-medium">
                    {selectedOperationIds.length} gates selected
                  </span>
                  <button
                    type="button"
                    className="composer-toolbar-btn flex h-7 w-7 items-center justify-center rounded text-[var(--color-destructive)] hover:bg-[var(--color-error-subtle)]"
                    aria-label={`Delete ${selectedOperationIds.length} selected gates`}
                    title="Delete selected gates"
                    onClick={() => removeOperations(selectedOperationIds)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    className="composer-toolbar-btn h-7 rounded px-2 text-xs"
                    onClick={() => setSelectedOperation(null)}
                  >
                    Clear
                  </button>
                </div>
              )}
          </div>
          {circuit.operations.length === 0 &&
            !(
              variant === "learning" &&
              canvasRootSize.height > 0 &&
              canvasRootSize.height < 200
            ) && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center gap-2 px-4 text-center text-xs text-[var(--color-muted-foreground)]">
                <QuantaImage variant="learning" size="xs" />
                <span>
                  Drag a gate onto a wire — or click a gate, then a wire.
                </span>
              </div>
            )}
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
                Angle (e.g. pi/2, 1.57, or a name like theta)
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
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      applySelectedParam();
                      setEditingParam(null);
                    }
                  }}
                  onBlur={() => {
                    if (editingParam === selectedOp.id) {
                      applySelectedParam();
                      setEditingParam(null);
                    }
                  }}
                  className="h-8 w-40 font-mono text-sm"
                />
              </div>
            </div>
          )}
        {variant === "learning" && !readOnly && (
          <div className="border-t border-[var(--color-border)] px-4 py-3">
            <ParameterBindingsPanel />
          </div>
        )}
      </div>

      <ManageRegistersDialog open={registersOpen} onOpenChange={setRegistersOpen} />
    </TooltipProvider>
  );
}
