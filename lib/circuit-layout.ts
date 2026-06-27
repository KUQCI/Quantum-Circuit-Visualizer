import type { Circuit, Operation } from "./circuit-schema";

export function compactColumnsLeft(operations: Operation[]): Operation[] {
  if (operations.length === 0) return operations;

  const sorted = [...operations].sort((a, b) => a.column - b.column || a.id.localeCompare(b.id));
  const uniqueColumns = [...new Set(sorted.map((op) => op.column))].sort((a, b) => a - b);
  const columnMap = new Map(uniqueColumns.map((col, idx) => [col, idx]));

  return sorted.map((op) => ({
    ...op,
    column: columnMap.get(op.column) ?? op.column,
  }));
}

export function applyLeftAlignment(circuit: Circuit): Circuit {
  return {
    ...circuit,
    operations: compactColumnsLeft(circuit.operations),
  };
}

export function getExecutionLayers(operations: Operation[]): Operation[][] {
  const aligned = compactColumnsLeft(operations);
  const layerMap = new Map<number, Operation[]>();

  for (const op of aligned) {
    const layer = layerMap.get(op.column) ?? [];
    layer.push(op);
    layerMap.set(op.column, layer);
  }

  return [...layerMap.entries()]
    .sort(([a], [b]) => a - b)
    .map(([, ops]) => ops);
}

export function getMaxInspectStep(operations: Operation[]): number {
  const layers = getExecutionLayers(operations.filter((op) => op.type !== "barrier"));
  return Math.max(0, layers.length);
}

export function getOperationsUpToStep(
  operations: Operation[],
  step: number
): Operation[] {
  const layers = getExecutionLayers(operations.filter((op) => op.type !== "barrier"));
  const included = new Set<string>();

  for (let i = 0; i < Math.min(step, layers.length); i++) {
    for (const op of layers[i]) {
      included.add(op.id);
    }
  }

  return operations.filter((op) => op.type === "barrier" || included.has(op.id));
}
