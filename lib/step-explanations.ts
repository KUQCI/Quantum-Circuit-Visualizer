import type { Circuit, Operation } from "./circuit-schema";
import {
  type QuantumStateResult,
  simulateCircuit,
} from "./quantum-state";
import { getExecutionLayers, getOperationsUpToStep } from "./circuit-layout";

export interface StepSnapshot {
  step: number;
  layer: Operation[];
  before: QuantumStateResult;
  after: QuantumStateResult;
}

export interface BasisChange {
  label: string;
  beforeProb: number;
  afterProb: number;
  beforePhase: number;
  afterPhase: number;
}

export interface StepExplanation {
  title: string;
  gateSummaries: { opId: string; type: string; text: string }[];
  computed: string[];
  phaseOnly: boolean;
  entangled: boolean | null;
  changes: BasisChange[];
}

const GATE_EXPLANATIONS: Record<string, string> = {
  h: "Creates a balanced superposition of |0⟩ and |1⟩.",
  x: "Flips the target qubit between |0⟩ and |1⟩.",
  y: "Flips the target and adds a quarter-turn phase.",
  z: "Flips the phase of the |1⟩ component.",
  s: "Applies a 90° phase rotation to the |1⟩ component.",
  sdg: "Applies a −90° phase rotation to the |1⟩ component.",
  t: "Applies a 45° phase rotation to the |1⟩ component.",
  tdg: "Applies a −45° phase rotation to the |1⟩ component.",
  rx: "Rotates the target around the X axis.",
  ry: "Rotates the target around the Y axis.",
  rz: "Rotates the target around the Z axis.",
  p: "Applies a phase rotation to the target qubit.",
  cx: "Flips the target when the control is |1⟩.",
  cz: "Flips the target phase when the control is |1⟩.",
  swap: "Exchanges the states of the two target qubits.",
  ccx: "Flips the target when both controls are |1⟩.",
  measure: "Measures the target qubit in the computational basis.",
  fallback: "Updates the circuit state according to this operation.",
};

const PROB_EPSILON = 1e-9;
const PHASE_EPSILON = 1e-9;
const snapshotCache = new Map<string, StepSnapshot[]>();

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function phaseOf(amplitude: { re: number; im: number } | undefined): number {
  if (!amplitude || Math.hypot(amplitude.re, amplitude.im) < PROB_EPSILON) {
    return 0;
  }
  return Math.atan2(amplitude.im, amplitude.re);
}

function phaseDifference(a: number, b: number): number {
  let difference = b - a;
  while (difference > Math.PI) difference -= Math.PI * 2;
  while (difference < -Math.PI) difference += Math.PI * 2;
  return difference;
}

function formatDegrees(radians: number): string {
  return `${Math.round((radians * 180) / Math.PI)}°`;
}

function operationWires(op: Operation): string {
  const controls = op.controls.join(",");
  const targets = op.targets.join(",");
  if (controls && targets) return `${controls}→${targets}`;
  return targets || controls;
}

function gateSummary(op: Operation): { opId: string; type: string; text: string } {
  const text = GATE_EXPLANATIONS[op.type] ?? GATE_EXPLANATIONS.fallback;
  return {
    opId: op.id,
    type: op.type,
    text: `${op.type.toUpperCase()} ${operationWires(op)}: ${text}`,
  };
}

function entanglementForState(state: QuantumStateResult): boolean | null {
  if (state.error || state.numQubits !== 2 || state.amplitudes.length !== 4) {
    return null;
  }
  const [a00, a01, a10, a11] = state.amplitudes;
  const determinant = {
    re: a00.re * a11.re - a00.im * a11.im - a01.re * a10.re + a01.im * a10.im,
    im: a00.re * a11.im + a00.im * a11.re - a01.re * a10.im - a01.im * a10.re,
  };
  return Math.hypot(determinant.re, determinant.im) > PROB_EPSILON;
}

