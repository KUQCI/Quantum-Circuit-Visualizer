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
  MAX_SIMULATION_QUBITS,
  type Complex,
} from "./quantum-state";
import type { BackendId } from "./backends";
import { clampNoiseModel, IDEAL_NOISE, type NoiseModel } from "./noise-model";
import { bindCircuitParameters } from "./parameter-bindings";

export interface HistogramEntry {
  label: string;
  count: number;
  probability: number;
  percentage: number;
}

export interface ExecutionResult {
  backendId: BackendId;
  shots: number;
  noise: NoiseModel;
  counts: Record<string, number>;
  histogram: HistogramEntry[];
  registerLabel: string;
  executionTimeMs: number;
  error: string | null;
}

const MAX_QUBITS = MAX_SIMULATION_QUBITS;

function c(re: number, im = 0): Complex {
  return { re, im };
}

function sortedOperations(circuit: Circuit): Operation[] {
  return [...circuit.operations]
    .filter((op) => op.type !== "barrier")
    .sort((a, b) => a.column - b.column || a.id.localeCompare(b.id));
}

function applyPauliNoise(
  state: Complex[],
  circuit: Circuit,
  qubitIndexes: number[],
  probability: number,
  numQubits: number,
  rng: () => number
): Complex[] {
  let next = state;
  for (const qubitIndex of qubitIndexes) {
    if (rng() >= probability) continue;
    const pauli = ["x", "y", "z"][Math.floor(rng() * 3)]!;
    const qubitId = circuit.qubits[qubitIndex]?.id;
    if (!qubitId) continue;
    const operation: Operation = {
      id: `noise-${pauli}-${qubitIndex}`,
      type: pauli,
      label: pauli.toUpperCase(),
      targets: [qubitId],
      controls: [],
      classicalTargets: [],
      column: 0,
    };
    next = applyGateToState(next, operation, numQubits) ?? next;
  }
  return next;
}

function runSingleShot(
  circuit: Circuit,
  rng: () => number,
  noise: NoiseModel
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
          classical[cIdx] =
            noise.enabled && rng() < noise.readoutError
              ? outcome === 0
                ? 1
                : 0
              : outcome;
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

    if (noise.enabled) {
      const involved = [
        ...op.controls.map(qubitIndexFromId),
        ...op.targets.map(qubitIndexFromId),
      ].filter((index, position, indexes) => indexes.indexOf(index) === position);
      const singleQubitGate = op.controls.length === 0 && op.targets.length === 1;
      state = applyPauliNoise(
        state,
        circuit,
        singleQubitGate ? [involved[0]!] : involved,
        singleQubitGate ? noise.depolarizing1q : noise.depolarizing2q,
        numQubits,
        rng
      );
    }
  }

  const hasMeasurements = circuit.operations.some((op) => op.type === "measure");

  if (hasMeasurements && numClassical > 0) {
    const key = [...classical]
      .reverse()
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
  backendId: BackendId = "local-sampler",
  noise: NoiseModel = IDEAL_NOISE
): ExecutionResult {
  circuit = bindCircuitParameters(circuit);
  const start = performance.now();
  const effectiveNoise = clampNoiseModel(noise);
  const numQubits = circuit.qubits.length;
  const numClassical = circuit.classicalBits.length;

  if (numQubits === 0) {
    return {
      backendId,
      shots,
      noise: effectiveNoise,
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
      noise: effectiveNoise,
      counts: {},
      histogram: [],
      registerLabel: "—",
      executionTimeMs: 0,
      error: `Simulation limited to ${MAX_QUBITS} qubits`,
    };
  }

  const symbols = [
    ...new Set(
      circuit.operations.flatMap(
        (op) =>
          op.parameters?.flatMap((parameter) =>
            parameter.symbol ? [parameter.symbol] : []
          ) ?? []
      )
    ),
  ];
  if (symbols.length > 0) {
    return {
      backendId,
      shots,
      noise: effectiveNoise,
      counts: {},
      histogram: [],
      registerLabel: "—",
      executionTimeMs: performance.now() - start,
      error: `Unbound parameter ${symbols.join(", ")} — bind a value before simulating`,
    };
  }

  const counts: Record<string, number> = {};

  for (let i = 0; i < shots; i++) {
    const { key, error } = runSingleShot(circuit, Math.random, effectiveNoise);
    if (error) {
      return {
        backendId,
        shots,
        noise: effectiveNoise,
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
    noise: effectiveNoise,
    counts,
    histogram,
    registerLabel,
    executionTimeMs: performance.now() - start,
    error: null,
  };
}
