import { createEmptyCircuit, type Circuit } from "./circuit-schema";
import { repairCircuit, validateCircuit } from "./validation";

export interface PrepareCircuitOptions {
  /** Used when input is missing or invalid */
  fallbackName?: string;
  /** Minimum qubit count when falling back to an empty circuit */
  minQubits?: number;
}

/**
 * Single choke point for every circuit entering client state, simulation, or storage.
 * Validates schema, drops invalid operations, and guarantees a usable circuit object.
 */
export function prepareCircuit(
  input: unknown,
  options: PrepareCircuitOptions = {}
): Circuit {
  const fallbackName = options.fallbackName ?? "Untitled circuit";
  const minQubits = Math.max(1, options.minQubits ?? 2);

  const validated = validateCircuit(input);
  if (!validated.valid) {
    return createEmptyCircuit(fallbackName, minQubits, 0);
  }

  const repaired = repairCircuit(validated.circuit);
  const name =
    typeof repaired.name === "string" && repaired.name.trim()
      ? repaired.name
      : fallbackName;

  if (repaired.qubits.length === 0) {
    return createEmptyCircuit(name, minQubits, repaired.classicalBits.length);
  }

  return { ...repaired, name };
}

export function prepareCircuitClone(
  input: unknown,
  options?: PrepareCircuitOptions
): Circuit {
  return prepareCircuit(structuredClone(input), options);
}

export function prepareHistory(
  history: Array<{ circuit?: unknown }> | undefined,
  options?: PrepareCircuitOptions
): { circuit: Circuit }[] {
  if (!Array.isArray(history) || history.length === 0) {
    return [{ circuit: prepareCircuit(null, options) }];
  }

  return history.map((entry) => ({
    circuit: prepareCircuit(entry?.circuit, options),
  }));
}
