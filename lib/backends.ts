export type BackendId =
  | "local-sampler"
  | "local-statevector"
  | "ibm-qasm-simulator"
  | "ibm-hardware";

export interface BackendDefinition {
  id: BackendId;
  name: string;
  description: string;
  /** Can run shot-based sampling in-browser */
  local: boolean;
  /** Requires IBM Quantum API credentials */
  requiresIbmApi: boolean;
  defaultShots: number;
  maxShots: number;
}

export const BACKENDS: BackendDefinition[] = [
  {
    id: "local-sampler",
    name: "Local simulator",
    description:
      "Shot-based sampling in your browser. Supports mid-circuit measurements and classical registers.",
    local: true,
    requiresIbmApi: false,
    defaultShots: 1024,
    maxShots: 8192,
  },
  {
    id: "local-statevector",
    name: "Statevector (live preview)",
    description:
      "Exact amplitudes updated as you edit. Ignores measurements (IBM Composer live mode).",
    local: true,
    requiresIbmApi: false,
    defaultShots: 0,
    maxShots: 0,
  },
  {
    id: "ibm-qasm-simulator",
    name: "IBM Qasm Simulator",
    description:
      "Run on IBM's cloud simulator via Qiskit Runtime. Export code and use your IBM Quantum account.",
    local: false,
    requiresIbmApi: true,
    defaultShots: 1024,
    maxShots: 8192,
  },
  {
    id: "ibm-hardware",
    name: "IBM Quantum hardware",
    description:
      "Submit to real QPUs through IBM Quantum Platform. Export as Runtime script to run on hardware.",
    local: false,
    requiresIbmApi: true,
    defaultShots: 1024,
    maxShots: 8192,
  },
];

export function getBackend(id: BackendId): BackendDefinition {
  return BACKENDS.find((b) => b.id === id) ?? BACKENDS[0];
}
