import type { Circuit, Operation } from "./circuit-schema";
import { qubitIndexFromId } from "./circuit-schema";

export interface Complex {
  re: number;
  im: number;
}

export interface ProbabilityEntry {
  label: string;
  probability: number;
  percentage: number;
}

export interface QSpherePoint {
  label: string;
  x: number;
  y: number;
  z: number;
  probability: number;
  phase: number;
  amplitude: number;
}

export interface QuantumStateResult {
  numQubits: number;
  amplitudes: Complex[];
  probabilities: ProbabilityEntry[];
  qSpherePoints: QSpherePoint[];
  blochVector: { x: number; y: number; z: number } | null;
  error: string | null;
}

const MAX_QUBITS = 6;
const PROB_THRESHOLD = 1e-10;

function c(re: number, im = 0): Complex {
  return { re, im };
}

function cAdd(a: Complex, b: Complex): Complex {
  return { re: a.re + b.re, im: a.im + b.im };
}

function cMul(a: Complex, b: Complex): Complex {
  return {
    re: a.re * b.re - a.im * b.im,
    im: a.re * b.im + a.im * b.re,
  };
}

function cConj(a: Complex): Complex {
  return { re: a.re, im: -a.im };
}

function cAbs2(a: Complex): number {
  return a.re * a.re + a.im * a.im;
}

function cPhase(a: Complex): number {
  return Math.atan2(a.im, a.re);
}

function cExp(angle: number): Complex {
  return c(Math.cos(angle), Math.sin(angle));
}

function formatBasisLabel(index: number, numQubits: number): string {
  return index.toString(2).padStart(numQubits, "0");
}

function identity(n: number): Complex[][] {
  const m: Complex[][] = Array.from({ length: n }, () =>
    Array.from({ length: n }, () => c(0))
  );
  for (let i = 0; i < n; i++) m[i][i] = c(1);
  return m;
}

/** Binomial coefficient C(n, k) — matches Qiskit's n_choose_k */
export function nChooseK(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  if (k === 0 || k === n) return 1;
  let result = 1;
  for (let i = 0; i < k; i++) {
    result = (result * (n - i)) / (i + 1);
  }
  return Math.round(result);
}

/** Lexicographic index among bit strings with fixed Hamming weight — Qiskit lex_index */
export function lexIndex(n: number, k: number, ones: number[]): number {
  if (ones.length !== k) return 0;
  let dualm = 0;
  for (let i = 0; i < k; i++) {
    const comb = n - 1 - ones[k - 1 - i];
    dualm += nChooseK(comb, i + 1);
  }
  return dualm;
}

/** Index of a bit string among states with the same Hamming weight — Qiskit bit_string_index */
export function bitStringIndex(bitString: string): number {
  const n = bitString.length;
  const k = bitString.split("").filter((ch) => ch === "1").length;
  const ones = [...bitString].reduce<number[]>((acc, ch, pos) => {
    if (ch === "1") acc.push(pos);
    return acc;
  }, []);
  return lexIndex(n, k, ones);
}

/**
 * Q-sphere coordinates per Qiskit plot_state_qsphere:
 * |0…0⟩ at north pole, |1…1⟩ at south pole, latitude = Hamming weight.
 */
export function indexToQSphereCoords(
  index: number,
  numQubits: number
): { x: number; y: number; z: number } {
  const element = formatBasisLabel(index, numQubits);
  const weight = element.split("").filter((ch) => ch === "1").length;
  const d = numQubits;
  const zvalue = -2 * (weight / d) + 1;
  const numberOfDivisions = nChooseK(d, weight) || 1;
  const weightOrder = bitStringIndex(element);

  let angle =
    (weight / d) * (Math.PI * 2) +
    weightOrder * 2 * (Math.PI / numberOfDivisions);

  if (
    weight > d / 2 ||
    (weight === d / 2 && weightOrder >= numberOfDivisions / 2)
  ) {
    angle = Math.PI - angle - (2 * Math.PI) / numberOfDivisions;
  }

  const r = Math.sqrt(Math.max(0, 1 - zvalue * zvalue));
  return {
    x: r * Math.cos(angle),
    y: r * Math.sin(angle),
    z: zvalue,
  };
}

function rx(theta: number): Complex[][] {
  const c0 = Math.cos(theta / 2);
  const s0 = Math.sin(theta / 2);
  return [
    [c(c0), c(0, -s0)],
    [c(0, -s0), c(c0)],
  ];
}

function ry(theta: number): Complex[][] {
  const c0 = Math.cos(theta / 2);
  const s0 = Math.sin(theta / 2);
  return [
    [c(c0), c(-s0)],
    [c(s0), c(c0)],
  ];
}

