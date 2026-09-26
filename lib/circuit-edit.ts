import type { Circuit, Operation } from "@/lib/circuit-schema";

function qIndex(id: string): number {
  return parseInt(id.replace("q", ""), 10);
}

function cIndex(id: string): number {
  return parseInt(id.replace("c", ""), 10);
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
  numQubits: number,
  numClassical: number
): Operation {
  const next: Operation = { ...op, column: Math.max(0, column) };

  if (qubitIndex === undefined) return next;

  if (op.type === "measure") {
    const cIdx =
      numClassical === 0 ? 0 : Math.min(qubitIndex, numClassical - 1);
    return {
      ...next,
      targets: [`q${qubitIndex}`],
      classicalTargets: numClassical > 0 ? [`c${cIdx}`] : [],
    };
  }

  if (op.type === "swap" && op.targets.length >= 2) {
    const a = qIndex(op.targets[0]);
    const b = qIndex(op.targets[1]);
    const span = b - a;
    const newA = Math.max(0, Math.min(numQubits - 1, qubitIndex));
    const newB = Math.max(0, Math.min(numQubits - 1, newA + span));
    if (newA === newB) return next;
    return {
      ...next,
      targets: [`q${Math.min(newA, newB)}`, `q${Math.max(newA, newB)}`],
      controls: [],
    };
  }

  if (op.controls.length > 0 && op.targets.length > 0) {
    const controlIdx = qIndex(op.controls[0]);
    const targetIdx = qIndex(op.targets[0]);
    const offset = targetIdx - controlIdx;
    const newControl = Math.max(0, Math.min(numQubits - 1, qubitIndex));
    const newTarget = Math.max(
      0,
      Math.min(numQubits - 1, newControl + offset)
    );
    if (newControl === newTarget) return next;
    return {
      ...next,
      controls: [`q${newControl}`],
      targets: [`q${newTarget}`],
    };
  }

  if (op.targets.length === 1 && op.controls.length === 0) {
    return { ...next, targets: [`q${qubitIndex}`] };
  }

  if (op.type === "barrier") {
    return next;
  }

  return next;
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
