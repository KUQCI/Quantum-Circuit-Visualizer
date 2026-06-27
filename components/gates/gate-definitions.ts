export interface GateDefinition {
  type: string;
  label: string;
  fullName: string;
  qiskitExample: string;
  category: "single" | "two" | "measurement" | "barrier";
  colorGroup: "h" | "pauli" | "phase" | "rotation" | "two" | "measure" | "barrier";
  symbol?: "text" | "measure" | "barrier" | "swap" | "control";
  defaultParams?: { value: number; display: string };
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
    description: "Creates superposition — maps |0⟩ and |1⟩ to equal combinations.",
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
    type: "s",
    label: "S",
    fullName: "Phase (S)",
    qiskitExample: "qc.s(0)",
    category: "single",
    colorGroup: "phase",
    description: "√Z gate — quarter-turn phase on the Bloch sphere.",
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
    type: "rx",
    label: "RX",
    fullName: "Rotate-X (RX)",
    qiskitExample: "qc.rx(pi/2, 0)",
    category: "single",
    colorGroup: "rotation",
    symbol: "text",
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
    symbol: "text",
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
    symbol: "text",
    defaultParams: { value: Math.PI / 2, display: "pi/2" },
    description: "Rotation around the Z axis of the Bloch sphere by angle θ.",
  },
  {
    type: "cx",
    label: "⊕",
    fullName: "Controlled-NOT (CNOT / CX)",
    qiskitExample: "qc.cx(0, 1)",
    category: "two",
    colorGroup: "two",
    symbol: "control",
    description: "Flips target qubit if control qubit is |1⟩. Essential for entanglement.",
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
    type: "barrier",
    label: "‖",
    fullName: "Barrier",
    qiskitExample: "qc.barrier()",
    category: "barrier",
    colorGroup: "barrier",
    symbol: "barrier",
    description: "Visual separator — prevents optimization across this point.",
  },
];

export const GATE_CATEGORIES = [
  { id: "single", label: "Single Qubit" },
  { id: "two", label: "Two Qubit" },
  { id: "measurement", label: "Measurement" },
  { id: "barrier", label: "Barrier" },
] as const;

const GATE_COLOR_MAP: Record<GateDefinition["colorGroup"], string> = {
  h: "border-transparent bg-[var(--color-gate-h)] text-white",
  pauli: "border-transparent bg-[var(--color-gate-pauli)] text-white",
  phase: "border-transparent bg-[var(--color-gate-phase)] text-white",
  rotation: "border-transparent bg-[var(--color-gate-rotation)] text-[#161616]",
  two: "border-transparent bg-[var(--color-gate-two)] text-white",
  measure: "border-transparent bg-[var(--color-gate-measure)] text-[#161616]",
  barrier:
    "border-transparent bg-[var(--color-gate-barrier)]/30 text-[var(--color-muted-foreground)] border border-dashed border-[var(--color-gate-barrier)]",
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