function rz(theta: number): Complex[][] {
  const e = c(Math.cos(-theta / 2), Math.sin(-theta / 2));
  const eConj = cConj(e);
  return [
    [e, c(0)],
    [c(0), eConj],
  ];
}

function uMatrix(theta: number, phi: number, lam: number): Complex[][] {
  const c0 = Math.cos(theta / 2);
  const s0 = Math.sin(theta / 2);
  const negExpLam = c(-Math.cos(lam), -Math.sin(lam));
  const expPhi = cExp(phi);
  const expPhiLam = cExp(phi + lam);
  return [
    [c(c0), cMul(negExpLam, c(s0))],
    [cMul(expPhi, c(s0)), cMul(expPhiLam, c(c0))],
  ];
}

function getSingleQubitMatrix(
  type: string,
  params: number[] = []
): Complex[][] | null {
  const theta = params[0] ?? 0;
  switch (type) {
    case "h":
      return [
        [c(1 / Math.SQRT2), c(1 / Math.SQRT2)],
        [c(1 / Math.SQRT2), c(-1 / Math.SQRT2)],
      ];
    case "x":
      return [
        [c(0), c(1)],
        [c(1), c(0)],
      ];
    case "y":
      return [
        [c(0), c(0, -1)],
        [c(0, 1), c(0)],
      ];
    case "z":
      return [
        [c(1), c(0)],
        [c(0), c(-1)],
      ];
    case "s":
      return [
        [c(1), c(0)],
        [c(0), c(0, 1)],
      ];
    case "t":
      return [
        [c(1), c(0)],
        [c(0), c(Math.cos(Math.PI / 4), Math.sin(Math.PI / 4))],
      ];
    case "tdg":
      return [
        [c(1), c(0)],
        [c(0), c(Math.cos(-Math.PI / 4), Math.sin(-Math.PI / 4))],
      ];
    case "sdg":
      return [
        [c(1), c(0)],
        [c(0), c(0, -1)],
      ];
    case "p":
      return rz(theta);
    case "id":
      return identity(2);
    case "sx":
      return [
        [c(0.5, 0.5), c(0.5, -0.5)],
        [c(0.5, -0.5), c(0.5, 0.5)],
      ];
    case "sxdg":
      return [
        [c(0.5, -0.5), c(0.5, 0.5)],
        [c(0.5, 0.5), c(0.5, -0.5)],
      ];
    case "rx":
      return rx(theta);
    case "ry":
      return ry(theta);
    case "rz":
      return rz(theta);
    case "u":
      return uMatrix(theta, params[1] ?? 0, params[2] ?? 0);
    default:
      return null;
  }
}

function rxxMatrix(theta: number): Complex[][] {
  const c0 = Math.cos(theta / 2);
  const is = c(0, -Math.sin(theta / 2));
  const m = identity(4);
  m[0][0] = c(c0);
  m[1][1] = c(c0);
  m[2][2] = c(c0);
  m[3][3] = c(c0);
  m[0][3] = is;
  m[3][0] = is;
  m[1][2] = is;
  m[2][1] = is;
  return m;
}

function rzzMatrix(theta: number): Complex[][] {
  const em = c(Math.cos(-theta / 2), Math.sin(-theta / 2));
  const ep = c(Math.cos(theta / 2), Math.sin(theta / 2));
  return [
    [em, c(0), c(0), c(0)],
    [c(0), ep, c(0), c(0)],
    [c(0), c(0), ep, c(0)],
    [c(0), c(0), c(0), em],
  ];
}

function ccxMatrix(): Complex[][] {
  const m = identity(8);
  m[6][6] = c(0);
  m[7][7] = c(0);
  m[6][7] = c(1);
  m[7][6] = c(1);
  return m;
}

function getTwoQubitMatrix(type: string, theta = 0): Complex[][] | null {
  switch (type) {
    case "cx": {
      const cx: Complex[][] = Array.from({ length: 4 }, () =>
        Array.from({ length: 4 }, () => c(0))
      );
      cx[0][0] = c(1);
      cx[1][1] = c(1);
      cx[2][3] = c(1);
      cx[3][2] = c(1);
      return cx;
    }
    case "cz": {
      const cz = identity(4);
      cz[3][3] = c(-1);
      return cz;
    }
    case "swap": {
      const sw: Complex[][] = Array.from({ length: 4 }, () =>
        Array.from({ length: 4 }, () => c(0))
      );
      sw[0][0] = c(1);
      sw[1][2] = c(1);
      sw[2][1] = c(1);
      sw[3][3] = c(1);
      return sw;
    }
    case "rxx":
      return rxxMatrix(theta);
    case "rzz":
      return rzzMatrix(theta);
    default:
      return null;
  }
}

