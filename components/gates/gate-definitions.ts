export interface GateDefinition {
  type: string;
  label: string;
  fullName: string;
  qiskitExample: string;
  category: "single" | "two" | "three" | "measurement" | "barrier" | "modifier";
  colorGroup:
    | "h"
    | "pauli"
    | "phase"
    | "rotation"
    | "two"
    | "three"
    | "measure"
    | "barrier"
    | "nonunitary"
    | "modifier";
  symbol?:
    | "text"
    | "measure"
    | "barrier"
    | "swap"
    | "control"
    | "reset"
    | "identity"
    | "sqrtx"
    | "if";
  defaultParams?: { value: number; display: string };
  defaultParams3?: [{ value: number; display: string }, { value: number; display: string }, { value: number; display: string }];
  description: string;
}

export const GATE_LIBRARY_UI: GateDefinition[] = [
  {
    type: "h",
    label: "H",
    fullName: "Hadamard (H)",
    qiskitExample: "qc.h(0)",
    category: "single",
    colorGroup: "h",
    description:
      "Creates superposition — maps |0⟩ and |1⟩ to equal combinations on the Bloch sphere.",
  },
  {
    type: "x",
    label: "X",
    fullName: "Pauli-X (NOT)",
    qiskitExample: "qc.x(0)",
    category: "single",
    colorGroup: "pauli",
    description: "Bit-flip gate, quantum equivalent of a NOT gate.",
  },
  {
    type: "y",
    label: "Y",
    fullName: "Pauli-Y",
    qiskitExample: "qc.y(0)",
    category: "single",
    colorGroup: "pauli",
    description: "Pauli-Y rotation: combination of bit and phase flip.",
  },
  {
    type: "z",
    label: "Z",
    fullName: "Pauli-Z",
    qiskitExample: "qc.z(0)",
    category: "single",
    colorGroup: "pauli",
    description: "Phase-flip gate — adds a π phase to |1⟩.",
  },
  {
    type: "id",
    label: "I",
    fullName: "Identity (I)",
    qiskitExample: "qc.id(0)",
    category: "single",
    colorGroup: "pauli",
    symbol: "identity",
    description: "No operation applied for one unit of gate time.",
  },
  {
    type: "sx",
    label: "√X",
    fullName: "√X (Square-root NOT)",
    qiskitExample: "qc.sx(0)",
    category: "single",
    colorGroup: "rotation",
    symbol: "sqrtx",
    description: "Square root of X gate. Applying twice produces the X gate.",
  },
  {
    type: "sxdg",
    label: "√X†",
    fullName: "√X† (Square-root NOT dagger)",
    qiskitExample: "qc.sxdg(0)",
    category: "single",
    colorGroup: "rotation",
    symbol: "sqrtx",
    description: "Inverse of the √X gate.",
  },
  {
    type: "s",
    label: "S",
    fullName: "Phase (S)",
    qiskitExample: "qc.s(0)",
    category: "single",
    colorGroup: "phase",
    description: "√Z gate — quarter-turn phase on the Bloch sphere.",
  },
  {
    type: "sdg",
    label: "S†",
    fullName: "S† (S dagger)",
    qiskitExample: "qc.sdg(0)",
    category: "single",
    colorGroup: "phase",
    description: "Inverse of the S gate.",
  },
  {
    type: "t",
    label: "T",
    fullName: "T gate",
    qiskitExample: "qc.t(0)",
    category: "single",
    colorGroup: "phase",
    description: "√S gate — eighth-turn phase, common in fault-tolerant circuits.",
  },
  {
    type: "tdg",
    label: "T†",
    fullName: "T† (T dagger)",
    qiskitExample: "qc.tdg(0)",
    category: "single",
    colorGroup: "phase",
    description: "Inverse of the T gate.",
  },
  {
    type: "p",
    label: "P",
    fullName: "Phase (P)",
    qiskitExample: "qc.p(pi/2, 0)",
    category: "single",
    colorGroup: "phase",
    defaultParams: { value: Math.PI / 2, display: "pi/2" },
    description: "Applies a phase of e^(iθ) to the |1⟩ state.",
  },
  {
    type: "rx",
    label: "RX",
    fullName: "Rotate-X (RX)",
    qiskitExample: "qc.rx(pi/2, 0)",
    category: "single",
    colorGroup: "rotation",
    defaultParams: { value: Math.PI / 2, display: "pi/2" },
    description: "Rotation around the X axis of the Bloch sphere by angle θ.",
  },
  {
    type: "ry",
    label: "RY",
    fullName: "Rotate-Y (RY)",
    qiskitExample: "qc.ry(pi/2, 0)",
    category: "single",
    colorGroup: "rotation",
    defaultParams: { value: Math.PI / 2, display: "pi/2" },
    description: "Rotation around the Y axis of the Bloch sphere by angle θ.",
  },
  {
    type: "rz",
    label: "RZ",
    fullName: "Rotate-Z (RZ)",
    qiskitExample: "qc.rz(pi/2, 0)",
    category: "single",
    colorGroup: "rotation",
    defaultParams: { value: Math.PI / 2, display: "pi/2" },
    description: "Rotation around the Z axis of the Bloch sphere by angle θ.",
  },
  {
    type: "u",
    label: "U",
    fullName: "U gate (U3)",
    qiskitExample: "qc.u(pi/2, 0, pi, 0)",
    category: "single",
    colorGroup: "rotation",
    defaultParams3: [
      { value: Math.PI / 2, display: "pi/2" },
      { value: 0, display: "0" },
      { value: Math.PI, display: "pi" },
    ],
    description:
      "Universal single-qubit gate with three parameters (θ, φ, λ).",
  },
  {
    type: "cx",
    label: "⊕",
    fullName: "Controlled-NOT (CNOT / CX)",
    qiskitExample: "qc.cx(0, 1)",
    category: "two",
    colorGroup: "two",
    symbol: "control",
    description:
      "Flips target qubit if control qubit is |1⟩. Essential for entanglement.",
  },
  {
    type: "cz",
    label: "CZ",
    fullName: "Controlled-Z (CZ)",
    qiskitExample: "qc.cz(0, 1)",
    category: "two",
    colorGroup: "two",
    symbol: "control",
    description: "Applies Z to target when control is |1⟩. Symmetric two-qubit gate.",
  },
  {
    type: "swap",
    label: "⇄",
    fullName: "SWAP",
    qiskitExample: "qc.swap(0, 1)",
    category: "two",
    colorGroup: "two",
    symbol: "swap",
    description: "Exchanges the states of two qubits.",
  },
  {
    type: "rxx",
    label: "RXX",
    fullName: "RXX gate",
    qiskitExample: "qc.rxx(pi/2, 0, 1)",
    category: "two",
    colorGroup: "two",
    defaultParams: { value: Math.PI / 2, display: "pi/2" },
    description: "Two-qubit rotation exp(-i θ/2 X⊗X).",
  },
  {
    type: "rzz",
    label: "RZZ",
    fullName: "RZZ gate",
    qiskitExample: "qc.rzz(pi/2, 0, 1)",
    category: "two",
    colorGroup: "two",
    defaultParams: { value: Math.PI / 2, display: "pi/2" },
    description: "Two-qubit rotation around Z⊗Z by angle θ.",
  },
  {
    type: "ccx",
    label: "CCX",
    fullName: "Toffoli (CCX)",
    qiskitExample: "qc.ccx(0, 1, 2)",
    category: "three",
    colorGroup: "three",
    symbol: "control",
    description:
      "Double controlled-NOT — flips target when both controls are |1⟩.",
  },
  {
    type: "rccx",
    label: "RCCX",
    fullName: "Simplified Toffoli (RCCX)",
    qiskitExample: "qc.rccx(0, 1, 2)",
    category: "three",
    colorGroup: "three",
    symbol: "control",
    description: "Simplified Toffoli gate up to relative phases.",
  },
  {
    type: "rc3x",
    label: "RC3X",
    fullName: "Simplified 3-controlled Toffoli",
    qiskitExample: "qc.rc3x(0, 1, 2, 3)",
    category: "three",
    colorGroup: "three",
    symbol: "control",
    description: "Simplified 3-controlled Toffoli up to relative phases.",
  },
  {
    type: "measure",
    label: "M",
    fullName: "Measure",
    qiskitExample: "qc.measure(0, 0)",
    category: "measurement",
    colorGroup: "measure",
    symbol: "measure",
    description: "Collapses qubit state and stores result in a classical bit.",
  },
  {
    type: "reset",
    label: "|0⟩",
    fullName: "Reset",
    qiskitExample: "qc.reset(0)",
    category: "measurement",
    colorGroup: "nonunitary",
    symbol: "reset",
    description: "Returns qubit to |0⟩ regardless of prior state.",
  },
  {
    type: "barrier",
    label: "‖",
    fullName: "Barrier",
    qiskitExample: "qc.barrier()",
    category: "barrier",
    colorGroup: "barrier",
    symbol: "barrier",
    description: "Visual separator — prevents optimization across this point.",
  },
  {
    type: "control",
    label: "●",
    fullName: "Control modifier",
    qiskitExample: "c",
    category: "modifier",
    colorGroup: "modifier",
    symbol: "control",
    description:
      "Drag onto a gate to add a control qubit. The target operation runs only when control is |1⟩.",
  },
];

