import { createEmptyCircuit } from "@/lib/circuit-schema";
import type { Circuit } from "@/lib/circuit-schema";
import {
  bellStateCircuit,
  ghzStateCircuit,
  quantumTeleportationCircuit,
} from "@/lib/sample-circuits";
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

const BASE_LESSONS: Array<Omit<LessonDefinition, "sections" | "quiz">> = [
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
    starterCircuit: lessonCircuit("Qubit Basics", 1),
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
    starterCircuit: lessonCircuit("First Gate", 1),
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
    starterCircuit: lessonCircuit("Superposition", 1),
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
    starterCircuit: lessonCircuit("Flip with X", 1),
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
    starterCircuit: lessonCircuit("RX Rotation", 1),
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
    starterCircuit: lessonCircuit("Measurement", 1, 1),
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
    starterCircuit: lessonCircuit("Bell State", 2),
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
    starterCircuit: lessonCircuit("Entangle", 2),
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
    starterCircuit: lessonCircuit("Export", 1, 0, [
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
    starterCircuit: lessonCircuit("Import", 1),
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

function op(
  id: string,
  type: string,
  targets: string[],
  column: number,
  controls: string[] = [],
  classicalTargets: string[] = []
): Circuit["operations"][number] {
  return {
    id,
    type,
    label: type.toUpperCase(),
    targets,
    controls,
    classicalTargets,
    column,
  };
}

function academyLesson(
  lesson: Omit<LessonDefinition, "sections" | "quiz"> & {
    sections?: LessonDefinition["sections"];
    quiz?: LessonDefinition["quiz"];
  }
): LessonDefinition {
  return {
    ...lesson,
    sections: lesson.sections ?? [
      {
        heading: "Key idea",
        body: lesson.story,
        circuit: lesson.starterCircuit,
        quantaNote: lesson.quantaIntro,
      },
      {
        heading: "Try it in Build",
        body: lesson.description,
        quantaNote: lesson.quantaHint,
      },
    ],
    quiz: lesson.quiz ?? [
      {
        id: `${lesson.id}-check`,
        question: `Which idea is central to “${lesson.title}”?`,
        options: [lesson.description, "A classical spreadsheet formula"],
        answerIndex: 0,
        explanation: lesson.hint,
      },
    ],
  };
}

const EXTRA_LESSONS: LessonDefinition[] = [
  academyLesson({
    id: "bits-vs-qubits",
    title: "Bits vs Qubits",
    module: "quantum-basics",
    description: "Compare a classical bit with a quantum bit.",
    story: "A classical bit is either 0 or 1. A qubit can be in a combination of |0⟩ and |1⟩ until measurement, with amplitudes that determine probabilities.",
    difficulty: "beginner", estimatedMinutes: 4, xpReward: 25, skills: ["qubits"],
    starterCircuit: lessonCircuit("Bits vs Qubits", 1), successCondition: { type: "manual" },
    hint: "Remember that measurement turns amplitudes into classical outcomes.",
    quantaIntro: "Let's start with the smallest unit of information: one bit, then one qubit.",
    quantaHint: "A qubit is not simply a hidden classical bit — its amplitudes can interfere.",
    quantaSuccess: "Great foundation! You can now describe the bit-to-qubit upgrade.",
    quantaIncorrect: "Re-read the comparison and try the check again.", order: 11,
  }),
  academyLesson({
    id: "reading-the-charts", title: "Reading the Charts", module: "quantum-basics",
    description: "Interpret probabilities, phase, and the Bloch sphere.",
    story: "The probability chart shows measurement likelihoods. Phase is the angle of an amplitude, and the Bloch sphere gives a geometric view of one qubit.",
    difficulty: "beginner", estimatedMinutes: 5, xpReward: 35, skills: ["qubits", "phase"],
    starterCircuit: lessonCircuit("Reading Charts", 1, 0, [op("chart-h", "h", ["q0"], 0)]),
    successCondition: { type: "hasGate", gate: "h" }, hint: "Use the H example and inspect all three visualization panels.",
    quantaIntro: "Charts turn invisible amplitudes into patterns you can read.",
    quantaHint: "Probabilities answer “how often”; phase answers “how do amplitudes combine?”",
    quantaSuccess: "Excellent chart reading — you are ready to interpret interference.",
    quantaIncorrect: "Look at the probability and phase panels again.", order: 12,
  }),
  academyLesson({
    id: "tour-the-build-workspace", title: "Tour the Build Workspace", module: "quantum-basics",
    description: "Place any gate and explore the Gates, Inspector, Results, and Code panels.",
    story: "Build mode connects four views: Gates for tools, the canvas for your circuit, Inspector for selected operations, Results for simulation, and Code for export.",
    difficulty: "beginner", estimatedMinutes: 5, xpReward: 40, skills: ["qubits", "gates"],
    starterCircuit: lessonCircuit("Workspace Tour", 1, 0, [op("tour-h", "h", ["q0"], 0)]),
    successCondition: { type: "hasGate", gate: "h" }, hint: "Place any gate, then open each workspace panel.",
    quantaIntro: "A quick tour makes the whole Build workspace feel less mysterious.",
    quantaHint: "Try selecting the gate to see its Inspector details.",
    quantaSuccess: "Workspace tour complete! You know where to look next.",
    quantaIncorrect: "Place a gate and inspect the panel names.", order: 13,
  }),
  academyLesson({
    id: "z-and-phase", title: "Z and Phase", module: "single-qubit-gates",
    description: "Use Z to flip the phase of |1⟩ without changing probabilities.",
    story: "The Z gate leaves |0⟩ alone and multiplies |1⟩ by −1. Probabilities can stay unchanged while phase changes affect later interference.",
    difficulty: "beginner", estimatedMinutes: 5, xpReward: 50, skills: ["gates", "phase"],
    starterCircuit: lessonCircuit("Z Phase", 1, 0, [op("z", "z", ["q0"], 0)]),
    successCondition: { type: "hasGate", gate: "z" }, hint: "Add Z, then use the HZH walkthrough to see phase matter.",
    quantaIntro: "Not every quantum change shows up as a probability change right away.",
    quantaHint: "Phase is the hidden angle that interference can reveal.",
    quantaSuccess: "You found the phase lever! Open the HZH walkthrough for a visual proof.",
    quantaIncorrect: "Place a Z gate and compare the state before and after.", order: 14,
    walkthroughId: "hzh",
  }),
  academyLesson({
    id: "s-and-t-gates", title: "S and T Gates", module: "single-qubit-gates",
    description: "Explore quarter-turn and eighth-turn phase gates.",
    story: "S applies a π/2 phase to |1⟩, while T applies π/4. They are building blocks for precise phase control.",
    difficulty: "intermediate", estimatedMinutes: 5, xpReward: 50, skills: ["gates", "phase"],
    starterCircuit: lessonCircuit("S and T", 1, 0, [op("s", "s", ["q0"], 0)]),
    successCondition: { type: "any", conditions: [{ type: "hasGate", gate: "s" }, { type: "hasGate", gate: "t" }] },
    hint: "Place S or T on q[0] and inspect its phase effect.", quantaIntro: "S and T are small, precise phase steps.",
    quantaHint: "Try both gates and compare their phase angles.", quantaSuccess: "Phase control unlocked!", quantaIncorrect: "Add S or T to the canvas.", order: 15,
  }),
  academyLesson({
    id: "h-twice-is-identity", title: "H Twice Is Identity", module: "single-qubit-gates",
    description: "Apply H twice to return |0⟩.",
    story: "Hadamard is its own inverse: H·H = I. Two consecutive H gates undo one another.",
    difficulty: "beginner", estimatedMinutes: 4, xpReward: 50, skills: ["gates"],
    starterCircuit: lessonCircuit("H Twice", 1, 0, [op("h1", "h", ["q0"], 0), op("h2", "h", ["q0"], 1)]),
    successCondition: { type: "operationOrder", operations: [{ gate: "h", target: "q0" }, { gate: "h", target: "q0" }] },
    hint: "Place H, then another H in the next column.", quantaIntro: "Some quantum operations undo themselves when repeated.",
    quantaHint: "Use separate columns so the execution order is clear.", quantaSuccess: "Identity by repetition — nicely done.", quantaIncorrect: "Your circuit needs H followed by H.", order: 16,
  }),
  academyLesson({
    id: "run-shots-histogram", title: "Run Shots and Read a Histogram", module: "measurement",
    description: "Measure a circuit and use Run to collect repeated shots.",
    story: "A simulator can sample a circuit many times. A histogram shows how often each classical outcome appears.",
    difficulty: "intermediate", estimatedMinutes: 6, xpReward: 50, skills: ["measurement"],
    starterCircuit: lessonCircuit("Shots", 1, 1, [op("h", "h", ["q0"], 0), op("m", "measure", ["q0"], 1, [], ["c0"])]),
    successCondition: { type: "hasMeasurement" }, hint: "Add a measurement, then use the Run/shots controls in Results.",
    quantaIntro: "One run is a sample; many shots reveal the distribution.",
    quantaHint: "Increase shots to make the histogram more stable.", quantaSuccess: "You can now read experimental frequencies.", quantaIncorrect: "Add a measurement before running shots.", order: 17,
  }),
  academyLesson({
    id: "measure-superposition", title: "Measure a Superposition", module: "measurement",
    description: "Create H then measure the qubit.",
    story: "H creates equal probabilities, and measurement samples either classical result. Repeating the experiment builds a 50/50 histogram.",
    difficulty: "intermediate", estimatedMinutes: 6, xpReward: 60, skills: ["measurement", "gates"],
    starterCircuit: lessonCircuit("Measure Superposition", 1, 1, [op("h", "h", ["q0"], 0), op("m", "measure", ["q0"], 1, [], ["c0"])]),
    successCondition: { type: "operationOrder", operations: [{ gate: "h", target: "q0" }, { gate: "measure", target: "q0" }] },
    hint: "Place H first and Measure second.", quantaIntro: "Let's turn a quantum possibility into a classical result.",
    quantaHint: "The order matters: prepare first, measure second.", quantaSuccess: "Superposition measured successfully.", quantaIncorrect: "Use H followed by Measure.", order: 18,
  }),
  academyLesson({
    id: "two-qubits-four-states", title: "Two Qubits, Four States", module: "multi-qubit-gates",
    description: "Create a two-qubit circuit and inspect its four basis states.",
    story: "Two qubits have four computational basis states: |00⟩, |01⟩, |10⟩, and |11⟩.",
    difficulty: "beginner", estimatedMinutes: 5, xpReward: 40, skills: ["qubits"],
    starterCircuit: lessonCircuit("Four States", 2), successCondition: { type: "minQubits", count: 2 },
    hint: "Add a second qubit if needed and inspect the Results panel.", quantaIntro: "Adding one qubit doubles the basis-state vocabulary.",
    quantaHint: "Count the two-bit strings: 00, 01, 10, 11.", quantaSuccess: "Four states understood.", quantaIncorrect: "This lesson needs two qubit wires.", order: 19,
  }),
  academyLesson({
    id: "cx-basics", title: "CX Basics", module: "multi-qubit-gates",
    description: "Place a controlled-X gate between two qubits.",
    story: "CX flips its target only when its control is |1⟩. It is the most common way to connect two wires.",
    difficulty: "intermediate", estimatedMinutes: 6, xpReward: 60, skills: ["gates", "entanglement"],
    starterCircuit: lessonCircuit("CX Basics", 2, 0, [op("cx", "cx", ["q1"], 0, ["q0"])]),
    successCondition: { type: "hasControlledGate", gate: "cx" }, hint: "Place CX with q0 as control and q1 as target.",
    quantaIntro: "Now qubits can condition one another.", quantaHint: "The small control dot and target symbol must connect.",
    quantaSuccess: "Controlled logic online.", quantaIncorrect: "Add a CX controlled gate.", order: 20,
  }),
  academyLesson({
    id: "cz-and-swap", title: "CZ and SWAP", module: "multi-qubit-gates",
    description: "Compare a controlled phase flip with exchanging two wires.",
    story: "CZ changes the phase of |11⟩, while SWAP exchanges the complete states of two qubits.",
    difficulty: "intermediate", estimatedMinutes: 6, xpReward: 60, skills: ["gates", "phase"],
    starterCircuit: lessonCircuit("CZ SWAP", 2, 0, [op("cz", "cz", ["q1"], 0, ["q0"])]),
    successCondition: { type: "any", conditions: [{ type: "hasGate", gate: "cz" }, { type: "hasGate", gate: "swap" }] },
    hint: "Try CZ or SWAP and inspect the operation explanation.", quantaIntro: "Two gates, two different kinds of coordination.",
    quantaHint: "CZ is phase-focused; SWAP moves states between wires.", quantaSuccess: "Multi-qubit vocabulary expanded.", quantaIncorrect: "Place CZ or SWAP.", order: 21,
  }),
  academyLesson({
    id: "toffoli", title: "Toffoli (CCX)", module: "multi-qubit-gates",
    description: "Place a double-controlled X gate.",
    story: "The Toffoli gate flips its target only when both controls are |1⟩. It is a universal classical reversible primitive.",
    difficulty: "advanced", estimatedMinutes: 7, xpReward: 75, skills: ["gates", "algorithms"],
    starterCircuit: lessonCircuit("Toffoli", 3, 0, [op("ccx", "ccx", ["q2"], 0, ["q0", "q1"])]),
    successCondition: { type: "hasGate", gate: "ccx" }, hint: "Use q0 and q1 as controls and q2 as target.", quantaIntro: "Two conditions can control one flip.", quantaHint: "CCX needs three wires.", quantaSuccess: "Toffoli mastered.", quantaIncorrect: "Add a CCX gate.", order: 22,
  }),
  academyLesson({
    id: "ghz-state", title: "Build a GHZ State", module: "entanglement",
    description: "Connect three qubits with H and two CX gates.",
    story: "A three-qubit GHZ state shares a coherent correlation across |000⟩ and |111⟩.",
    difficulty: "advanced", estimatedMinutes: 9, xpReward: 90, skills: ["entanglement", "algorithms"],
    starterCircuit: ghzStateCircuit,
    successCondition: { type: "all", conditions: [{ type: "minQubits", count: 3 }, { type: "operationOrder", operations: [{ gate: "h", target: "q0" }, { gate: "cx" }, { gate: "cx" }] }] },
    hint: "Start with H, then connect q0 to q1 and q1 to q2.", quantaIntro: "Bell pairs can grow into a shared three-qubit state.",
    quantaHint: "Look for two controlled links after the H.", quantaSuccess: "GHZ correlation achieved.", quantaIncorrect: "Build H plus two CX gates on three qubits.", order: 23,
  }),
  academyLesson({
    id: "phase-kickback", title: "Phase Kickback", module: "entanglement",
    description: "Use CZ to make a phase on one qubit observable through interference.",
    story: "A controlled phase can imprint information on a control/target pair. Hadamards can convert that phase into a probability difference.",
    difficulty: "advanced", estimatedMinutes: 8, xpReward: 90, skills: ["entanglement", "phase"],
    starterCircuit: lessonCircuit("Phase Kickback", 2, 0, [op("h0", "h", ["q0"], 0), op("cz", "cz", ["q1"], 1, ["q0"])]),
    successCondition: { type: "hasControlledGate", gate: "cz" }, hint: "Place CZ between q0 and q1.", quantaIntro: "Phase can travel through a controlled interaction.", quantaHint: "Use H before or after CZ to reveal interference.", quantaSuccess: "You have seen phase kickback in action.", quantaIncorrect: "Add a controlled-Z gate.", order: 24,
  }),
  academyLesson({
    id: "deutsch-problem", title: "Deutsch's Problem", module: "algorithms",
    description: "Explore the H–oracle–H pattern on two qubits.",
    story: "Deutsch's algorithm uses interference to learn whether a one-bit function is constant or balanced with one oracle query.",
    difficulty: "advanced", estimatedMinutes: 10, xpReward: 100, skills: ["algorithms", "phase"],
    starterCircuit: lessonCircuit("Deutsch", 2, 0, [op("h0", "h", ["q0"], 0), op("h1", "h", ["q1"], 0), op("cx", "cx", ["q1"], 1, ["q0"]), op("h2", "h", ["q0"], 2)]),
    successCondition: { type: "operationOrder", operations: [{ gate: "h" }, { gate: "h" }, { gate: "cx" }, { gate: "h" }] },
    hint: "Build the H, H, CX, H interference pattern.", quantaIntro: "Algorithms are choreography: prepare, query, interfere.", quantaHint: "Use two qubits and inspect the final probabilities.", quantaSuccess: "Deutsch's pattern is in place.", quantaIncorrect: "Follow the H–H–CX–H sequence.", order: 25,
  }),
  academyLesson({
    id: "teleportation-tour", title: "Quantum Teleportation Tour", module: "algorithms",
    description: "Explore a three-qubit teleportation circuit.",
    story: "Teleportation transfers an unknown quantum state using entanglement plus two classical correction bits — never copying the original state.",
    difficulty: "advanced", estimatedMinutes: 12, xpReward: 110, skills: ["algorithms", "entanglement"],
    starterCircuit: quantumTeleportationCircuit, successCondition: { type: "minQubits", count: 3 },
    hint: "Inspect the starter circuit and trace its three wires.", quantaIntro: "Teleportation is a protocol, not science-fiction transport.",
    quantaHint: "Follow preparation, Bell interaction, measurement, and correction.", quantaSuccess: "Teleportation tour complete.", quantaIncorrect: "Use all three qubits in the starter circuit.", order: 26,
  }),
  academyLesson({
    id: "grover-two-qubits", title: "Grover with Two Qubits", module: "algorithms",
    description: "Combine H and CZ to mark a search state.",
    story: "Grover's algorithm amplifies a marked answer. Even a two-qubit toy circuit shows the alternating oracle and diffusion idea.",
    difficulty: "advanced", estimatedMinutes: 10, xpReward: 100, skills: ["algorithms", "phase"],
    starterCircuit: lessonCircuit("Grover Two Qubits", 2, 0, [op("h0", "h", ["q0"], 0), op("h1", "h", ["q1"], 0), op("cz", "cz", ["q1"], 1, ["q0"])]),
    successCondition: { type: "all", conditions: [{ type: "hasGate", gate: "h" }, { type: "hasGate", gate: "cz" }] },
    hint: "Use H to prepare and CZ as a simple phase oracle.", quantaIntro: "Search becomes interference when amplitudes are amplified.", quantaHint: "Look at how the oracle changes phase, not just probability.", quantaSuccess: "Grover's two-qubit intuition is taking shape.", quantaIncorrect: "Add H and CZ gates.", order: 27,
  }),
  academyLesson({
    id: "openqasm-export", title: "OpenQASM Export", module: "qiskit",
    description: "Export the current circuit as OpenQASM.",
    story: "OpenQASM is a compact text representation of quantum circuits that tools can exchange.",
    difficulty: "intermediate", estimatedMinutes: 6, xpReward: 50, skills: ["qiskit"],
    starterCircuit: lessonCircuit("OpenQASM", 1, 0, [op("h", "h", ["q0"], 0)]), successCondition: { type: "actionExport" },
    hint: "Choose OpenQASM in the Code panel and export it.", quantaIntro: "One circuit can travel between visual and textual tools.",
    quantaHint: "Select the OpenQASM language tab first.", quantaSuccess: "OpenQASM exported.", quantaIncorrect: "Use the export action in the Code panel.", order: 28,
  }),
  academyLesson({
    id: "bind-parameters", title: "Bind Parameters", module: "qiskit",
    description: "Place a parameterized RX gate and bind its value.",
    story: "Symbolic parameters keep a circuit reusable. Before simulation, bind theta to a numeric angle.",
    difficulty: "intermediate", estimatedMinutes: 7, xpReward: 60, skills: ["qiskit", "phase"],
    starterCircuit: lessonCircuit("Bind Parameters", 1, 0, [op("rx", "rx", ["q0"], 0)]), successCondition: { type: "hasParameterGate", gate: "rx" },
    hint: "Add RX and enter a numeric parameter.", quantaIntro: "Parameters let one circuit describe many experiments.",
    quantaHint: "An unbound symbol is intentionally blocked from simulation.", quantaSuccess: "Parameter binding understood.", quantaIncorrect: "Place an RX parameter gate.", order: 29,
  }),
  academyLesson({
    id: "capstone-bell-experiment", title: "Capstone: Bell Experiment", module: "capstone",
    description: "Build, measure, and inspect a Bell experiment.",
    story: "Bring it all together: prepare H, entangle with CX, then measure both qubits into classical bits.",
    difficulty: "advanced", estimatedMinutes: 15, xpReward: 150, skills: ["algorithms", "entanglement", "measurement"],
    starterCircuit: lessonCircuit("Bell Experiment", 2, 2, [op("h", "h", ["q0"], 0), op("cx", "cx", ["q1"], 1, ["q0"]), op("m0", "measure", ["q0"], 2, [], ["c0"]), op("m1", "measure", ["q1"], 2, [], ["c1"])]),
    successCondition: { type: "all", conditions: [{ type: "hasGate", gate: "h" }, { type: "hasControlledGate", gate: "cx" }, { type: "hasMeasurement", count: 2 }] },
    hint: "Prepare, entangle, and measure both wires.", quantaIntro: "This is your first complete quantum experiment.",
    quantaHint: "Use Results to inspect probabilities and shots.", quantaSuccess: "Capstone complete — you ran a Bell experiment.", quantaIncorrect: "Build H, CX, and two measurements.", order: 30,
  }),
];

export const LESSONS: LessonDefinition[] = [...BASE_LESSONS, ...EXTRA_LESSONS].map(
  (lesson) => academyLesson(lesson)
);

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
