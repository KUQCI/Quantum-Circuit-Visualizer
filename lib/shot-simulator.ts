import type { Circuit, Operation } from "./circuit-schema";
import {
  classicalBitIndexFromId,
  qubitIndexFromId,
} from "./circuit-schema";
import {
  applyGateToState,
  collapseQubit,
  measureQubit,
  sampleFromStatevector,
  type Complex,
} from "./quantum-state";
import type { BackendId } from "./backends";

export interface HistogramEntry {
  label: string;
  count: number;
  probability: number;
  percentage: number;
}

export interface ExecutionResult {
  backendId: BackendId;
  shots: number;
  counts: Record<string, number>;
  histogram: HistogramEntry[];
  registerLabel: string;
  executionTimeMs: number;
  error: string | null;
}

const MAX_QUBITS = 6;

function c(re: number, im = 0): Complex {
  return { re, im };
}

function sortedOperations(circuit: Circuit): Operation[] {
  return [...circuit.operations]
    .filter((op) => op.type !== "barrier")
    .sort((a, b) => a.column - b.column || a.id.localeCompare(b.id));
}

function runSingleShot(
  circuit: Circuit,
  rng: () => number
): { key: string; error: string | null } {
  const numQubits = circuit.qubits.length;
  const numClassical = circuit.classicalBits.length;
  let state: Complex[] = Array.from({ length: 1 << numQubits }, () => c(0));
  state[0] = c(1);

  const classical = new Array(numClassical).fill(null) as (0 | 1 | null)[];

  for (const op of sortedOperations(circuit)) {
    if (op.type === "measure") {
      const q = qubitIndexFromId(op.targets[0]);
      const { state: next, outcome } = measureQubit(state, numQubits, q, rng);
      state = next;
      if (op.classicalTargets.length > 0) {
        const cIdx = classicalBitIndexFromId(op.classicalTargets[0]);
        if (cIdx >= 0 && cIdx < numClassical) {
          classical[cIdx] = outcome;
        }
      }
      continue;
    }

    if (op.type === "reset") {
      const q = qubitIndexFromId(op.targets[0]);
      state = collapseQubit(state, numQubits, q, 0);
      continue;
    }

    const next = applyGateToState(state, op, numQubits);
    if (!next) {
      return { key: "", error: `Unsupported gate for simulation: ${op.type}` };
    }
    state = next;
  }

  const hasMeasurements = circuit.operations.some((op) => op.type === "measure");

  if (hasMeasurements && numClassical > 0) {
    const key = classical
      .map((b) => (b === null ? "0" : String(b)))
      .join("");
    return { key, error: null };
  }

  if (hasMeasurements) {
    return { key: sampleFromStatevector(state, numQubits, rng), error: null };
  }

  return { key: sampleFromStatevector(state, numQubits, rng), error: null };
}

export function runCircuitShots(
  circuit: Circuit,
  shots: number,
  backendId: BackendId = "local-sampler"
): ExecutionResult {
  const start = performance.now();
  const numQubits = circuit.qubits.length;
  const numClassical = circuit.classicalBits.length;

  if (numQubits === 0) {
    return {
      backendId,
      shots,
      counts: {},
      histogram: [],
      registerLabel: "—",
      executionTimeMs: 0,
      error: "Circuit has no qubits",
    };
  }

  if (numQubits > MAX_QUBITS) {
    return {
      backendId,
      shots,
      counts: {},
      histogram: [],
      registerLabel: "—",
      executionTimeMs: 0,
      error: `Simulation limited to ${MAX_QUBITS} qubits`,
    };
  }

  const counts: Record<string, number> = {};

  for (let i = 0; i < shots; i++) {
    const { key, error } = runSingleShot(circuit, Math.random);
    if (error) {
      return {
        backendId,
        shots,
        counts: {},
        histogram: [],
        registerLabel: "—",
        executionTimeMs: performance.now() - start,
        error,
      };
    }
    counts[key] = (counts[key] ?? 0) + 1;
  }

  const registerLabel =
    circuit.operations.some((op) => op.type === "measure") && numClassical > 0
      ? `c[${numClassical - 1}…0]`
      : `q[${numQubits - 1}…0]`;

  const histogram: HistogramEntry[] = Object.entries(counts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([label, count]) => ({
      label,
      count,
      probability: count / shots,
      percentage: (count / shots) * 100,
    }));

  return {
    backendId,
    shots,
    counts,
    histogram,
    registerLabel,
    executionTimeMs: performance.now() - start,
    error: null,
  };
}

/** Ideal probabilities without sampling noise (for comparison). */
export function idealProbabilitiesFromCircuit(circuit: Circuit): HistogramEntry[] {
  const numQubits = circuit.qubits.length;
  const shots = 10000;
  const counts: Record<string, number> = {};

  for (let i = 0; i < shots; i++) {
    const { key, error } = runSingleShot(circuit, Math.random);
    if (error) return [];
    counts[key] = (counts[key] ?? 0) + 1;
  }

  return Object.entries(counts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([label, count]) => ({
      label,
      count,
      probability: count / shots,
      percentage: (count / shots) * 100,
    }));
}