export const GATE_CATEGORIES = [
  { id: "single", label: "Single Qubit" },
  { id: "two", label: "Two Qubit" },
  { id: "three", label: "Three Qubit" },
  { id: "measurement", label: "Measurement & Reset" },
  { id: "barrier", label: "Barrier" },
  { id: "modifier", label: "Modifiers" },
] as const;

const GATE_COLOR_MAP: Record<GateDefinition["colorGroup"], string> = {
  h: "border-transparent bg-[var(--color-gate-h)] text-white",
  pauli: "border-transparent bg-[var(--color-gate-pauli)] text-white",
  phase: "border-transparent bg-[var(--color-gate-phase)] text-white",
  rotation: "border-transparent bg-[var(--color-gate-rotation)] text-[#161616]",
  two: "border-transparent bg-[var(--color-gate-two)] text-white",
  three: "border-transparent bg-[var(--color-gate-three)] text-white",
  measure: "border-transparent bg-[var(--color-gate-measure)] text-[#161616]",
  nonunitary: "border-transparent bg-[var(--color-gate-nonunitary)] text-[#161616]",
  barrier:
    "border-transparent bg-[var(--color-gate-barrier)]/30 text-[var(--color-muted-foreground)] border border-dashed border-[var(--color-gate-barrier)]",
  modifier:
    "border-transparent bg-[var(--color-secondary)] text-[var(--color-foreground)] border border-[var(--color-border)]",
};

export function getGateColor(gate: GateDefinition | string): string {
  if (typeof gate === "string") {
    const def = GATE_LIBRARY_UI.find((g) => g.type === gate);
    return def ? GATE_COLOR_MAP[def.colorGroup] : GATE_COLOR_MAP.pauli;
  }
  return GATE_COLOR_MAP[gate.colorGroup];
}

export function getGateColorByType(type: string): string {
  return getGateColor(type);
}

export function getGateByType(type: string): GateDefinition | undefined {
  return GATE_LIBRARY_UI.find((g) => g.type === type);
}

export const COLUMN_WIDTH = 72;
export const WIRE_HEIGHT = 56;
export const WIRE_LABEL_WIDTH = 56;

export function columnToX(column: number): number {
  return WIRE_LABEL_WIDTH + column * COLUMN_WIDTH;
}

export function qubitToY(qubitIndex: number): number {
  return qubitIndex * WIRE_HEIGHT;
}

export function getQubitsNeeded(gate: GateDefinition): number {
  switch (gate.category) {
    case "three":
      return gate.type === "rc3x" ? 4 : 3;
    case "two":
      return 2;
    default:
      return 1;
  }
}
