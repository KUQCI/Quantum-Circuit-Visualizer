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
  h: "border-transparent bg-[var(--color-gate-h)] text-white",
  pauli: "border-transparent bg-[var(--color-gate-pauli)] text-white",
  phase: "border-transparent bg-[var(--color-gate-phase)] text-white",
  rotation: "border-transparent bg-[var(--color-gate-rotation)] text-[#161616]",
  two: "border-transparent bg-[var(--color-gate-two)] text-white",
  measure: "border-transparent bg-[var(--color-gate-measure)] text-[#161616]",
  barrier: "border-transparent bg-[var(--color-gate-barrier)]/30 text-[var(--color-muted-foreground)] border border-dashed border-[var(--color-gate-barrier)]",
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