function changesForStates(
  before: QuantumStateResult,
  after: QuantumStateResult
): BasisChange[] {
  const count = Math.max(
    before.probabilities.length,
    after.probabilities.length,
    before.amplitudes.length,
    after.amplitudes.length
  );
  return Array.from({ length: count }, (_, index) => ({
    label:
      after.probabilities[index]?.label ??
      before.probabilities[index]?.label ??
      `|${index}⟩`,
    beforeProb: before.probabilities[index]?.probability ?? 0,
    afterProb: after.probabilities[index]?.probability ?? 0,
    beforePhase: phaseOf(before.amplitudes[index]),
    afterPhase: phaseOf(after.amplitudes[index]),
  }));
}

function initialState(circuit: Circuit): QuantumStateResult {
  return simulateCircuit({ ...circuit, operations: [] });
}

export function circuitSignature(circuit: Circuit): string {
  return JSON.stringify({
    qubits: circuit.qubits.map((qubit) => qubit.id),
    operations: circuit.operations.map((op) => ({
      id: op.id,
      type: op.type,
      controls: op.controls,
      targets: op.targets,
      classicalTargets: op.classicalTargets,
      parameters: op.parameters,
      column: op.column,
    })),
  });
}

export function computeStepSnapshots(circuit: Circuit): StepSnapshot[] {
  const signature = circuitSignature(circuit);
  const cached = snapshotCache.get(signature);
  if (cached) return cached;

  const layers = getExecutionLayers(
    circuit.operations.filter((op) => op.type !== "barrier")
  );
  const initial = initialState(circuit);
  const snapshots: StepSnapshot[] = [
    { step: 0, layer: [], before: initial, after: initial },
  ];

  for (let step = 1; step <= layers.length; step++) {
    const before = snapshots[step - 1].after;
    const after = simulateCircuit({
      ...circuit,
      operations: getOperationsUpToStep(circuit.operations, step),
    });
    snapshots.push({ step, layer: layers[step - 1], before, after });
  }

  snapshotCache.set(signature, snapshots);
  if (snapshotCache.size > 8) {
    const oldest = snapshotCache.keys().next().value;
    if (oldest) snapshotCache.delete(oldest);
  }
  return snapshots;
}

export function explainStep(
  snapshot: StepSnapshot,
  circuit: Circuit
): StepExplanation {
  const changes = changesForStates(snapshot.before, snapshot.after);
  const probabilityChanges = changes.filter(
    (change) =>
      Math.abs(change.afterProb - change.beforeProb) > PROB_EPSILON
  );
  const phaseChanges = changes.filter(
    (change) =>
      Math.abs(phaseDifference(change.beforePhase, change.afterPhase)) >
      PHASE_EPSILON
  );
  const phaseOnly =
    probabilityChanges.length === 0 && phaseChanges.length > 0;
  const computed: string[] = [];

  if (snapshot.after.error) {
    computed.push(
      snapshot.after.error.includes("Unbound parameter")
        ? snapshot.after.error.replace(
            "— bind a value before simulating",
            "— bind before stepping"
          )
        : snapshot.after.error
    );
  } else if (probabilityChanges.length > 0) {
    computed.push(
      `Probabilities changed: ${probabilityChanges
        .map(
          (change) =>
            `${change.label} ${formatPercent(change.beforeProb)} → ${formatPercent(change.afterProb)}`
        )
        .join(", ")}.`
    );
  } else if (phaseOnly) {
    computed.push(
      `Probabilities unchanged — only phases changed on ${phaseChanges
        .map((change) => change.label)
        .join(", ")}.`
    );
  } else {
    computed.push("Probabilities and phases are unchanged.");
  }

  const entangled = entanglementForState(snapshot.after);
  if (entangled === true) {
    computed.push("The two-qubit state is entangled.");
  } else if (entangled === false) {
    computed.push("The state is a product state.");
  }

  const title =
    snapshot.step === 0
      ? `Step 0 · Initial state |${"0".repeat(circuit.qubits.length)}⟩`
      : `Step ${snapshot.step} · ${snapshot.layer
          .map((op) => `${op.type.toUpperCase()} ${operationWires(op)}`)
          .join(", ")}`;

  return {
    title,
    gateSummaries: snapshot.layer.map(gateSummary),
    computed,
    phaseOnly,
    entangled,
    changes,
  };
}

export function formatPhaseForExplanation(radians: number): string {
  return formatDegrees(radians);
}
