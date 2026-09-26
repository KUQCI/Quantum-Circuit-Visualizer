import type { Circuit, Operation } from "@/lib/circuit-schema";

function qIndex(id: string): number {
  return parseInt(id.replace("q", ""), 10);
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
