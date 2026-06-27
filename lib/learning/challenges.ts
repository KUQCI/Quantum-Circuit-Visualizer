import { createEmptyCircuit } from "@/lib/circuit-schema";
import type { Circuit } from "@/lib/circuit-schema";
import { bellStateCircuit, simpleSuperpositionCircuit } from "@/lib/sample-circuits";
import type { ChallengeDefinition } from "./types";

function brokenBellCircuit(): Circuit {
  return {
    ...structuredClone(bellStateCircuit),
    name: "Fix Me: Bell State",
    operations: [
      {
        id: "broken_cx",
        type: "cx",
        label: "CX",
        targets: ["q1"],
        controls: ["q0"],
        classicalTargets: [],
        column: 0,
      },
      {
        id: "broken_h",
        type: "h",
        label: "H",
        targets: ["q0"],
        controls: [],
        classicalTargets: [],
        column: 1,
      },
    ],
  };
}

export const CHALLENGES: ChallengeDefinition[] = [
  {
    id: "superposition-sprint",
    title: "Superposition Sprint",
    description: "Build H on q[0] as fast as you can.",
    difficulty: "beginner",
    xpReward: 100,
    challengeType: "build",
    starterCircuit: createEmptyCircuit("Challenge: Superposition", 1),
    successCondition: {
      type: "hasGateOnQubit",
      gate: "h",
      target: "q0",
    },
    hint: "One H gate on q[0].",
    quantaIntro: "Speed run! One gate, maximum quantum.",
    quantaHint: "H on q[0] — that's the whole challenge.",
    quantaSuccess: "Superposition sprint complete!",
    quantaIncorrect: "Need H on q[0].",
    order: 1,
  },
  {
    id: "pauli-flip",
    title: "Pauli Flip",
    description: "Apply X then Z on q[0].",
    difficulty: "beginner",
    xpReward: 100,
    challengeType: "build",
    starterCircuit: createEmptyCircuit("Challenge: Pauli Flip", 1),
    successCondition: {
      type: "operationOrder",
      operations: [
        { gate: "x", target: "q0" },
        { gate: "z", target: "q0" },
      ],
    },
    hint: "X first, then Z — both on q[0].",
    quantaIntro: "Pauli parade: X then Z.",
    quantaHint: "Column order: X, then Z on q[0].",
    quantaSuccess: "Pauli Pro material!",
    quantaIncorrect: "Order: X on q[0], then Z on q[0].",
    order: 2,
  },
  {
    id: "measurement-check",
    title: "Measurement Check",
    description: "Measure q[0] into c[0].",
    difficulty: "beginner",
    xpReward: 100,
    challengeType: "build",
    starterCircuit: createEmptyCircuit("Challenge: Measure", 1, 1),
    successCondition: {
      type: "hasMeasurement",
      qubit: "q0",
      classical: "c0",
    },
    hint: "Measure gate linking q[0] to c[0].",
    quantaIntro: "Collapse time — measure q[0].",
    quantaHint: "Gray measure tile on q[0].",
    quantaSuccess: "Measurement masterstroke!",
    quantaIncorrect: "Measure q[0] → c[0].",
    order: 3,
  },
  {
    id: "bell-pair-builder",
    title: "Bell Pair Builder",
    description: "Build H on q[0] and CX q[0]→q[1].",
    difficulty: "intermediate",
    xpReward: 175,
    challengeType: "build",
    starterCircuit: createEmptyCircuit("Challenge: Bell Pair", 2),
    successCondition: {
      type: "operationOrder",
      operations: [
        { gate: "h", target: "q0" },
        { gate: "cx", control: "q0", target: "q1" },
      ],
    },
    hint: "Classic Bell: H then CNOT.",
    quantaIntro: "Build the Bell pair — entanglement awaits!",
    quantaHint: "H q[0], CX q[0]→q[1].",
    quantaSuccess: "Bell pair built!",
    quantaIncorrect: "H on q[0], then CX control q[0] target q[1].",
    order: 4,
  },
  {
    id: "fix-broken-circuit",
    title: "Fix the Broken Circuit",
    description: "The Bell state gates are in the wrong order. Fix it!",
    difficulty: "intermediate",
    xpReward: 175,
    challengeType: "fix",
    starterCircuit: brokenBellCircuit(),
    successCondition: {
      type: "operationOrder",
      operations: [
        { gate: "h", target: "q0" },
        { gate: "cx", control: "q0", target: "q1" },
      ],
    },
    hint: "H must come before CX for a proper Bell state.",
    quantaIntro: "Something's scrambled — debug this entangler!",
    quantaHint: "Swap order: H first, then CX.",
    quantaSuccess: "Debugger duck approves — circuit fixed!",
    quantaIncorrect: "H before CX — check column order.",
    order: 5,
  },
  {
    id: "match-target-circuit",
    title: "Match the Target Circuit",
    description: "Reproduce the target superposition circuit exactly.",
    difficulty: "intermediate",
    xpReward: 175,
    challengeType: "match",
    starterCircuit: createEmptyCircuit("Challenge: Match", 1),
    targetCircuit: structuredClone(simpleSuperpositionCircuit),
    successCondition: {
      type: "exactCircuitMatch",
      circuit: simpleSuperpositionCircuit,
    },
    hint: "Single H on q[0] — nothing else.",
    quantaIntro: "Mirror the target — precision matters.",
    quantaHint: "Match the H gate placement exactly.",
    quantaSuccess: "Perfect match!",
    quantaIncorrect: "Compare gate types and positions with the target.",
    order: 6,
  },
  {
    id: "qiskit-code-to-canvas",
    title: "Qiskit Code to Canvas",
    description: "Build the circuit shown in the Qiskit snippet.",
    difficulty: "intermediate",
    xpReward: 175,
    challengeType: "import",
    starterCircuit: createEmptyCircuit("Challenge: Import", 2),
    importCode: `from qiskit import QuantumCircuit
qc = QuantumCircuit(2)
qc.h(0)
qc.cx(0, 1)`,
    successCondition: {
      type: "operationOrder",
      operations: [
        { gate: "h", target: "q0" },
        { gate: "cx", control: "q0", target: "q1" },
      ],
    },
    hint: "H on q[0], CX q[0]→q[1] — same as Bell state.",
    quantaIntro: "Read the code, build the canvas.",
    quantaHint: "Two gates: H then CX.",
    quantaSuccess: "Code translated to quantum art!",
    quantaIncorrect: "Build H on q[0] and CX q[0]→q[1].",
    order: 7,
  },
  {
    id: "canvas-to-qiskit-code",
    title: "Canvas to Qiskit Code",
    description: "Build the Bell circuit and export the Qiskit code.",
    difficulty: "advanced",
    xpReward: 250,
    challengeType: "export",
    starterCircuit: createEmptyCircuit("Challenge: Export", 2),
    targetCircuit: structuredClone(bellStateCircuit),
    successCondition: {
      type: "all",
      conditions: [
        {
          type: "operationOrder",
          operations: [
            { gate: "h", target: "q0" },
            { gate: "cx", control: "q0", target: "q1" },
          ],
        },
        { type: "actionExport" },
      ],
    },
    hint: "Build Bell state, then copy the Qiskit code.",
    quantaIntro: "Build it, then export — full round trip!",
    quantaHint: "Bell circuit + Copy button in code panel.",
    quantaSuccess: "Canvas ↔ Qiskit mastery unlocked!",
    quantaIncorrect: "Build Bell state and copy the generated code.",
    order: 8,
  },
];

export function getChallengeById(id: string): ChallengeDefinition | undefined {
  return CHALLENGES.find((c) => c.id === id);
}

export const CHALLENGE_IDS = CHALLENGES.map((c) => c.id);

export function getChallengesByDifficulty(
  difficulty: ChallengeDefinition["difficulty"]
): ChallengeDefinition[] {
  return CHALLENGES.filter((c) => c.difficulty === difficulty).sort(
    (a, b) => a.order - b.order
  );
}
