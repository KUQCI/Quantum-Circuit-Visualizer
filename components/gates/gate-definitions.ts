export interface GateDefinition {
  type: string;
  label: string;
  category: "single" | "two" | "measurement" | "barrier";
  colorGroup: "h" | "pauli" | "phase" | "rotation" | "two" | "measure" | "barrier";
  defaultParams?: { value: number; display: string };
  description: string;
}

export const GATE_LIBRARY_UI: GateDefinition[] = [
  { type: "h", label: "H", category: "single", colorGroup: "h", description: "Hadamard gate" },
  { type: "x", label: "X", category: "single", colorGroup: "pauli", description: "Pauli-X (NOT) gate" },
  { type: "y", label: "Y", category: "single", colorGroup: "pauli", description: "Pauli-Y gate" },
  { type: "z", label: "Z", category: "single", colorGroup: "pauli", description: "Pauli-Z gate" },
  { type: "s", label: "S", category: "single", colorGroup: "phase", description: "Phase gate (√Z)" },
  { type: "t", label: "T", category: "single", colorGroup: "phase", description: "T gate (√S)" },
  {
    type: "rx",
    label: "RX",
    category: "single",
    colorGroup: "rotation",
    defaultParams: { value: Math.PI / 2, display: "pi/2" },
    description: "Rotation around X axis",
  },
  {
    type: "ry",
    label: "RY",
    category: "single",
    colorGroup: "rotation",
    defaultParams: { value: Math.PI / 2, display: "pi/2" },
    description: "Rotation around Y axis",
  },
  {
    type: "rz",
    label: "RZ",
    category: "single",
    colorGroup: "rotation",
    defaultParams: { value: Math.PI / 2, display: "pi/2" },
    description: "Rotation around Z axis",
  },
  { type: "cx", label: "CX", category: "two", colorGroup: "two", description: "Controlled-NOT gate" },
  { type: "cz", label: "CZ", category: "two", colorGroup: "two", description: "Controlled-Z gate" },
  { type: "swap", label: "SWAP", category: "two", colorGroup: "two", description: "Swap two qubits" },
  { type: "measure", label: "M", category: "measurement", colorGroup: "measure", description: "Measure qubit to classical bit" },
  { type: "barrier", label: "‖", category: "barrier", colorGroup: "barrier", description: "Circuit barrier" },
];

export const GATE_CATEGORIES = [
  { id: "single", label: "Single Qubit" },
  { id: "two", label: "Two Qubit" },
  { id: "measurement", label: "Measurement" },
  { id: "barrier", label: "Barrier" },
] as const;

const GATE_COLOR_MAP: Record<GateDefinition["colorGroup"], string> = {
  h: "border-[var(--color-gate-h)] bg-[var(--color-gate-h)]/20 text-[#ff7b72]",
  pauli: "border-[var(--color-gate-pauli)] bg-[var(--color-gate-pauli)]/20 text-[#79c0ff]",
  phase: "border-[var(--color-gate-phase)] bg-[var(--color-gate-phase)]/20 text-[#d2a8ff]",
  rotation: "border-[var(--color-gate-rotation)] bg-[var(--color-gate-rotation)]/20 text-[#7ee787]",
  two: "border-[var(--color-gate-two)] bg-[var(--color-gate-two)]/20 text-[#d2a8ff]",
  measure: "border-[var(--color-gate-measure)] bg-[var(--color-gate-measure)]/20 text-[#56d4dd]",
  barrier: "border-[var(--color-gate-barrier)] bg-[var(--color-gate-barrier)]/15 text-[#8b949e]",
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
