import { z } from "zod";

export const ParameterSchema = z.object({
  value: z.number(),
  display: z.string().optional(),
});

export const QubitSchema = z.object({
  id: z.string(),
  label: z.string(),
});

export const ClassicalBitSchema = z.object({
  id: z.string(),
  label: z.string(),
});

export const OperationSchema = z.object({
  id: z.string(),
  type: z.string(),
  label: z.string(),
  targets: z.array(z.string()),
  controls: z.array(z.string()).default([]),
  classicalTargets: z.array(z.string()).default([]),
  column: z.number().int().min(0),
  parameters: z.array(ParameterSchema).optional(),
});

export const CircuitSchema = z.object({
  name: z.string(),
  qubits: z.array(QubitSchema).min(1),
  classicalBits: z.array(ClassicalBitSchema),
  operations: z.array(OperationSchema),
});

export type Parameter = z.infer<typeof ParameterSchema>;
export type Qubit = z.infer<typeof QubitSchema>;
export type ClassicalBit = z.infer<typeof ClassicalBitSchema>;
export type Operation = z.infer<typeof OperationSchema>;
export type Circuit = z.infer<typeof CircuitSchema>;

export const SUPPORTED_GATES = [
  "h",
  "x",
  "y",
  "z",
  "s",
  "t",
  "rx",
  "ry",
  "rz",
  "cx",
  "cz",
  "swap",
  "measure",
  "barrier",
] as const;

export type SupportedGate = (typeof SUPPORTED_GATES)[number];

export function createEmptyCircuit(
  name = "Untitled Circuit",
  numQubits = 2,
  numClassicalBits = 0
): Circuit {
  return {
    name,
    qubits: Array.from({ length: numQubits }, (_, i) => ({
      id: `q${i}`,
      label: `q[${i}]`,
    })),
    classicalBits: Array.from({ length: numClassicalBits }, (_, i) => ({
      id: `c${i}`,
      label: `c[${i}]`,
    })),
    operations: [],
  };
}

export function generateOperationId(): string {
  return `op_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function getCircuitDepth(circuit: Circuit): number {
  if (circuit.operations.length === 0) return 0;
  return Math.max(...circuit.operations.map((op) => op.column)) + 1;
}

export function getGateLabel(type: string): string {
  const labels: Record<string, string> = {
    h: "H",
    x: "X",
    y: "Y",
    z: "Z",
    s: "S",
    sdg: "S†",
    t: "T",
    tdg: "T†",
    p: "P",
    id: "I",
    sx: "√X",
    sxdg: "√X†",
    u: "U",
    rx: "RX",
    ry: "RY",
    rz: "RZ",
    cx: "CX",
    cz: "CZ",
    swap: "SWAP",
    rxx: "RXX",
    rzz: "RZZ",
    ccx: "CCX",
    rccx: "RCCX",
    rc3x: "RC3X",
    measure: "M",
    reset: "|0⟩",
    barrier: "‖",
    control: "●",
  };
  return labels[type] ?? type.toUpperCase();
}

export function qubitIdFromIndex(index: number): string {
  return `q${index}`;
}

export function classicalBitIdFromIndex(index: number): string {
  return `c${index}`;
}

export function qubitIndexFromId(id: string): number {
  return parseInt(id.replace("q", ""), 10);
}

export function classicalBitIndexFromId(id: string): number {
  return parseInt(id.replace("c", ""), 10);
}
