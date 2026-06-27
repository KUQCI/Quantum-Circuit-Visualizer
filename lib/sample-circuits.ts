import { Circuit } from "./circuit-schema";

export const bellStateCircuit: Circuit = {
  name: "Bell State",
  qubits: [
    { id: "q0", label: "q[0]" },
    { id: "q1", label: "q[1]" },
  ],
  classicalBits: [],
  operations: [
    {
      id: "op_bell_h",
      type: "h",
      label: "H",
      targets: ["q0"],
      controls: [],
      classicalTargets: [],
      column: 0,
    },
    {
      id: "op_bell_cx",
      type: "cx",
      label: "CX",
      targets: ["q1"],
      controls: ["q0"],
      classicalTargets: [],
      column: 1,
    },
  ],
};

export const ghzStateCircuit: Circuit = {
  name: "GHZ State",
  qubits: [
    { id: "q0", label: "q[0]" },
    { id: "q1", label: "q[1]" },
    { id: "q2", label: "q[2]" },
  ],
  classicalBits: [],
  operations: [
    {
      id: "op_ghz_h",
      type: "h",
      label: "H",
      targets: ["q0"],
      controls: [],
      classicalTargets: [],
      column: 0,
    },
    {
      id: "op_ghz_cx1",
      type: "cx",
      label: "CX",
      targets: ["q1"],
      controls: ["q0"],
      classicalTargets: [],
      column: 1,
    },
    {
      id: "op_ghz_cx2",
      type: "cx",
      label: "CX",
      targets: ["q2"],
      controls: ["q0"],
      classicalTargets: [],
      column: 2,
    },
  ],
};

export const simpleSuperpositionCircuit: Circuit = {
  name: "Simple Superposition",
  qubits: [{ id: "q0", label: "q[0]" }],
  classicalBits: [],
  operations: [
    {
      id: "op_sup_h",
      type: "h",
      label: "H",
      targets: ["q0"],
      controls: [],
      classicalTargets: [],
      column: 0,
    },
  ],
};

export const quantumTeleportationCircuit: Circuit = {
  name: "Quantum Teleportation (Placeholder)",
  qubits: [
    { id: "q0", label: "q[0]" },
    { id: "q1", label: "q[1]" },
    { id: "q2", label: "q[2]" },
  ],
  classicalBits: [
    { id: "c0", label: "c[0]" },
    { id: "c1", label: "c[1]" },
  ],
  operations: [
    {
      id: "op_tp_h0",
      type: "h",
      label: "H",
      targets: ["q1"],
      controls: [],
      classicalTargets: [],
      column: 0,
    },
    {
      id: "op_tp_cx01",
      type: "cx",
      label: "CX",
      targets: ["q1"],
      controls: ["q0"],
      classicalTargets: [],
      column: 1,
    },
    {
      id: "op_tp_cx12",
      type: "cx",
      label: "CX",
      targets: ["q2"],
      controls: ["q1"],
      classicalTargets: [],
      column: 2,
    },
    {
      id: "op_tp_h1",
      type: "h",
      label: "H",
      targets: ["q1"],
      controls: [],
      classicalTargets: [],
      column: 3,
    },
    {
      id: "op_tp_m0",
      type: "measure",
      label: "M",
      targets: ["q0"],
      controls: [],
      classicalTargets: ["c0"],
      column: 4,
    },
    {
      id: "op_tp_m1",
      type: "measure",
      label: "M",
      targets: ["q1"],
      controls: [],
      classicalTargets: ["c1"],
      column: 5,
    },
  ],
};

export const bellStateOpenQasmCode = `OPENQASM 2.0;
include "qelib1.inc";

qreg q[2];

h q[0];
cx q[0],q[1];
`;

export const bellStateQiskitCode = `from qiskit import QuantumCircuit

qc = QuantumCircuit(2)
qc.h(0)
qc.cx(0, 1)
`;

export const sampleCircuits = [
  bellStateCircuit,
  ghzStateCircuit,
  simpleSuperpositionCircuit,
  quantumTeleportationCircuit,
];

export const sampleCircuitsMap: Record<string, Circuit> = {
  bell: bellStateCircuit,
  ghz: ghzStateCircuit,
  superposition: simpleSuperpositionCircuit,
  teleportation: quantumTeleportationCircuit,
};
