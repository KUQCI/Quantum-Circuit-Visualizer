export interface GateDefinition {
  type: string;
  label: string;
  category: "single" | "two" | "measurement" | "barrier";
  defaultParams?: { value: number; display: string };
  description: string;
}

export const GATE_LIBRARY_UI: GateDefinition[] = [
  { type: "h", label: "H", category: "single", description: "Hadamard gate" },
  { type: "x", label: "X", category: "single", description: "Pauli-X (NOT) gate" },
  { type: "y", label: "Y", category: "single", description: "Pauli-Y gate" },
  { type: "z", label: "Z", category: "single", description: "Pauli-Z gate" },
  { type: "s", label: "S", category: "single", description: "Phase gate (√Z)" },
  { type: "t", label: "T", category: "single", description: "T gate (√S)" },
  {
    type: "rx",
    label: "RX",
    category: "single",
    defaultParams: { value: Math.PI / 2, display: "pi/2" },
    description: "Rotation around X axis",
  },
  {
    type: "ry",
    label: "RY",
    category: "single",
    defaultParams: { value: Math.PI / 2, display: "pi/2" },
    description: "Rotation around Y axis",
  },
  {
    type: "rz",
    label: "RZ",
    category: "single",
    defaultParams: { value: Math.PI / 2, display: "pi/2" },
    description: "Rotation around Z axis",
  },
  { type: "cx", label: "CX", category: "two", description: "Controlled-NOT gate" },
  { type: "cz", label: "CZ", category: "two", description: "Controlled-Z gate" },
  { type: "swap", label: "SWAP", category: "two", description: "Swap two qubits" },
  { type: "measure", label: "M", category: "measurement", description: "Measure qubit to classical bit" },
  { type: "barrier", label: "‖", category: "barrier", description: "Circuit barrier" },
];

export const GATE_CATEGORIES = [
  { id: "single", label: "Single Qubit" },
  { id: "two", label: "Two Qubit" },
  { id: "measurement", label: "Measurement" },
  { id: "barrier", label: "Barrier" },
] as const;

export function getGateColor(category: GateDefinition["category"]): string {
  switch (category) {
    case "single":
      return "bg-indigo-100 border-indigo-300 text-indigo-700";
    case "two":
      return "bg-violet-100 border-violet-300 text-violet-700";
    case "measurement":
      return "bg-sky-100 border-sky-300 text-sky-700";
    case "barrier":
      return "bg-slate-100 border-slate-300 text-slate-600";
  }
}

export function getGateByType(type: string): GateDefinition | undefined {
  return GATE_LIBRARY_UI.find((g) => g.type === type);
}

export const COLUMN_WIDTH = 72;
export const WIRE_HEIGHT = 56;
export const WIRE_LABEL_WIDTH = 56;
