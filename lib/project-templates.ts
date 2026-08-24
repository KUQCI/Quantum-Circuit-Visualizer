import type { Circuit } from "@/lib/circuit-schema";
import {
  bellStateCircuit,
  ghzStateCircuit,
  quantumTeleportationCircuit,
  simpleSuperpositionCircuit,
} from "@/lib/sample-circuits";

export type ProjectTemplate = {
  id: string;
  name: string;
  description: string;
  qubits: number;
  operations: number;
  circuit: Circuit;
};

const measurementDemoCircuit: Circuit = {
  name: "Measurement Demo",
  qubits: [{ id: "q0", label: "q[0]" }],
  classicalBits: [{ id: "c0", label: "c[0]" }],
  operations: [
    {
      id: "op_md_h",
      type: "h",
      label: "H",
      targets: ["q0"],
      controls: [],
      classicalTargets: [],
      column: 0,
    },
    {
      id: "op_md_m",
      type: "measure",
      label: "M",
      targets: ["q0"],
      controls: [],
      classicalTargets: ["c0"],
      column: 1,
    },
  ],
};

const teleportationStarter: Circuit = {
  ...structuredClone(quantumTeleportationCircuit),
  name: "Quantum Teleportation Starter",
  operations: quantumTeleportationCircuit.operations.slice(0, 3),
};

/** Sample circuits shown when the user has no saved projects. */
export const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    id: "tpl-bell",
    name: "Bell State",
    description: "Create a maximally entangled two-qubit Bell pair with H + CX.",
    qubits: 2,
    operations: 2,
    circuit: { ...structuredClone(bellStateCircuit), name: "Bell State" },
  },
  {
    id: "tpl-ghz",
    name: "GHZ State",
    description: "Three-qubit GHZ entanglement from a single H and two CNOTs.",
    qubits: 3,
    operations: 3,
    circuit: { ...structuredClone(ghzStateCircuit), name: "GHZ State" },
  },
  {
    id: "tpl-superposition",
    name: "Superposition",
    description: "Put one qubit into equal superposition with a Hadamard.",
    qubits: 1,
    operations: 1,
    circuit: {
      ...structuredClone(simpleSuperpositionCircuit),
      name: "Superposition",
    },
  },
  {
    id: "tpl-measure",
    name: "Measurement Demo",
    description: "Prepare superposition, then measure into classical bit 0.",
    qubits: 1,
    operations: 2,
    circuit: measurementDemoCircuit,
  },
  {
    id: "tpl-teleport",
    name: "Quantum Teleportation Starter",
    description:
      "Bell pair plus Alice’s message qubit — finish the protocol yourself.",
    qubits: 3,
    operations: 3,
    circuit: teleportationStarter,
  },
];