function applySingleQubitGate(
  state: Complex[],
  matrix: Complex[][],
  target: number,
  numQubits: number
): Complex[] {
  const dim = 1 << numQubits;
  const result = state.map(() => c(0));

  for (let i = 0; i < dim; i++) {
    const tBit = (i >> (numQubits - 1 - target)) & 1;
    for (let j = 0; j < 2; j++) {
      const iOther = i & ~(1 << (numQubits - 1 - target));
      const iNew = iOther | (j << (numQubits - 1 - target));
      result[iNew] = cAdd(result[iNew], cMul(matrix[j][tBit], state[i]));
    }
  }
  return result;
}

function applyMultiQubitGate(
  state: Complex[],
  matrix: Complex[][],
  qubits: number[],
  numQubits: number
): Complex[] {
  const dim = 1 << numQubits;
  const k = qubits.length;
  const result = state.map(() => c(0));

  for (let i = 0; i < dim; i++) {
    const bits: number[] = [];
    for (let q = 0; q < numQubits; q++) {
      bits[q] = (i >> (numQubits - 1 - q)) & 1;
    }

    const col = qubits.reduce((acc, q) => (acc << 1) | bits[q], 0);

    for (let row = 0; row < 1 << k; row++) {
      const newBits = [...bits];
      for (let j = 0; j < k; j++) {
        newBits[qubits[j]] = (row >> (k - 1 - j)) & 1;
      }
      let iNew = 0;
      for (let q = 0; q < numQubits; q++) {
        iNew = (iNew << 1) | newBits[q];
      }
      result[iNew] = cAdd(result[iNew], cMul(matrix[row][col], state[i]));
    }
  }

  return result;
}

function computeBlochVector(state: Complex[]): { x: number; y: number; z: number } {
  const alpha = state[0];
  const beta = state[1];
  const alphaConj = cConj(alpha);
  return {
    x: 2 * cMul(alphaConj, beta).re,
    y: 2 * cMul(alphaConj, beta).im,
    z: cAbs2(alpha) - cAbs2(beta),
  };
}

/** Remove global phase relative to the largest amplitude (Qiskit q-sphere convention). */
function removeGlobalPhase(state: Complex[]): Complex[] {
  let maxIdx = 0;
  let maxAbs = 0;
  for (let i = 0; i < state.length; i++) {
    const abs = Math.sqrt(cAbs2(state[i]));
    if (abs > maxAbs) {
      maxAbs = abs;
      maxIdx = i;
    }
  }
  if (maxAbs < 1e-14) return state;

  const globalPhase = cPhase(state[maxIdx]);
  const rot = cExp(-globalPhase);
  return state.map((amp) => cMul(rot, amp));
}

function paramValues(op: Operation): number[] {
  return op.parameters?.map((p) => p.value) ?? [];
}

function applyOperation(
  state: Complex[],
  op: Operation,
  numQubits: number
): Complex[] | null {
  if (op.type === "barrier" || op.type === "measure" || op.type === "reset") {
    return state;
  }

  const params = paramValues(op);

  if (
    (op.type === "swap" || op.type === "rxx" || op.type === "rzz") &&
    op.controls.length === 0 &&
    op.targets.length === 2
  ) {
    const q1 = qubitIndexFromId(op.targets[0]);
    const q2 = qubitIndexFromId(op.targets[1]);
    const matrix = getTwoQubitMatrix(op.type, params[0] ?? 0);
    if (!matrix) return null;
    return applyMultiQubitGate(state, matrix, [q1, q2], numQubits);
  }

  const singleMatrix = getSingleQubitMatrix(op.type, params);
  if (singleMatrix && op.targets.length === 1 && op.controls.length === 0) {
    const target = qubitIndexFromId(op.targets[0]);
    return applySingleQubitGate(state, singleMatrix, target, numQubits);
  }

  if (op.type === "ccx" && op.controls.length === 2 && op.targets.length === 1) {
    const qubits = [
      qubitIndexFromId(op.controls[0]),
      qubitIndexFromId(op.controls[1]),
      qubitIndexFromId(op.targets[0]),
    ];
    return applyMultiQubitGate(state, ccxMatrix(), qubits, numQubits);
  }

  if (op.controls.length === 1 && op.targets.length === 1) {
    const control = qubitIndexFromId(op.controls[0]);
    const target = qubitIndexFromId(op.targets[0]);
    const matrix = getTwoQubitMatrix(op.type, params[0] ?? 0);
    if (!matrix) return null;
    return applyMultiQubitGate(state, matrix, [control, target], numQubits);
  }

  return null;
}

/** Apply a unitary gate to a statevector (exported for shot simulation). */
export function applyGateToState(
  state: Complex[],
  op: Operation,
  numQubits: number
): Complex[] | null {
  return applyOperation(state, op, numQubits);
}

