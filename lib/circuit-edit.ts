import {
  getGateLabel,
  type Circuit,
  type Operation,
} from "@/lib/circuit-schema";

function qIndex(id: string): number {
  return parseInt(id.replace("q", ""), 10);
}

/** Qubit indices an op visually occupies: the contiguous range from its targets and controls. */
export function occupiedWires(
  op: Pick<Operation, "targets" | "controls">
): number[] {
  const indices = [...op.targets, ...op.controls]
    .map(qIndex)
    .filter(Number.isInteger);
  if (indices.length === 0) return [];

  const min = Math.min(...indices);
  const max = Math.max(...indices);
  return Array.from({ length: max - min + 1 }, (_, index) => min + index);
}

/** First other op in the same column whose occupied wires intersect the candidate's. */
export function findPlacementConflict(
  operations: Operation[],
  candidate: Pick<Operation, "targets" | "controls" | "column">,
  ignoreId?: string
): Operation | null {
  const candidateWires = new Set(occupiedWires(candidate));
  if (candidateWires.size === 0) return null;

  return (
    operations.find(
      (operation) =>
        operation.id !== ignoreId &&
        operation.column === candidate.column &&
        occupiedWires(operation).some((wire) => candidateWires.has(wire))
    ) ?? null
  );
}

/** Describe the first shared wire and the operation already occupying it. */
export function placementConflictMessage(
  conflict: Operation,
  candidate: Pick<Operation, "targets" | "controls" | "column">
): string {
  const candidateWires = new Set(occupiedWires(candidate));
  const sharedWire = occupiedWires(conflict).find((wire) =>
    candidateWires.has(wire)
  );
  const label = conflict.label || getGateLabel(conflict.type);
  return `q${sharedWire} already has a gate (${label}) in column ${candidate.column + 1} — drop it on an empty spot.`;
}

/** Gates that can be moved to another qubit wire by drag. */
export function canRetargetOnWire(op: Operation): boolean {
  if (op.type === "barrier") return false;
  if (op.type === "swap") return true;
  if (op.controls.length > 0 && op.type !== "swap") return true; // shift as block
  return op.targets.length >= 1;
}

/**
 * Move an operation to a new column and optionally retarget to a qubit wire.
 * Multi-qubit gates preserve control/target offset when possible.
 */
export function retargetOperation(
  op: Operation,
  column: number,
  qubitIndex: number | undefined,
  numQubits: number
): Operation {
  const next: Operation = { ...op, column: Math.max(0, column) };

  if (qubitIndex === undefined) return next;

  if (op.type === "measure") {
    return {
      ...next,
      targets: [`q${qubitIndex}`],
      classicalTargets: op.classicalTargets,
    };
  }

  if (op.controls.length === 0 && op.targets.length === 1) {
    return { ...next, targets: [`q${qubitIndex}`] };
  }

  const wires = [...op.controls, ...op.targets];
  if (wires.length === 0 || numQubits < 1) {
    return next;
  }

  const indices = wires.map(qIndex);
  const minIdx = Math.min(...indices);
  const maxIdx = Math.max(...indices);
  const span = maxIdx - minIdx;
  if (numQubits < span + 1) return next;

  const requestedDelta = qubitIndex - minIdx;
  const minDelta = -minIdx;
  const maxDelta = numQubits - 1 - maxIdx;
  const delta = Math.max(minDelta, Math.min(maxDelta, requestedDelta));
  const shift = (id: string) => `q${qIndex(id) + delta}`;
  const targets = op.targets.map(shift);

  return {
    ...next,
    controls: op.controls.map(shift),
    targets:
      op.type === "swap"
        ? [...targets].sort((a, b) => qIndex(a) - qIndex(b))
        : targets,
  };
}

/** Primary wire index for an operation (for selection UI). */
export function primaryWireIndex(op: Operation): number {
  const indices = [
    ...op.targets.map(qIndex),
    ...op.controls.map(qIndex),
  ];
  return indices.length ? Math.min(...indices) : 0;
}

export function operationUsesRegister(
  op: Operation,
  qubitId: string,
  classicalId?: string
): boolean {
  if (op.targets.includes(qubitId) || op.controls.includes(qubitId)) return true;
  if (classicalId && op.classicalTargets.includes(classicalId)) return true;
  return false;
}

export function countOpsUsingQubit(circuit: Circuit, qubitId: string): number {
  return circuit.operations.filter((op) =>
    operationUsesRegister(op, qubitId)
  ).length;
}

export function countOpsUsingClassical(
  circuit: Circuit,
  bitId: string
): number {
  return circuit.operations.filter((op) =>
    op.classicalTargets.includes(bitId)
  ).length;
}
