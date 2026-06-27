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

function bitCount(n: number): number {
  let count = 0;
  while (n) {
    count += n & 1;
    n >>= 1;
  }
  return count;
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

function getSingleQubitMatrix(type: string, theta = 0): Complex[][] | null {
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
    case "sx": {
      const c0 = Math.cos(Math.PI / 4);
      const s0 = Math.sin(Math.PI / 4);
      return [
        [c(0.5 + c0 / 2, 0.5 - c0 / 2), c(0, -s0 / 2)],
        [c(0, -s0 / 2), c(0.5 + c0 / 2, 0.5 - c0 / 2)],
      ];
    }
    case "sxdg": {
      const c0 = Math.cos(-Math.PI / 4);
      const s0 = Math.sin(-Math.PI / 4);
      return [
        [c(0.5 + c0 / 2, 0.5 - c0 / 2), c(0, -s0 / 2)],
        [c(0, -s0 / 2), c(0.5 + c0 / 2, 0.5 - c0 / 2)],
      ];
    }
    case "rx":
      return rx(theta);
    case "ry":
      return ry(theta);
    case "rz":
      return rz(theta);
    default:
      return null;
  }
}

function getTwoQubitMatrix(type: string): Complex[][] | null {
  const i2 = identity(2);
  const x = getSingleQubitMatrix("x")!;
  const z = getSingleQubitMatrix("z")!;

  function kron(a: Complex[][], b: Complex[][]): Complex[][] {
    const result: Complex[][] = [];
    for (let i = 0; i < a.length; i++) {
      for (let j = 0; j < b.length; j++) {
        const row: Complex[] = [];
        for (let k = 0; k < a.length; k++) {
          for (let l = 0; l < b.length; l++) {
            row.push(cMul(a[i][k], b[j][l]));
          }
        }
        result.push(row);
      }
    }
    return result;
  }

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
      const cz: Complex[][] = identity(4);
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
      const newTBit = j;
      const iOther = i & ~(1 << (numQubits - 1 - target));
      const iNew = iOther | (newTBit << (numQubits - 1 - target));
      result[iNew] = cAdd(result[iNew], cMul(matrix[j][tBit], state[i]));
    }
  }
  return result;
}

function applyTwoQubitGate(
  state: Complex[],
  matrix: Complex[][],
  control: number,
  target: number,
  numQubits: number
): Complex[] {
  const dim = 1 << numQubits;
  const result = state.map(() => c(0));

  const qubits = Array.from({ length: numQubits }, (_, i) => i);
  const rest = qubits.filter((q) => q !== control && q !== target);
  const ordered = [control, target, ...rest];

  for (let i = 0; i < dim; i++) {
    const bits: number[] = [];
    for (let q = 0; q < numQubits; q++) {
      bits[q] = (i >> (numQubits - 1 - q)) & 1;
    }

    const cBit = bits[control];
    const tBit = bits[target];

    for (let cNew = 0; cNew < 2; cNew++) {
      for (let tNew = 0; tNew < 2; tNew++) {
        const row = cNew * 2 + tNew;
        const col = cBit * 2 + tBit;
        const newBits = [...bits];
        newBits[control] = cNew;
        newBits[target] = tNew;
        let iNew = 0;
        for (let q = 0; q < numQubits; q++) {
          iNew = (iNew << 1) | newBits[q];
        }
        result[iNew] = cAdd(result[iNew], cMul(matrix[row][col], state[i]));
      }
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

function indexToQSphereCoords(
  index: number,
  numQubits: number
): { x: number; y: number; z: number } {
  const dim = 1 << numQubits;
  const theta = (Math.PI * bitCount(index)) / numQubits;
  const phi = (2 * Math.PI * index) / dim;
  const sinTheta = Math.sin(theta);
  return {
    x: sinTheta * Math.cos(phi),
    y: sinTheta * Math.sin(phi),
    z: Math.cos(theta),
  };
}

function applyOperation(
  state: Complex[],
  op: Operation,
  numQubits: number
): Complex[] | null {
  if (op.type === "barrier" || op.type === "measure" || op.type === "reset") {
    return state;
  }

  if (op.type === "swap" && op.controls.length === 0 && op.targets.length === 2) {
    const q1 = qubitIndexFromId(op.targets[0]);
    const q2 = qubitIndexFromId(op.targets[1]);
    const matrix = getTwoQubitMatrix("swap");
    if (!matrix) return null;
    return applyTwoQubitGate(state, matrix, q1, q2, numQubits);
  }

  const singleMatrix = getSingleQubitMatrix(
    op.type,
    op.parameters?.[0]?.value ?? 0
  );
  if (singleMatrix && op.targets.length === 1) {
    const target = qubitIndexFromId(op.targets[0]);
    return applySingleQubitGate(state, singleMatrix, target, numQubits);
  }

  if (op.controls.length === 1 && op.targets.length === 1) {
    const control = qubitIndexFromId(op.controls[0]);
    const target = qubitIndexFromId(op.targets[0]);
    const matrix = getTwoQubitMatrix(op.type);
    if (!matrix) return null;
    return applyTwoQubitGate(state, matrix, control, target, numQubits);
  }

  return null;
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

  const dim = 1 << numQubits;
  let state: Complex[] = Array.from({ length: dim }, () => c(0));
  state[0] = c(1);

  const sortedOps = [...circuit.operations]
    .filter((op) => op.type !== "barrier")
    .sort((a, b) => a.column - b.column);

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

  const probabilities: ProbabilityEntry[] = state.map((amp, i) => {
    const prob = cAbs2(amp);
    return {
      label: `|${formatBasisLabel(i, numQubits)}⟩`,
      probability: prob,
      percentage: prob * 100,
    };
  });

  const qSpherePoints: QSpherePoint[] = state
    .map((amp, i) => {
      const prob = cAbs2(amp);
      if (prob < 1e-10) return null;
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

export function phaseToColor(phase: number): string {
  const hue = ((phase + Math.PI) / (2 * Math.PI)) * 360;
  return `hsl(${hue}, 75%, 55%)`;
}
