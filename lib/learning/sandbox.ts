import {
  createEmptyCircuit,
  getGateLabel,
  type Circuit,
  type Operation,
} from "@/lib/circuit-schema";
import type { ChallengeDefinition, CheckCondition } from "@/lib/learning/types";

type Random = () => number;

function mulberry32(seed: number): Random {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let result = value;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(random: Random, values: readonly T[]): T {
  return values[Math.floor(random() * values.length)] ?? values[0];
}

function integer(random: Random, min: number, max: number): number {
  return min + Math.floor(random() * (max - min + 1));
}

function operation(
  seed: number,
  index: number,
  type: string,
  targets: string[],
  column: number,
  controls: string[] = [],
  classicalTargets: string[] = [],
  parameters?: Operation["parameters"]
): Operation {
  return {
    id: `sandbox-${seed}-op-${index}`,
    type,
    label: getGateLabel(type),
    targets,
    controls,
    classicalTargets,
    column,
    ...(parameters ? { parameters } : {}),
  };
}

function conditionForSingle(type: string, target: string): CheckCondition {
  return { type: "hasGateOnQubit", gate: type, target };
}

export function buildSandboxSolution(seed: number): {
  circuit: Circuit;
  condition: CheckCondition;
  title: string;
  description: string;
  successCriteria: string;
  hint: string;
  quantaHint: string;
  quantaSuccess: string;
  quantaIncorrect: string;
} {
  const random = mulberry32(seed);
  const qubitCount = integer(random, 2, 3);
  const circuit = createEmptyCircuit(`Sandbox ${seed}`, qubitCount);
  const target = `q${integer(random, 0, qubitCount - 1)}`;
  const singleGate = pick(random, ["h", "x", "z", "y", "s", "t"] as const);
  const template = seed % 8;

  if (template === 0) {
    circuit.operations = [operation(seed, 0, singleGate, [target], 0)];
    return {
      circuit,
      condition: conditionForSingle(singleGate, target),
      title: `${getGateLabel(singleGate)} on ${target}`,
      description: `Place a ${getGateLabel(singleGate)} gate on ${target}.`,
      successCriteria: `Place ${getGateLabel(singleGate)} on ${target}.`,
      hint: `Use the ${getGateLabel(singleGate)} gate on the ${target} wire.`,
      quantaHint: `${getGateLabel(singleGate)} on ${target} — a tiny circuit with a clear goal.`,
      quantaSuccess: "Single-gate sandbox complete!",
      quantaIncorrect: `Try ${getGateLabel(singleGate)} on ${target}.`,
    };
  }

  if (template === 1) {
    circuit.operations = circuit.qubits.map((qubit, index) =>
      operation(seed, index, "h", [qubit.id], index)
    );
    return {
      circuit,
      condition: {
        type: "all",
        conditions: circuit.qubits.map((qubit) =>
          conditionForSingle("h", qubit.id)
        ),
      },
      title: "Open Every Possibility",
      description: "Put every qubit into an equal superposition.",
      successCriteria: `Place H on all ${qubitCount} qubits.`,
      hint: "Add one H gate to each qubit wire.",
      quantaHint: "H on every wire turns the whole register into possibility.",
      quantaSuccess: "Superposition across the whole register!",
      quantaIncorrect: "Every qubit needs an H gate.",
    };
  }

  if (template === 2) {
    const controlIndex = integer(random, 0, 1);
    const targetIndex = controlIndex === 0 ? 1 : 0;
    const control = `q${controlIndex}`;
    const targetQubit = `q${targetIndex}`;
    circuit.operations = [
      operation(seed, 0, "h", [control], 0),
      operation(seed, 1, "cx", [targetQubit], 1, [control]),
    ];
    return {
      circuit,
      condition: {
        type: "operationOrder",
        operations: [
          { gate: "h", target: control },
          { gate: "cx", control, target: targetQubit },
        ],
      },
      title: "Sandbox Bell Pair",
      description: `Create a Bell pair from H on ${control}, then CX to ${targetQubit}.`,
      successCriteria: `H ${control}, followed by CX ${control} → ${targetQubit}.`,
      hint: "Start with H, then connect the two wires with CX.",
      quantaHint: "One H plus one CX is the classic entangling recipe.",
      quantaSuccess: "Bell pair assembled!",
      quantaIncorrect: "Use H first, then CX with the same control.",
    };
  }

  if (template === 3) {
    const ghzCircuit = createEmptyCircuit(`Sandbox ${seed}`, 3);
    ghzCircuit.operations = [
      operation(seed, 0, "h", ["q0"], 0),
      operation(seed, 1, "cx", ["q1"], 1, ["q0"]),
      operation(seed, 2, "cx", ["q2"], 2, ["q0"]),
    ];
    return {
      circuit: ghzCircuit,
      condition: {
        type: "operationOrder",
        operations: [
          { gate: "h", target: "q0" },
          { gate: "cx", control: "q0", target: "q1" },
          { gate: "cx", control: "q0", target: "q2" },
        ],
      },
      title: "Three-Qubit GHZ",
      description: "Spread one superposition across three connected qubits.",
      successCriteria: "Build H q0, CX q0→q1, then CX q0→q2.",
      hint: "Use q0 as the control for both CX operations.",
      quantaHint: "Grow the entanglement tree from q0.",
      quantaSuccess: "GHZ-style three-way entanglement achieved!",
      quantaIncorrect: "Keep H first, then connect q0 to q1 and q2.",
    };
  }

  if (template === 4) {
    const controlIndex = integer(random, 0, 1);
    const targetIndex = controlIndex === 0 ? 1 : 0;
    const control = `q${controlIndex}`;
    const targetQubit = `q${targetIndex}`;
    circuit.operations = [
      operation(seed, 0, "cz", [targetQubit], 0, [control]),
    ];
    return {
      circuit,
      condition: { type: "hasControlledGate", gate: "cz" },
      title: "Controlled Phase",
      description: `Add a controlled-Z from ${control} to ${targetQubit}.`,
      successCriteria: "Place a controlled-Z gate between two qubits.",
      hint: "Use the controlled-Z operation with one control and one target.",
      quantaHint: "Controlled phase is a quiet but powerful connection.",
      quantaSuccess: "Controlled phase unlocked!",
      quantaIncorrect: "Add a controlled-Z gate.",
    };
  }

  if (template === 5) {
    const gate = pick(random, ["rx", "ry", "rz"] as const);
    const angle = pick(random, ["/2", "/4", "/8"] as const);
    circuit.operations = [
      operation(seed, 0, gate, [target], 0, [], [], [
        { value: Math.PI / Number(angle.slice(1)), display: `pi${angle}` },
      ]),
    ];
    return {
      circuit,
      condition: { type: "hasParameterGate", gate, target },
      title: `${getGateLabel(gate)} Rotation`,
      description: `Add a parameterized ${getGateLabel(gate)} to ${target}.`,
      successCriteria: `Place ${getGateLabel(gate)} with an angle on ${target}.`,
      hint: "Choose a rotation gate and enter a parameter such as pi/2.",
      quantaHint: "Parameterized rotations let you tune the quantum motion.",
      quantaSuccess: "Rotation parameter dialed in!",
      quantaIncorrect: `Add a parameterized ${getGateLabel(gate)} on ${target}.`,
    };
  }

  if (template === 6) {
    const measuredCircuit = createEmptyCircuit(`Sandbox ${seed}`, qubitCount, qubitCount);
    measuredCircuit.operations = measuredCircuit.qubits.map((qubit, index) =>
      operation(seed, index, "measure", [qubit.id], index, [], [`c${index}`])
    );
    return {
      circuit: measuredCircuit,
      condition: { type: "hasMeasurement", count: qubitCount },
      title: "Measure the Register",
      description: "Measure every qubit into its matching classical bit.",
      successCriteria: `Add ${qubitCount} measurement operations.`,
      hint: "Place one measure operation on each qubit.",
      quantaHint: "Bring every qubit back to the classical world.",
      quantaSuccess: "The full register has been measured!",
      quantaIncorrect: "Measure every qubit in the register.",
    };
  }

  circuit.operations = [operation(seed, 0, singleGate, [target], 0)];
  return {
    circuit,
    condition: {
      type: "all",
      conditions: [
        conditionForSingle(singleGate, target),
        { type: "maxOperations", count: 1 },
      ],
    },
    title: "Minimal Gate Challenge",
    description: `Solve the circuit with exactly one ${getGateLabel(singleGate)}.`,
    successCriteria: `Use ${getGateLabel(singleGate)} on ${target} and no extra operations.`,
    hint: "One correct gate is enough — resist adding anything else.",
    quantaHint: "The smallest circuit can still say something meaningful.",
    quantaSuccess: "Minimalist circuit mastered!",
    quantaIncorrect: "Use one matching gate, with no extras.",
  };
}

export function generateSandboxChallenge(seed: number): ChallengeDefinition {
  const safeSeed = Number.isFinite(seed) ? Math.trunc(seed) : 0;
  const solution = buildSandboxSolution(safeSeed);
  const random = mulberry32(safeSeed ^ 0x9e3779b9);
  return {
    id: `sandbox-${safeSeed}`,
    title: solution.title,
    description: solution.description,
    difficulty: "beginner",
    xpReward: integer(random, 20, 40),
    challengeType: "build",
    estimatedMinutes: 4,
    successCriteria: solution.successCriteria,
    starterCircuit: createEmptyCircuit(`Sandbox ${safeSeed}`, solution.circuit.qubits.length, solution.circuit.classicalBits.length),
    targetCircuit: solution.circuit,
    successCondition: solution.condition,
    hint: solution.hint,
    quantaIntro: "A fresh sandbox challenge is ready.",
    quantaHint: solution.quantaHint,
    quantaSuccess: solution.quantaSuccess,
    quantaIncorrect: solution.quantaIncorrect,
    order: safeSeed,
  };
}

export function todaySandboxSeed(): number {
  const now = new Date();
  return Number(
    `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(
      now.getDate()
    ).padStart(2, "0")}`
  );
}