export function collapseQubit(
  state: Complex[],
  numQubits: number,
  qubit: number,
  outcome: 0 | 1
): Complex[] {
  const dim = 1 << numQubits;
  const collapsed = state.map((amp, i) => {
    const bit = (i >> (numQubits - 1 - qubit)) & 1;
    return bit === outcome ? amp : c(0);
  });
  const sum = collapsed.reduce((s, amp) => s + cAbs2(amp), 0);
  if (sum < 1e-14) return collapsed;
  const norm = Math.sqrt(sum);
  return collapsed.map((amp) => c(amp.re / norm, amp.im / norm));
}

export function measureQubit(
  state: Complex[],
  numQubits: number,
  qubit: number,
  rng: () => number = Math.random
): { state: Complex[]; outcome: 0 | 1 } {
  const dim = 1 << numQubits;
  let p0 = 0;
  for (let i = 0; i < dim; i++) {
    const bit = (i >> (numQubits - 1 - qubit)) & 1;
    if (bit === 0) p0 += cAbs2(state[i]);
  }
  const outcome: 0 | 1 = rng() < p0 ? 0 : 1;
  return { state: collapseQubit(state, numQubits, qubit, outcome), outcome };
}

export function sampleFromStatevector(
  state: Complex[],
  numQubits: number,
  rng: () => number = Math.random
): string {
  const dim = 1 << numQubits;
  const r = rng();
  let cumulative = 0;
  for (let i = 0; i < dim; i++) {
    cumulative += cAbs2(state[i]);
    if (r <= cumulative) {
      return formatBasisLabel(i, numQubits);
    }
  }
  return formatBasisLabel(dim - 1, numQubits);
}

export function simulateCircuit(circuit: Circuit): QuantumStateResult {
  const numQubits = circuit.qubits.length;

  if (numQubits === 0) {
    return {
      numQubits: 0,
      amplitudes: [],
      probabilities: [],
      qSpherePoints: [],
      blochVector: null,
      error: "Circuit has no qubits",
    };
  }

  if (numQubits > MAX_QUBITS) {
    return {
      numQubits,
      amplitudes: [],
      probabilities: [],
      qSpherePoints: [],
      blochVector: null,
      error: `Simulation limited to ${MAX_QUBITS} qubits for browser performance`,
    };
  }

  let state: Complex[] = Array.from({ length: 1 << numQubits }, () => c(0));
  state[0] = c(1);

  const sortedOps = [...circuit.operations]
    .filter((op) => op.type !== "barrier")
    .sort((a, b) => a.column - b.column || a.id.localeCompare(b.id));

  for (const op of sortedOps) {
    if (op.type === "measure") continue;
    const next = applyOperation(state, op, numQubits);
    if (!next) {
      return {
        numQubits,
        amplitudes: state,
        probabilities: [],
        qSpherePoints: [],
        blochVector: null,
        error: `Unsupported gate for simulation: ${op.type}`,
      };
    }
    state = next;
  }

  const probSum = state.reduce((sum, amp) => sum + cAbs2(amp), 0);
  if (Math.abs(probSum - 1) > 1e-6 && probSum > 0) {
    const norm = Math.sqrt(probSum);
    state = state.map((amp) => c(amp.re / norm, amp.im / norm));
  }

  const displayState = removeGlobalPhase(state);

  const probabilities: ProbabilityEntry[] = state.map((amp, i) => {
    const prob = Math.min(cAbs2(amp), 1);
    return {
      label: `|${formatBasisLabel(i, numQubits)}⟩`,
      probability: prob,
      percentage: prob * 100,
    };
  });

  const qSpherePoints: QSpherePoint[] = displayState
    .map((amp, i) => {
      const prob = Math.min(cAbs2(amp), 1);
      if (prob < PROB_THRESHOLD) return null;
      const coords = indexToQSphereCoords(i, numQubits);
      return {
        label: formatBasisLabel(i, numQubits),
        ...coords,
        probability: prob,
        phase: cPhase(amp),
        amplitude: Math.sqrt(prob),
      };
    })
    .filter((p): p is QSpherePoint => p !== null);

  return {
    numQubits,
    amplitudes: state,
    probabilities,
    qSpherePoints,
    blochVector: numQubits === 1 ? computeBlochVector(state) : null,
    error: null,
  };
}

/** Map phase to HSL color — aligned with Qiskit phase_to_rgb hue offset. */
export function phaseToColor(phase: number): string {
  const hue = (((phase + (Math.PI * 5) / 4) % (Math.PI * 2)) / (Math.PI * 2)) * 360;
  return `hsl(${hue}, 75%, 55%)`;
}
