import { createEmptyCircuit } from "@/lib/circuit-schema";
import type { Circuit } from "@/lib/circuit-schema";
import { bellStateCircuit } from "@/lib/sample-circuits";
import type { LessonDefinition } from "./types";

function lessonCircuit(
  name: string,
  qubits: number,
  classical = 0,
  operations: Circuit["operations"] = []
): Circuit {
  const c = createEmptyCircuit(name, qubits, classical);
  return { ...c, operations };
}

export const LESSONS: LessonDefinition[] = [
  {
    id: "what-is-a-qubit",
    title: "What is a Qubit?",
    module: "quantum-basics",
    description: "Meet the quantum bit and the empty circuit canvas.",
    story:
      "A qubit is the basic unit of quantum information. Unlike a classical bit (0 or 1), a qubit can exist in a superposition. Your canvas starts with q[0] in the |0⟩ state — the quantum equivalent of a blank slate.",
    difficulty: "beginner",
    estimatedMinutes: 3,
    xpReward: 25,
    skills: ["qubits"],
    starterCircuit: lessonCircuit("Lesson: Qubit Basics", 1),
    successCondition: { type: "manual" },
    hint: "Read the story, then click Check Answer when you're ready.",
    quantaIntro:
      "Welcome! I'm Quanta. Every quantum journey starts with a single qubit wire — yours is ready.",
    quantaHint: "No gates needed yet. Just explore the canvas and press Check Answer.",
    quantaSuccess: "Perfect! You understand where quantum circuits begin.",
    quantaIncorrect: "Take a moment to read about qubits — then try again.",
    order: 1,
  },
  {
    id: "add-first-gate",
    title: "Add Your First Gate",
    module: "single-qubit-gates",
    description: "Place an X gate on q[0] to flip the qubit.",
    story:
      "The Pauli-X gate flips |0⟩ to |1⟩ — it's the quantum NOT gate. Drag X from the Operations panel onto q[0].",
    difficulty: "beginner",
    estimatedMinutes: 4,
    xpReward: 50,
    skills: ["gates"],
    starterCircuit: lessonCircuit("Lesson: First Gate", 1),
    successCondition: {
      type: "hasGateOnQubit",
      gate: "x",
      target: "q0",
    },
    hint: "Drag the X gate from Operations onto the q[0] wire.",
    quantaIntro:
      "Let's try a tiny quantum move. Add the right gate and I'll check your circuit!",
    quantaHint: "Look for the blue X tile in Operations — drop it on q[0].",
    quantaSuccess: "Nice work! That circuit is officially quantum-duck approved.",
    quantaIncorrect: "Almost! Check that an X gate sits on q[0].",
    order: 2,
  },
  {
    id: "create-superposition",
    title: "Create Superposition",
    module: "single-qubit-gates",
    description: "Use H on q[0] to create an equal superposition.",
    story:
      "The Hadamard gate puts a qubit into superposition — 50% |0⟩ and 50% |1⟩. Place exactly one H on q[0].",
    difficulty: "beginner",
    estimatedMinutes: 5,
    xpReward: 50,
    skills: ["gates"],
    starterCircuit: lessonCircuit("Lesson: Superposition", 1),
    successCondition: {
      type: "all",
      conditions: [
        { type: "hasGateOnQubit", gate: "h", target: "q0" },
        { type: "maxOperations", count: 1 },
      ],
    },
    hint: "Try placing the H gate on q[0]. It creates superposition.",
    quantaIntro: "Superposition is where quantum gets interesting. One H gate is all you need!",
    quantaHint: "The red H tile — place it on q[0] and nothing else.",
    quantaSuccess: "Beautiful! q[0] is now in superposition.",
    quantaIncorrect: "Almost! Your circuit needs exactly one H on q[0].",
    order: 3,
  },
  {
    id: "flip-with-x",
    title: "Flip with X",
    module: "single-qubit-gates",
    description: "Apply X to flip q[0] from |0⟩ to |1⟩.",
    story:
      "Practice the bit-flip again. Clear any old gates and place X on q[0].",
    difficulty: "beginner",
    estimatedMinutes: 3,
    xpReward: 50,
    skills: ["gates"],
    starterCircuit: lessonCircuit("Lesson: Flip with X", 1),
    successCondition: {
      type: "hasGateOnQubit",
      gate: "x",
      target: "q0",
    },
    hint: "X gate on q[0] — the Pauli flip.",
    quantaIntro: "X is the quantum NOT. Flip q[0] and I'll verify!",
    quantaHint: "Blue X tile → q[0] wire.",
    quantaSuccess: "Flipped! Pauli-X does the job.",
    quantaIncorrect: "Check that X is on q[0].",
    order: 4,
  },
  {
    id: "rotate-with-rx",
    title: "Rotate with RX",
    module: "single-qubit-gates",
    description: "Place RX on q[0] with any rotation angle.",
    story:
      "Rotation gates turn the qubit on the Bloch sphere. Add RX to q[0] — the default angle π/2 works fine.",
    difficulty: "intermediate",
    estimatedMinutes: 6,
    xpReward: 75,
    skills: ["gates"],
    starterCircuit: lessonCircuit("Lesson: RX Rotation", 1),
    successCondition: {
      type: "hasParameterGate",
      gate: "rx",
      target: "q0",
    },
    hint: "Find RX in the pink rotation group and drop it on q[0].",
    quantaIntro: "Rotations are how we steer qubits through Hilbert space.",
    quantaHint: "RX on q[0] — any parameter value counts.",
    quantaSuccess: "Rotation complete! You're steering qubits like a pro.",
    quantaIncorrect: "Add an RX gate with a parameter on q[0].",
    order: 5,
  },
  {
    id: "measure-a-qubit",
    title: "Measure a Qubit",
    module: "measurement",
    description: "Measure q[0] into classical bit c[0].",
    story:
      "Measurement collapses superposition into a classical 0 or 1. Add a classical register if needed, then measure q[0] into c[0].",
    difficulty: "intermediate",
    estimatedMinutes: 7,
    xpReward: 75,
    skills: ["measurement"],
    starterCircuit: lessonCircuit("Lesson: Measurement", 1, 1),
    successCondition: {
      type: "hasMeasurement",
      qubit: "q0",
      classical: "c0",
    },
    hint: "Drag Measure onto q[0]. It links to c[0].",
    quantaIntro: "Measurement bridges quantum and classical worlds.",
    quantaHint: "Gray measure tile on q[0] → c[0].",
    quantaSuccess: "Measured! Collapse complete.",
    quantaIncorrect: "Measure q[0] into c[0] — check classical wiring.",
    order: 6,
  },
  {
    id: "build-bell-state",
    title: "Build a Bell State",
    module: "entanglement",
    description: "H on q[0], then CNOT from q[0] to q[1].",
    story:
      "The Bell state |Φ+⟩ = (|00⟩ + |11⟩)/√2 is the hello-world of entanglement. First H on q[0], then CX with control q[0] and target q[1].",
    difficulty: "intermediate",
    estimatedMinutes: 10,
    xpReward: 100,
    skills: ["entanglement"],
    starterCircuit: lessonCircuit("Lesson: Bell State", 2),
    successCondition: {
      type: "all",
      conditions: [
        { type: "minQubits", count: 2 },
        {
          type: "operationOrder",
          operations: [
            { gate: "h", target: "q0" },
            { gate: "cx", control: "q0", target: "q1" },
          ],
        },
      ],
    },
    hint: "H first on q[0], then CNOT: control q[0], target q[1].",
    quantaIntro: "Two qubits, one entangled pair — the Bell state awaits!",
    quantaHint: "Column 0: H on q[0]. Column 1: CX control q[0], target q[1].",
    quantaSuccess: "Entangled! You've built a Bell pair.",
    quantaIncorrect: "Order matters: H on q[0], then CX q[0]→q[1].",
    order: 7,
  },
  {
    id: "entangle-two-qubits",
    title: "Entangle Two Qubits",
    module: "entanglement",
    description: "Create any two-qubit entangling circuit.",
    story:
      "Use a controlled gate to entangle q[0] and q[1]. CNOT is the classic choice, but any controlled two-qubit gate counts.",
    difficulty: "intermediate",
    estimatedMinutes: 8,
    xpReward: 100,
    skills: ["entanglement"],
    starterCircuit: lessonCircuit("Lesson: Entangle", 2),
    successCondition: {
      type: "all",
      conditions: [
        { type: "minQubits", count: 2 },
        { type: "hasControlledGate" },
      ],
    },
    hint: "CNOT with one qubit as control and the other as target.",
    quantaIntro: "Entanglement: two qubits, one shared quantum story.",
    quantaHint: "CX is the easiest — control on one wire, ⊕ on the other.",
    quantaSuccess: "Entanglement achieved! Spooky action, duck-approved.",
    quantaIncorrect: "Add a controlled gate connecting two qubits.",
    order: 8,
  },
  {
    id: "export-first-qiskit",
    title: "Export Your First Qiskit Circuit",
    module: "qiskit",
    description: "Generate and copy Qiskit code from your visual circuit.",
    story:
      "Build any small circuit (try H on q[0]), then copy the Qiskit Python code from the code panel. This connects visual design to real quantum programming.",
    difficulty: "beginner",
    estimatedMinutes: 5,
    xpReward: 30,
    skills: ["qiskit"],
    starterCircuit: lessonCircuit("Lesson: Export", 1, 0, [
      {
        id: "lesson_export_h",
        type: "h",
        label: "H",
        targets: ["q0"],
        controls: [],
        classicalTargets: [],
        column: 0,
      },
    ]),
    successCondition: { type: "actionExport" },
    hint: "Click Copy in the code panel after reviewing the generated Qiskit.",
    quantaIntro: "Visual circuits become real code — let's export!",
    quantaHint: "Use the Copy button in the Qiskit panel on the right.",
    quantaSuccess: "Exported! You're speaking Qiskit now.",
    quantaIncorrect: "Copy or download the generated Qiskit code first.",
    order: 9,
  },
  {
    id: "import-qiskit-visualize",
    title: "Import Qiskit and Visualize It",
    module: "qiskit",
    description: "Paste Qiskit code and sync it to the canvas.",
    story:
      "Paste this code in the Qiskit panel, then sync:\n\nfrom qiskit import QuantumCircuit\nqc = QuantumCircuit(1)\nqc.h(0)",
    difficulty: "intermediate",
    estimatedMinutes: 8,
    xpReward: 30,
    skills: ["qiskit"],
    starterCircuit: lessonCircuit("Lesson: Import", 1),
    successCondition: {
      type: "all",
      conditions: [
        { type: "actionImport" },
        { type: "hasGateOnQubit", gate: "h", target: "q0" },
      ],
    },
    hint: "Paste the sample code, edit the panel, and let it sync to the canvas.",
    quantaIntro: "Code → canvas. The translator works both ways!",
    quantaHint: "Paste the Qiskit snippet and wait for sync — H should appear on q[0].",
    quantaSuccess: "Imported! Code and canvas are in sync.",
    quantaIncorrect: "Sync Qiskit code so H appears on q[0].",
    order: 10,
  },
];

export function getLessonById(id: string): LessonDefinition | undefined {
  return LESSONS.find((l) => l.id === id);
}

export function getLessonsByModule(module: string): LessonDefinition[] {
  return LESSONS.filter((l) => l.module === module).sort(
    (a, b) => a.order - b.order
  );
}

export const LESSON_IDS = LESSONS.map((l) => l.id);

/** Target Bell circuit for reference / match challenges */
export const bellTargetCircuit: Circuit = structuredClone(bellStateCircuit);
