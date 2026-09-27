import { createEmptyCircuit } from "@/lib/circuit-schema";
import type { Circuit } from "@/lib/circuit-schema";
import {
  bellStateCircuit,
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
    order: 5,
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
    order: 7,
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
    order: 6,
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
    order: 8,
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
    order: 12,
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
    walkthroughId: "bell",
    order: 20,
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
    order: 21,
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
    order: 27,
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
    order: 28,
  },
];

function op(
  id: string,
  type: string,
  targets: string[],
  column: number,
  controls: string[] = [],
  classicalTargets: string[] = [],
  parameters?: Circuit["operations"][number]["parameters"]
): Circuit["operations"][number] {
  return {
    id,
    type,
    label: type.toUpperCase(),
    targets,
    controls,
    classicalTargets,
    column,
    ...(parameters ? { parameters } : {}),
  };
}

function symbolicParameter(symbol: string, value = 0.5) {
  return [{ value, symbol, display: symbol }];
}

function numericParameter(value: number) {
  return [{ value, display: String(value) }];
}

const EXTRA_LESSONS: Array<Omit<LessonDefinition, "sections" | "quiz">> = [
  {
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
    quantaIncorrect: "Re-read the comparison and try the check again.", order: 2,
  },
  {
    id: "reading-the-charts", title: "Reading the Charts", module: "quantum-basics",
    description: "Interpret probabilities, phase, and the Bloch sphere.",
    story: "The probability chart shows measurement likelihoods. Phase is the angle of an amplitude, and the Bloch sphere gives a geometric view of one qubit.",
    difficulty: "beginner", estimatedMinutes: 5, xpReward: 35, skills: ["qubits", "phase"],
    starterCircuit: lessonCircuit("Reading Charts", 1, 0, [op("chart-x", "x", ["q0"], 0)]),
    successCondition: { type: "hasGate", gate: "h" }, hint: "Use the H example and inspect all three visualization panels.",
    quantaIntro: "Charts turn invisible amplitudes into patterns you can read.",
    quantaHint: "Probabilities answer “how often”; phase answers “how do amplitudes combine?”",
    quantaSuccess: "Excellent chart reading — you are ready to interpret interference.",
    quantaIncorrect: "Look at the probability and phase panels again.", order: 3,
  },
  {
    id: "tour-the-build-workspace", title: "Tour the Build Workspace", module: "quantum-basics",
    description: "Place any gate and explore the Gates, Inspector, Results, and Code panels.",
    story: "Build mode connects four views: Gates for tools, the canvas for your circuit, Inspector for selected operations, Results for simulation, and Code for export.",
    difficulty: "beginner", estimatedMinutes: 5, xpReward: 40, skills: ["qubits", "gates"],
    starterCircuit: lessonCircuit("Workspace Tour", 1),
    successCondition: { type: "hasGate", gate: "h" }, hint: "Place any gate, then open each workspace panel.",
    quantaIntro: "A quick tour makes the whole Build workspace feel less mysterious.",
    quantaHint: "Try selecting the gate to see its Inspector details.",
    quantaSuccess: "Workspace tour complete! You know where to look next.",
    quantaIncorrect: "Place a gate and inspect the panel names.", order: 4,
  },
  {
    id: "z-and-phase", title: "Z and Phase", module: "single-qubit-gates",
    description: "Use Z to flip the phase of |1⟩ without changing probabilities.",
    story: "The Z gate leaves |0⟩ alone and multiplies |1⟩ by −1. Probabilities can stay unchanged while phase changes affect later interference.",
    difficulty: "beginner", estimatedMinutes: 5, xpReward: 50, skills: ["gates", "phase"],
    starterCircuit: lessonCircuit("Z Phase", 1, 0, [op("z-preview", "x", ["q0"], 0)]),
    successCondition: { type: "hasGate", gate: "z" }, hint: "Add Z, then use the HZH walkthrough to see phase matter.",
    quantaIntro: "Not every quantum change shows up as a probability change right away.",
    quantaHint: "Phase is the hidden angle that interference can reveal.",
    quantaSuccess: "You found the phase lever! Open the HZH walkthrough for a visual proof.",
    quantaIncorrect: "Place a Z gate and compare the state before and after.", order: 9,
    walkthroughId: "hzh",
  },
  {
    id: "s-and-t-gates", title: "S and T Gates", module: "single-qubit-gates",
    description: "Explore quarter-turn and eighth-turn phase gates.",
    story: "S applies a π/2 phase to |1⟩, while T applies π/4. They are building blocks for precise phase control.",
    difficulty: "intermediate", estimatedMinutes: 5, xpReward: 50, skills: ["gates", "phase"],
    starterCircuit: lessonCircuit("S and T", 1, 0, [op("s-preview", "x", ["q0"], 0)]),
    successCondition: { type: "any", conditions: [{ type: "hasGate", gate: "s" }, { type: "hasGate", gate: "t" }] },
    hint: "Place S or T on q[0] and inspect its phase effect.", quantaIntro: "S and T are small, precise phase steps.",
    quantaHint: "Try both gates and compare their phase angles.", quantaSuccess: "Phase control unlocked!", quantaIncorrect: "Add S or T to the canvas.", order: 10,
  },
  {
    id: "h-twice-is-identity", title: "H Twice Is Identity", module: "single-qubit-gates",
    description: "Apply H twice to return |0⟩.",
    story: "Hadamard is its own inverse: H·H = I. Two consecutive H gates undo one another.",
    difficulty: "beginner", estimatedMinutes: 4, xpReward: 50, skills: ["gates"],
    starterCircuit: lessonCircuit("H Twice", 1, 0, [op("h1", "h", ["q0"], 0)]),
    successCondition: { type: "operationOrder", operations: [{ gate: "h", target: "q0" }, { gate: "h", target: "q0" }] },
    hint: "Place H, then another H in the next column.", quantaIntro: "Some quantum operations undo themselves when repeated.",
    quantaHint: "Use separate columns so the execution order is clear.", quantaSuccess: "Identity by repetition — nicely done.", quantaIncorrect: "Your circuit needs H followed by H.", order: 11,
  },
  {
    id: "run-shots-histogram", title: "Run Shots and Read a Histogram", module: "measurement",
    description: "Measure a circuit and use Run to collect repeated shots.",
    story: "A simulator can sample a circuit many times. A histogram shows how often each classical outcome appears.",
    difficulty: "intermediate", estimatedMinutes: 6, xpReward: 50, skills: ["measurement"],
    starterCircuit: lessonCircuit("Shots", 1, 1, [op("h", "h", ["q0"], 0)]),
    successCondition: { type: "hasMeasurement" }, hint: "Add a measurement, then use the Run/shots controls in Results.",
    quantaIntro: "One run is a sample; many shots reveal the distribution.",
    quantaHint: "Increase shots to make the histogram more stable.", quantaSuccess: "You can now read experimental frequencies.", quantaIncorrect: "Add a measurement before running shots.", order: 13,
  },
  {
    id: "measure-superposition", title: "Measure a Superposition", module: "measurement",
    description: "Create H then measure the qubit.",
    story: "H creates equal probabilities, and measurement samples either classical result. Repeating the experiment builds a 50/50 histogram.",
    difficulty: "intermediate", estimatedMinutes: 6, xpReward: 60, skills: ["measurement", "gates"],
    starterCircuit: lessonCircuit("Measure Superposition", 1, 1, [op("h", "h", ["q0"], 0)]),
    successCondition: { type: "operationOrder", operations: [{ gate: "h", target: "q0" }, { gate: "measure", target: "q0" }] },
    hint: "Place H first and Measure second.", quantaIntro: "Let's turn a quantum possibility into a classical result.",
    quantaHint: "The order matters: prepare first, measure second.", quantaSuccess: "Superposition measured successfully.", quantaIncorrect: "Use H followed by Measure.", order: 14,
  },
  {
    id: "noise-vs-ideal",
    title: "Why Hardware Disagrees",
    module: "measurement",
    description: "Compare ideal simulation with a noisy Bell experiment.",
    story:
      "Real quantum hardware introduces gate and readout errors. Run the Bell experiment with Ideal and Realistic noise, then compare the histograms.",
    difficulty: "intermediate",
    estimatedMinutes: 8,
    xpReward: 60,
    skills: ["measurement"],
    starterCircuit: lessonCircuit("Noisy Bell", 2, 2, [
      op("noise-h", "h", ["q0"], 0),
      op("noise-cx", "cx", ["q1"], 1, ["q0"]),
      op("noise-m0", "measure", ["q0"], 2, [], ["c0"]),
      op("noise-m1", "measure", ["q1"], 2, [], ["c1"]),
    ]),
    successCondition: {
      type: "all",
      conditions: [
        { type: "hasGate", gate: "h" },
        { type: "hasControlledGate", gate: "cx" },
        { type: "hasMeasurement", qubit: "q0", classical: "c0" },
        { type: "hasMeasurement", qubit: "q1", classical: "c1" },
      ],
    },
    hint: "Build the Bell circuit, then use Run with the Realistic noise preset.",
    quantaIntro: "Ideal math is neat. Hardware adds a little static.",
    quantaHint: "Run the same Bell circuit twice: Ideal, then Realistic.",
    quantaSuccess: "You spotted the difference between a model and a device.",
    quantaIncorrect: "Complete the Bell circuit with both measurements.",
    order: 15,
  },
  {
    id: "two-qubits-four-states", title: "Two Qubits, Four States", module: "multi-qubit-gates",
    description: "Create a two-qubit circuit and inspect its four basis states.",
    story: "Two qubits have four computational basis states: |00⟩, |01⟩, |10⟩, and |11⟩.",
    difficulty: "beginner", estimatedMinutes: 5, xpReward: 40, skills: ["qubits"],
    starterCircuit: lessonCircuit("Four States", 1), successCondition: { type: "minQubits", count: 2 },
    hint: "Add a second qubit if needed and inspect the Results panel.", quantaIntro: "Adding one qubit doubles the basis-state vocabulary.",
    quantaHint: "Count the two-bit strings: 00, 01, 10, 11.", quantaSuccess: "Four states understood.", quantaIncorrect: "This lesson needs two qubit wires.", order: 16,
  },
  {
    id: "cx-basics", title: "CX Basics", module: "multi-qubit-gates",
    description: "Place a controlled-X gate between two qubits.",
    story: "CX flips its target only when its control is |1⟩. It is the most common way to connect two wires.",
    difficulty: "intermediate", estimatedMinutes: 6, xpReward: 60, skills: ["gates", "entanglement"],
    starterCircuit: lessonCircuit("CX Basics", 2, 0, [op("cx-preview", "x", ["q1"], 0)]),
    successCondition: { type: "hasControlledGate", gate: "cx" }, hint: "Place CX with q0 as control and q1 as target.",
    quantaIntro: "Now qubits can condition one another.", quantaHint: "The small control dot and target symbol must connect.",
    quantaSuccess: "Controlled logic online.", quantaIncorrect: "Add a CX controlled gate.", order: 17,
  },
  {
    id: "cz-and-swap", title: "CZ and SWAP", module: "multi-qubit-gates",
    description: "Compare a controlled phase flip with exchanging two wires.",
    story: "CZ changes the phase of |11⟩, while SWAP exchanges the complete states of two qubits.",
    difficulty: "intermediate", estimatedMinutes: 6, xpReward: 60, skills: ["gates", "phase"],
    starterCircuit: lessonCircuit("CZ SWAP", 2, 0, [op("cz-preview", "x", ["q1"], 0)]),
    successCondition: { type: "any", conditions: [{ type: "hasGate", gate: "cz" }, { type: "hasGate", gate: "swap" }] },
    hint: "Try CZ or SWAP and inspect the operation explanation.", quantaIntro: "Two gates, two different kinds of coordination.",
    quantaHint: "CZ is phase-focused; SWAP moves states between wires.", quantaSuccess: "Multi-qubit vocabulary expanded.", quantaIncorrect: "Place CZ or SWAP.", order: 18,
  },
  {
    id: "toffoli", title: "Toffoli (CCX)", module: "multi-qubit-gates",
    description: "Place a double-controlled X gate.",
    story: "The Toffoli gate flips its target only when both controls are |1⟩. It is a universal classical reversible primitive.",
    difficulty: "advanced", estimatedMinutes: 7, xpReward: 75, skills: ["gates", "algorithms"],
    starterCircuit: lessonCircuit("Toffoli", 3, 0, [op("ccx-preview", "x", ["q2"], 0)]),
    successCondition: { type: "hasGate", gate: "ccx" }, hint: "Use q0 and q1 as controls and q2 as target.", quantaIntro: "Two conditions can control one flip.", quantaHint: "CCX needs three wires.", quantaSuccess: "Toffoli mastered.", quantaIncorrect: "Add a CCX gate.", order: 19,
  },
  {
    id: "ghz-state", title: "Build a GHZ State", module: "entanglement",
    description: "Connect three qubits with H and two CX gates.",
    story: "A three-qubit GHZ state shares a coherent correlation across |000⟩ and |111⟩.",
    difficulty: "advanced", estimatedMinutes: 9, xpReward: 90, skills: ["entanglement", "algorithms"],
    starterCircuit: lessonCircuit("GHZ Preview", 3, 0, [op("h", "h", ["q0"], 0)]),
    successCondition: { type: "all", conditions: [{ type: "minQubits", count: 3 }, { type: "operationOrder", operations: [{ gate: "h", target: "q0" }, { gate: "cx" }, { gate: "cx" }] }] },
    hint: "Start with H, then connect q0 to q1 and q1 to q2.", quantaIntro: "Bell pairs can grow into a shared three-qubit state.",
    quantaHint: "Look for two controlled links after the H.", quantaSuccess: "GHZ correlation achieved.", quantaIncorrect: "Build H plus two CX gates on three qubits.", order: 22,
  },
  {
    id: "phase-kickback", title: "Phase Kickback", module: "entanglement",
    description: "Use CZ to make a phase on one qubit observable through interference.",
    story: "A controlled phase can imprint information on a control/target pair. Hadamards can convert that phase into a probability difference.",
    difficulty: "advanced", estimatedMinutes: 8, xpReward: 90, skills: ["entanglement", "phase"],
    starterCircuit: lessonCircuit("Phase Kickback", 2, 0, [op("h0", "h", ["q0"], 0)]),
    successCondition: { type: "hasControlledGate", gate: "cz" }, hint: "Place CZ between q0 and q1.", quantaIntro: "Phase can travel through a controlled interaction.", quantaHint: "Use H before or after CZ to reveal interference.", quantaSuccess: "You have seen phase kickback in action.", quantaIncorrect: "Add a controlled-Z gate.", order: 23,
  },
  {
    id: "deutsch-problem", title: "Deutsch's Problem", module: "algorithms",
    description: "Explore the H–oracle–H pattern on two qubits.",
    story: "Deutsch's algorithm uses interference to learn whether a one-bit function is constant or balanced with one oracle query.",
    difficulty: "advanced", estimatedMinutes: 10, xpReward: 100, skills: ["algorithms", "phase"],
    starterCircuit: lessonCircuit("Deutsch", 2, 0, [op("h0", "h", ["q0"], 0)]),
    successCondition: { type: "operationOrder", operations: [{ gate: "h" }, { gate: "h" }, { gate: "cx" }, { gate: "h" }] },
    hint: "Build the H, H, CX, H interference pattern.", quantaIntro: "Algorithms are choreography: prepare, query, interfere.", quantaHint: "Use two qubits and inspect the final probabilities.", quantaSuccess: "Deutsch's pattern is in place.", quantaIncorrect: "Follow the H–H–CX–H sequence.", order: 24,
  },
  {
    id: "teleportation-tour", title: "Quantum Teleportation Tour", module: "algorithms",
    description: "Explore a three-qubit teleportation circuit.",
    story: "Teleportation transfers an unknown quantum state using entanglement plus two classical correction bits — never copying the original state.",
    difficulty: "advanced", estimatedMinutes: 12, xpReward: 110, skills: ["algorithms", "entanglement"],
    starterCircuit: lessonCircuit("Teleportation Preview", 2), successCondition: { type: "minQubits", count: 3 },
    hint: "Add a third qubit (Edit → Add qubit) so the circuit has all three roles, then trace the wires.", quantaIntro: "Teleportation is a protocol, not science-fiction transport.",
    quantaHint: "Follow preparation, Bell interaction, measurement, and correction.", quantaSuccess: "Teleportation tour complete.", quantaIncorrect: "Teleportation needs three wires — add a qubit so the receiver has a place to live.", order: 26,
  },
  {
    id: "grover-two-qubits", title: "Grover with Two Qubits", module: "algorithms",
    description: "Combine H and CZ to mark a search state.",
    story: "Grover's algorithm amplifies a marked answer. Even a two-qubit toy circuit shows the alternating oracle and diffusion idea.",
    difficulty: "advanced", estimatedMinutes: 10, xpReward: 100, skills: ["algorithms", "phase"],
    starterCircuit: lessonCircuit("Grover Two Qubits", 2, 0, [op("h0", "h", ["q0"], 0)]),
    successCondition: { type: "all", conditions: [{ type: "hasGate", gate: "h" }, { type: "hasGate", gate: "cz" }] },
    hint: "Use H to prepare and CZ as a simple phase oracle.", quantaIntro: "Search becomes interference when amplitudes are amplified.", quantaHint: "Look at how the oracle changes phase, not just probability.", quantaSuccess: "Grover's two-qubit intuition is taking shape.", quantaIncorrect: "Add H and CZ gates.", order: 25,
  },
  {
    id: "openqasm-export", title: "OpenQASM Export", module: "qiskit",
    description: "Export the current circuit as OpenQASM.",
    story: "OpenQASM is a compact text representation of quantum circuits that tools can exchange.",
    difficulty: "intermediate", estimatedMinutes: 6, xpReward: 50, skills: ["qiskit"],
    starterCircuit: lessonCircuit("OpenQASM", 1, 0, [op("h", "h", ["q0"], 0)]), successCondition: { type: "actionExport", language: "openqasm" },
    hint: "Choose OpenQASM in the Code panel and export it.", quantaIntro: "One circuit can travel between visual and textual tools.",
    quantaHint: "Select the OpenQASM language tab first.", quantaSuccess: "OpenQASM exported.", quantaIncorrect: "Use the export action in the Code panel.", order: 29,
  },
  {
    id: "bind-parameters", title: "Bind Parameters", module: "qiskit",
    description: "Place a parameterized RX gate and bind its value.",
    story: "Symbolic parameters keep a circuit reusable. Before simulation, bind theta to a numeric angle.",
    difficulty: "intermediate", estimatedMinutes: 7, xpReward: 60, skills: ["qiskit", "phase"],
    starterCircuit: lessonCircuit("Bind Parameters", 1), successCondition: { type: "hasParameterGate", gate: "rx" },
    hint: "Add RX and enter a numeric parameter.", quantaIntro: "Parameters let one circuit describe many experiments.",
    quantaHint: "An unbound symbol is intentionally blocked from simulation.", quantaSuccess: "Parameter binding understood.", quantaIncorrect: "Place an RX parameter gate.", order: 30,
  },
  {
    id: "capstone-bell-experiment", title: "Capstone: Bell Experiment", module: "capstone",
    description: "Build, measure, and inspect a Bell experiment.",
    story: "Bring it all together: prepare H, entangle with CX, then measure both qubits into classical bits.",
    difficulty: "advanced", estimatedMinutes: 15, xpReward: 150, skills: ["algorithms", "entanglement", "measurement"],
    starterCircuit: lessonCircuit("Bell Experiment", 2, 2, [op("h", "h", ["q0"], 0), op("cx", "cx", ["q1"], 1, ["q0"]), op("m0", "measure", ["q0"], 2, [], ["c0"])]),
    successCondition: {
      type: "all",
      conditions: [
        { type: "hasGate", gate: "h" },
        { type: "hasControlledGate", gate: "cx" },
        { type: "hasMeasurement", qubit: "q0", classical: "c0" },
        { type: "hasMeasurement", qubit: "q1", classical: "c1" },
      ],
    },
    hint: "Prepare, entangle, and measure both wires.", quantaIntro: "This is your first complete quantum experiment.",
    quantaHint: "Use Results to inspect probabilities and shots.", quantaSuccess: "Capstone complete — you ran a Bell experiment.", quantaIncorrect: "Build H, CX, and two measurements.", order: 31,
  },
  {
    id: "qml-encode-data",
    title: "Encode Data into a Qubit",
    module: "quantum-ml",
    description: "Turn a classical number into a rotation angle.",
    story: "Machine learning starts with data. A quantum model starts by writing that data into qubit angles — an RX or RY rotation whose angle is the feature value.",
    difficulty: "beginner",
    estimatedMinutes: 7,
    xpReward: 60,
    skills: ["qml", "gates"],
    starterCircuit: lessonCircuit("Encode Data", 1),
    successCondition: {
      type: "any",
      conditions: [
        { type: "hasParameterGate", gate: "ry", target: "q0" },
        { type: "hasParameterGate", gate: "rx", target: "q0" },
      ],
    },
    hint: "Place RX or RY on q0 and give it an angle — that angle is your data point.",
    quantaIntro: "Data goes in as angles. That's the whole trick.",
    quantaHint: "Any rotation gate with a number works. Try RY(0.8).",
    quantaSuccess: "One number, one angle, one qubit. That's angle encoding.",
    quantaIncorrect: "Add a parameterised rotation (RX or RY) on q0.",
    order: 32,
    prerequisites: ["bind-parameters"],
  },
  {
    id: "qml-parameterised-ansatz",
    title: "Build a Trainable Ansatz",
    module: "quantum-ml",
    description: "Add symbolic rotation angles that an optimiser can tune.",
    story: "After encoding data, a model needs knobs. A parameterised circuit — an ansatz — has rotation angles left as symbols like θ that training adjusts.",
    difficulty: "intermediate",
    estimatedMinutes: 8,
    xpReward: 70,
    skills: ["qml", "gates", "entanglement"],
    starterCircuit: lessonCircuit("Trainable Ansatz", 2, 0, [
      op("ans-enc0", "ry", ["q0"], 0, [], [], numericParameter(0.8)),
      op("ans-enc1", "ry", ["q1"], 0, [], [], numericParameter(2.4)),
    ]),
    successCondition: {
      type: "all",
      conditions: [
        { type: "hasSymbolicParameter", minCount: 1 },
        { type: "hasControlledGate", gate: "cx" },
      ],
    },
    hint: "Add RY gates with symbolic angles (type theta in the inspector) and connect the qubits with CX.",
    quantaIntro: "Numbers are data. Symbols are knobs.",
    quantaHint: "In the inspector, type a name like theta instead of a number.",
    quantaSuccess: "Encoding, trainable rotations, entanglement — that's a real ansatz.",
    quantaIncorrect: "You need at least one symbolic angle (e.g. theta) and a CX gate.",
    order: 33,
    prerequisites: ["qml-encode-data"],
  },
  {
    id: "qml-measure-prediction",
    title: "Read Out a Prediction",
    module: "quantum-ml",
    description: "Turn measurement statistics into a class label.",
    story: "A model has to answer. In a variational classifier the answer is read from measurement statistics — for example P(1) on the first qubit above or below 0.5.",
    difficulty: "intermediate",
    estimatedMinutes: 7,
    xpReward: 60,
    skills: ["qml", "measurement"],
    starterCircuit: lessonCircuit("Read Out Prediction", 2, 2, [
      op("pred-enc0", "ry", ["q0"], 0, [], [], numericParameter(0.8)),
      op("pred-enc1", "ry", ["q1"], 0, [], [], numericParameter(2.4)),
      op("pred-theta0", "ry", ["q0"], 1, [], [], symbolicParameter("theta0")),
      op("pred-theta1", "ry", ["q1"], 1, [], [], symbolicParameter("theta1")),
      op("pred-cx", "cx", ["q1"], 2, ["q0"]),
    ]),
    successCondition: {
      type: "hasMeasurement",
      qubit: "q0",
      classical: "c0",
    },
    hint: "Add a measurement on q0 to c0 — its 0/1 statistics are the prediction.",
    quantaIntro: "Ask the circuit a question: measure.",
    quantaHint: "Measure q0 into c0, then run shots to see P(1).",
    quantaSuccess: "P(1) ≥ 0.5 → class 1. Your circuit now predicts.",
    quantaIncorrect: "Measure q0 into c0.",
    order: 34,
    prerequisites: ["qml-parameterised-ansatz"],
  },
  {
    id: "qml-training-loop",
    title: "The Training Loop",
    module: "quantum-ml",
    description: "See how gradient descent tunes a rotation angle.",
    story: "Training means repeating: run the circuit, compute the loss, adjust θ. With one qubit and one θ you can do it by hand.",
    difficulty: "advanced",
    estimatedMinutes: 9,
    xpReward: 80,
    skills: ["qml", "algorithms"],
    starterCircuit: lessonCircuit("Training Loop", 1, 1, [
      op("train-theta", "ry", ["q0"], 0, [], [], symbolicParameter("theta", 0.3)),
      op("train-measure", "measure", ["q0"], 1, [], ["c0"]),
    ]),
    successCondition: {
      type: "all",
      conditions: [
        { type: "hasSymbolicParameter", gate: "ry" },
        { type: "hasMeasurement", qubit: "q0" },
      ],
    },
    hint: "Keep RY(θ) and the measurement; use the inspector to bind θ to different values and watch P(1) move toward your target.",
    quantaIntro: "Let's train a model with one knob.",
    quantaHint: "Bind θ = 0.3, then 1.0, then 2.0. Which gives P(1) closest to 0.9?",
    quantaSuccess: "You just did gradient descent by hand.",
    quantaIncorrect: "Keep a symbolic RY(θ) and a measurement on q0.",
    order: 35,
    prerequisites: ["qml-measure-prediction"],
  },
  {
    id: "qml-capstone-classifier",
    title: "Capstone: Two-Feature Classifier",
    module: "quantum-ml",
    description: "Assemble encoding, ansatz, entanglement and readout, then export it to quantum-learn.",
    story: "Put every piece together: two encoded features, trainable rotations, a CX to mix them, and a measured output qubit — a complete variational classifier.",
    difficulty: "advanced",
    estimatedMinutes: 12,
    xpReward: 120,
    skills: ["qml", "entanglement", "measurement"],
    starterCircuit: lessonCircuit("Two-Feature Classifier", 2, 2),
    successCondition: {
      type: "all",
      conditions: [
        { type: "hasParameterGate", gate: "ry", target: "q0" },
        { type: "hasParameterGate", gate: "ry", target: "q1" },
        { type: "hasSymbolicParameter", minCount: 2 },
        { type: "hasControlledGate", gate: "cx" },
        { type: "hasMeasurement", qubit: "q0", classical: "c0" },
      ],
    },
    hint: "Encode with RY on both qubits, add at least two symbolic RY angles, connect with CX, then measure q0.",
    quantaIntro: "Final assembly. You know every part.",
    quantaHint: "Order: encode → symbolic rotations → CX → measure q0.",
    quantaSuccess: "That's a variational quantum classifier. Export it from the quantum-learn tab and train it for real.",
    quantaIncorrect: "Check: RY on both qubits, two symbolic angles, a CX, and a measurement on q0.",
    order: 36,
    prerequisites: ["qml-training-loop"],
  },
];

const LESSON_CONTENT: Record<
  string,
  Pick<LessonDefinition, "sections" | "quiz">
> = {
  "what-is-a-qubit": {
    sections: [
      {
        heading: "Start with a state",
        body:
          "A classical bit is a physical system with two named outcomes: 0 or 1. A quantum state is a description of what a measurement could reveal, not a tiny object secretly carrying an ordinary answer.\n\nYour new circuit begins with q[0] in |0⟩. The vertical wire is the qubit, and the empty canvas means no operation has changed that starting state.",
        quantaNote: "One quiet wire is a perfectly good first experiment.",
      },
      {
        heading: "What makes it quantum?",
        body:
          "A qubit can have amplitudes for both |0⟩ and |1⟩. Squaring their magnitudes gives probabilities, while relative phase affects how later gates combine those amplitudes.\n\nThis does not mean a measurement prints a fuzzy third answer. Measurement returns 0 or 1, and repeated shots reveal the probabilities predicted by the state.",
        quantaNote: "Think possibilities before thinking answers.",
      },
      {
        heading: "Look around Build",
        body:
          "Open the Build workspace and identify the q[0] wire, Gate library, Inspector, Results, and Code panels. Nothing needs to be dragged for this introduction.\n\nSelect Check Answer when the vocabulary feels comfortable. Later lessons will turn the same empty wire into an experiment.",
        quantaNote: "Curiosity is the only gate required here.",
      },
    ],
    quiz: [
      {
        id: "what-is-a-qubit-state",
        question: "What does measuring a qubit produce?",
        options: ["A classical 0 or 1", "A permanent third value", "The entire wavefunction as text"],
        answerIndex: 0,
        explanation: "Measurement produces a classical outcome; amplitudes determine the distribution across many shots.",
      },
      {
        id: "what-is-a-qubit-start",
        question: "What state does an untouched q[0] start in?",
        options: ["|1⟩", "|0⟩", "A random classical bit"],
        answerIndex: 1,
        explanation: "The default circuit state is |0⟩ until gates or measurement-related operations change it.",
      },
    ],
  },
  "add-first-gate": {
    sections: [
      {
        heading: "A gate is an operation",
        body:
          "A gate changes amplitudes according to a precise reversible rule. Pauli-X is the quantum analogue of a NOT operation: X maps |0⟩ to |1⟩ and |1⟩ to |0⟩.\n\nThe symbol on the tile is a compact label for a matrix operation, not a physical switch you can toggle by hand.",
        quantaNote: "A tiny X is your first controlled change.",
      },
      {
        heading: "Place X",
        body:
          "Drag X from the Gate library onto q[0]. The canvas records the gate in a column, and the Results panel updates the simulated state.\n\nSelect the operation to open its Inspector. You can move or remove it there, but the success check only needs X on q[0].",
        quantaNote: "Aim for the wire, then let the canvas snap it into place.",
      },
      {
        heading: "Read the result",
        body:
          "After X, the ideal state is |1⟩, so a measurement should return 1 every time. This is a deterministic example: the probability chart has one bar at 1.\n\nPress Check Answer after placing the gate. The lesson checker looks at the circuit structure rather than guessing from a screenshot.",
        quantaNote: "You placed a gate and made a prediction—excellent lab practice.",
      },
    ],
    quiz: [
      {
        id: "add-first-gate-x",
        question: "What does X do to |0⟩?",
        options: ["Maps it to |1⟩", "Leaves it unchanged", "Turns it into a measurement"],
        answerIndex: 0,
        explanation: "Pauli-X swaps the computational basis states, so |0⟩ becomes |1⟩.",
      },
      {
        id: "add-first-gate-ui",
        question: "Where should you drag X for this lesson?",
        options: ["Into the Results chart", "Onto q[0]", "Onto a classical c[0] wire"],
        answerIndex: 1,
        explanation: "The target q[0] wire identifies which qubit receives the operation.",
      },
    ],
  },
  "create-superposition": {
    sections: [
      {
        heading: "Probability can be shared",
        body:
          "Hadamard, written H, maps |0⟩ to an equal-amplitude combination of |0⟩ and |1⟩. The amplitudes are 1/√2, so each outcome has probability 1/2.\n\nThis is not the same as secretly choosing 0 or 1 early. Before measurement, phase-sensitive gates can still make the two paths interfere.",
        quantaNote: "H opens two quantum paths at once.",
      },
      {
        heading: "Build one H",
        body:
          "Drag H from the Gate library onto q[0]. Keep the circuit to one operation for this exercise; the checker uses the operation count as well as the target.\n\nOpen the Results panel → Probabilities and compare the two bars. The visual chart is a numerical view of the state amplitudes.",
        quantaNote: "One H, one wire, two equally likely outcomes.",
      },
      {
        heading: "Predict before running",
        body:
          "If you run many shots after H, the counts should approach a 50/50 split, with ordinary sampling noise. A small run may not be exactly even.\n\nThe state is still described by amplitudes between shots. A shot is one measurement experiment, not a permanent rewrite of the circuit.",
        quantaNote: "Make your prediction before you press Run.",
      },
    ],
    quiz: [
      {
        id: "create-superposition-h",
        question: "What probabilities does H create from |0⟩?",
        options: ["50% |0⟩ and 50% |1⟩", "100% |1⟩", "25% for each of four states"],
        answerIndex: 0,
        explanation: "H creates equal magnitude amplitudes on the two one-qubit basis states.",
      },
      {
        id: "create-superposition-shots",
        question: "Why might 20 shots not show exactly ten 0s and ten 1s?",
        options: ["H secretly changes its gate each shot", "Sampling has ordinary statistical variation", "The chart measures phase as a third outcome"],
        answerIndex: 1,
        explanation: "Finite samples fluctuate around the ideal probabilities.",
      },
    ],
  },
  "flip-with-x": {
    sections: [
      {
        heading: "Revisit the bit flip",
        body:
          "X is reversible: applying it twice returns the original computational basis state. On |0⟩, the first X produces |1⟩.\n\nThe gate changes the state predictably without measuring it, so the circuit remains a coherent quantum process.",
        quantaNote: "You are learning a gate well enough to predict it.",
      },
      {
        heading: "Keep the circuit focused",
        body:
          "Use Reset if an earlier experiment is still on the canvas. Drag X from the Gate library onto q[0], then inspect the operation label and column.\n\nThe success condition is deliberately simple: it checks for X on the requested wire, not for a particular screenshot or chart animation.",
        quantaNote: "Reset is a tool, not a failure.",
      },
      {
        heading: "Connect structure to outcome",
        body:
          "An X on |0⟩ predicts a measurement of 1 with probability 1. If you add another X, the final state changes back, which is why operation order matters.\n\nTry that extra experiment after passing the lesson, then remove it before checking a one-gate answer.",
        quantaNote: "Prediction and inspection make a strong circuit habit.",
      },
    ],
    quiz: [
      {
        id: "flip-with-x-result",
        question: "What is the ideal result of X applied to |0⟩?",
        options: ["|1⟩", "|0⟩ with a phase only", "A measurement error"],
        answerIndex: 0,
        explanation: "X swaps |0⟩ and |1⟩, so the state is |1⟩.",
      },
      {
        id: "flip-with-x-reversible",
        question: "What happens after X followed by X?",
        options: ["It becomes permanently random", "The qubit returns to |0⟩", "It is automatically measured"],
        answerIndex: 1,
        explanation: "X is its own inverse: X·X is the identity operation.",
      },
    ],
  },
  "rotate-with-rx": {
    sections: [
      {
        heading: "Rotation is continuous",
        body:
          "RX rotates a qubit around the Bloch sphere's x axis. Its parameter is an angle, commonly written θ, so one gate family describes many different rotations.\n\nUnlike X, which is a particular half-turn, RX can use π/4, π/2, or another numeric angle.",
        quantaNote: "A parameter is a dial, not a new kind of qubit.",
      },
      {
        heading: "Place and edit RX",
        body:
          "Drag RX from the Gate library onto q[0]. In the Inspector, enter a numeric angle such as π/2 if the editor supports the expression, or use the default value.\n\nThe circuit must retain a parameter entry. A symbolic name such as theta is useful for reusable code, but simulation needs a binding before it can calculate numbers.",
        quantaNote: "Turn the dial gently and watch the state respond.",
      },
      {
        heading: "Compare angles",
        body:
          "Run with two different angles and inspect Probabilities in Results. The probability change depends on the angle, while the full state also carries phase information.\n\nThis is why parameterized circuits are useful: the structure stays fixed while an experiment sweeps values.",
        quantaNote: "Same circuit shape, many experiments.",
      },
    ],
    quiz: [
      {
        id: "rotate-with-rx-axis",
        question: "What does the RX parameter represent?",
        options: ["A rotation angle", "A classical register name", "The number of shots"],
        answerIndex: 0,
        explanation: "RX(θ) uses θ as a continuous rotation angle around the x axis.",
      },
      {
        id: "rotate-with-rx-bind",
        question: "What must happen before an unbound RX(theta) can be simulated numerically?",
        options: ["Add a second canvas", "Bind theta to a number", "Convert it into a measurement"],
        answerIndex: 1,
        explanation: "A simulator cannot evaluate amplitudes until every symbolic parameter has a numeric value.",
      },
    ],
  },
  "measure-a-qubit": {
    sections: [
      {
        heading: "Quantum becomes classical",
        body:
          "Measurement asks the quantum state for a computational-basis outcome. The result is classical, and the act of measuring generally changes the state that remains.\n\nFor one qubit, the result is recorded in a classical bit such as c[0].",
        quantaNote: "Measurement is a question with a physical consequence.",
      },
      {
        heading: "Connect q[0] to c[0]",
        body:
          "Drag Measure onto q[0]. The operation should map the quantum target q[0] to the classical target c[0]; the Inspector shows that mapping when selected.\n\nIf your circuit has no classical register, use the circuit controls to add one before placing Measure.",
        quantaNote: "Follow the wire all the way to its classical notebook.",
      },
      {
        heading: "Interpret one shot",
        body:
          "A single shot produces one classical bit. Repeating the same circuit samples the same underlying probabilities, so a histogram is more informative than one result.\n\nDo not confuse a measured outcome with the pre-measurement amplitudes. The Results panel can show both views.",
        quantaNote: "One result is a clue; many shots are evidence.",
      },
    ],
    quiz: [
      {
        id: "measure-a-qubit-output",
        question: "Where does a measurement result go in this lesson?",
        options: ["Classical c[0]", "A second qubit q[1]", "The gate library"],
        answerIndex: 0,
        explanation: "Measurement maps q[0] to the classical register bit c[0].",
      },
      {
        id: "measure-a-qubit-shots",
        question: "Why run multiple shots?",
        options: ["To create more qubits", "To estimate outcome probabilities", "To change the gate matrix"],
        answerIndex: 1,
        explanation: "Repeated measurements reveal the distribution predicted by the quantum state.",
      },
    ],
  },
  "build-bell-state": {
    sections: [
      {
        heading: "Two wires can correlate",
        body:
          "A Bell state starts with two independent qubits, then uses H and CX to create a shared quantum state. The final state has correlated outcomes even though neither qubit has a fixed value before measurement.\n\nThe correlation is not a classical instruction list; the pair is described by joint amplitudes.",
        quantaNote: "Two wires, one shared story.",
      },
      {
        heading: "Follow the preparation",
        body:
          "Open the guided Bell walkthrough or drag H onto q[0], followed by CX with q[0] as control and q[1] as target. Step through the operation layers in the Inspector.\n\nThe Step through card compares probabilities and phases before and after each layer, so you can see what the gates actually changed.",
        quantaNote: "Let the walkthrough reveal the correlation one layer at a time.",
      },
      {
        heading: "Check joint outcomes",
        body:
          "At the end, the ideal Bell state has support on |00⟩ and |11⟩. Measuring both qubits gives matching bits in the ideal experiment.\n\nDelete CX in the walkthrough and step to the end to compare a product state. Undo restores the entangling operation.",
        quantaNote: "Matching results are evidence of a relationship, not identical wires.",
      },
    ],
    quiz: [
      {
        id: "build-bell-state-order",
        question: "Which preparation makes the standard Bell state?",
        options: ["H then CX", "Measure then H", "Two measurements with no gates"],
        answerIndex: 0,
        explanation: "H creates a superposition on q0 and CX correlates q1 with it.",
      },
      {
        id: "build-bell-state-results",
        question: "Which ideal outcomes appear for the |Φ+⟩ Bell state?",
        options: ["|01⟩ and |10⟩ only", "|00⟩ and |11⟩", "All four equally"],
        answerIndex: 1,
        explanation: "The standard H–CX preparation creates equal support on matching computational outcomes.",
      },
    ],
  },
  "entangle-two-qubits": {
    sections: [
      {
        heading: "Entanglement is joint structure",
        body:
          "A two-qubit state is entangled when it cannot be written as a product of one independent state for q0 and one for q1. The correlations belong to the pair.\n\nThis is a statement about the mathematical state, not a claim that a signal travels faster than light.",
        quantaNote: "Ask what the pair can do that two singles cannot.",
      },
      {
        heading: "Use H and CX",
        body:
          "Place H on q[0], then CX with q[0] controlling q[1]. In the Inspector, select CX and verify its control dot and target are on different wires.\n\nThe Results visualization shows joint basis probabilities. Looking only at one marginal chart can hide the relationship.",
        quantaNote: "The control dot is part of the lesson's grammar.",
      },
      {
        heading: "Compare to a product state",
        body:
          "The Bell pair produces matching results, while a product state can also have definite or random-looking marginals without being entangled. The step explanation card labels the two-qubit state when its determinant test detects entanglement.\n\nTry removing CX only after you have checked the original circuit.",
        quantaNote: "Compare circuits, not just individual bars.",
      },
    ],
    quiz: [
      {
        id: "entangle-two-qubits-definition",
        question: "What makes a two-qubit state entangled?",
        options: ["It cannot be factored into two independent single-qubit states", "It contains two wires", "It always measures 1"],
        answerIndex: 0,
        explanation: "Entanglement is non-factorability of the joint state, not merely having multiple qubits.",
      },
      {
        id: "entangle-two-qubits-cx",
        question: "What role does CX play after H on q0?",
        options: ["It measures both qubits", "It correlates q1 with q0", "It deletes the superposition"],
        answerIndex: 1,
        explanation: "CX conditionally flips its target and turns the prepared superposition into a Bell correlation.",
      },
    ],
  },
  "export-first-qiskit": {
    sections: [
      {
        heading: "Circuits have text forms",
        body:
          "A visual circuit is one representation of a program. Qiskit code expresses the same operations as calls such as qc.h(0) and qc.cx(0, 1).\n\nExport is useful when you want to reproduce the experiment in a notebook or share it with someone who works in code.",
        quantaNote: "Same circuit, different language.",
      },
      {
        heading: "Export carefully",
        body:
          "Open the Code panel and choose a supported Qiskit language. The generated text should list the circuit's gates in execution order.\n\nWarnings matter: if a generator cannot represent part of the circuit, the interface should tell you rather than silently claiming a complete export.",
        quantaNote: "Trustworthy code is better than code that merely looks tidy.",
      },
      {
        heading: "Read one line back",
        body:
          "Compare a gate in the canvas with its exported call. Check the qubit indices and any classical mapping, especially for controlled gates and measurements.\n\nUse the export action after you understand what was emitted. The lesson is about translating meaning, not copying punctuation.",
        quantaNote: "Trace one operation from tile to text.",
      },
    ],
    quiz: [
      {
        id: "export-first-qiskit-purpose",
        question: "Why export a circuit to Qiskit?",
        options: ["To reproduce it in a Python workflow", "To turn measurements into qubits", "To hide unsupported gates"],
        answerIndex: 0,
        explanation: "Export connects the visual editor to programmable experiments and notebooks.",
      },
      {
        id: "export-first-qiskit-warning",
        question: "What should you do when export reports a warning?",
        options: ["Assume omitted gates are harmless", "Inspect the warning before trusting the code", "Delete the original circuit"],
        answerIndex: 1,
        explanation: "A warning may indicate that the generated representation is incomplete.",
      },
    ],
  },
  "lesson_export_h": {
    sections: [
      {
        heading: "One gate in two views",
        body:
          "The H tile and a Qiskit qc.h(0) call describe the same operation on q0. The visual column shows when it runs; the code line shows the same order textually.\n\nLearning to translate one simple gate makes larger programs less intimidating.",
        quantaNote: "Start with one line before reading a whole program.",
      },
      {
        heading: "Use the Code panel",
        body:
          "Place H on q[0], open Code, and switch between the available language tabs. Watch how the gate name and qubit index are rendered.\n\nThe canvas remains the source you can inspect visually, while the generated code is a proposed textual view.",
        quantaNote: "Look for the q[0] index hiding in plain sight.",
      },
      {
        heading: "Keep meaning intact",
        body:
          "A correct export preserves operation order and target wires. If you add a second gate, its later column should appear later in the generated program.\n\nUse Check Answer when the visual and textual descriptions agree.",
        quantaNote: "Order is part of a circuit's meaning.",
      },
    ],
    quiz: [
      {
        id: "lesson-export-h-call",
        question: "Which call represents H on q[0]?",
        options: ["qc.h(0)", "qc.measure(0, 0) only", "qc.cx(0, 1)"],
        answerIndex: 0,
        explanation: "qc.h(0) applies Hadamard to the first qubit.",
      },
      {
        id: "lesson-export-h-order",
        question: "What must an export preserve besides gate names?",
        options: ["The browser window size", "Order and wire targets", "The mascot's animation"],
        answerIndex: 1,
        explanation: "Changing order or targets changes the circuit's behavior.",
      },
    ],
  },
  "import-qiskit-visualize": {
    sections: [
      {
        heading: "Text can become a circuit",
        body:
          "Import performs the reverse translation: code is parsed into operations that the canvas can display. A short Qiskit program such as qc.h(0) is a useful first test.\n\nThe parser must distinguish valid syntax from text that only resembles a gate call.",
        quantaNote: "We can turn a few lines of code into something you can see.",
      },
      {
        heading: "Paste, then sync",
        body:
          "Open the Code panel, choose Qiskit, paste the snippet, and use the sync or apply action. Confirm that q[0] receives H and that Results updates.\n\nIf the parser reports a warning or error, read it before applying anything. Safe import avoids silently dropping an operation.",
        quantaNote: "Warnings are helpful breadcrumbs, not obstacles.",
      },
      {
        heading: "Compare both representations",
        body:
          "After import, select the gate and inspect its operation type, target, and column. Compare that information with the source line you pasted.\n\nTry a controlled gate next and verify both control and target wires survive the translation.",
        quantaNote: "A good import leaves no mystery wire behind.",
      },
    ],
    quiz: [
      {
        id: "import-qiskit-visualize-direction",
        question: "What does import do?",
        options: ["Parses code into a visual circuit", "Exports a screenshot", "Measures every qubit"],
        answerIndex: 0,
        explanation: "The importer translates supported code into operations for the canvas.",
      },
      {
        id: "import-qiskit-visualize-warning",
        question: "Why inspect an import warning?",
        options: ["Warnings always mean success", "A warning can mean the resulting circuit is incomplete", "Warnings change the qubit count randomly"],
        answerIndex: 1,
        explanation: "Applying incomplete parser output could silently change the experiment.",
      },
    ],
  },
  "bits-vs-qubits": {
    sections: [
      {
        heading: "Bit first, then qubit",
        body:
          "A bit is a classical variable with one of two values, 0 or 1. A qubit also has two computational basis labels, |0⟩ and |1⟩, but its state can carry amplitudes for both before measurement.\n\nThat extra structure is why quantum programs use interference rather than only ordinary logic.",
        quantaNote: "Every quantum idea gets clearer when we name the classical comparison.",
      },
      {
        heading: "Possibility is not secrecy",
        body:
          "A superposition is not just a hidden coin that already chose heads or tails. Relative phase lets amplitudes reinforce or cancel when gates act.\n\nMeasurement still returns one classical result, and probabilities tell us how often each result appears over repeated shots.",
        quantaNote: "A qubit is not a bit wearing a tiny disguise.",
      },
      {
        heading: "Make the comparison concrete",
        body:
          "Open Results after adding an H gate in a later lesson. The probability chart shows the quantum distribution, while the circuit itself records the operations that created it.\n\nFor now, describe a bit as a definite value and a qubit as a state with amplitudes that can interfere.",
        quantaNote: "Good foundations make every later chart easier to read.",
      },
    ],
    quiz: [
      {
        id: "bits-vs-qubits-classical",
        question: "What values can a classical bit hold?",
        options: ["0 or 1", "Any complex amplitude", "A probability histogram"],
        answerIndex: 0,
        explanation: "A classical bit has one definite binary value at a time.",
      },
      {
        id: "bits-vs-qubits-superposition",
        question: "What is special about a qubit before measurement?",
        options: ["It secretly stores every answer", "Its amplitudes can combine and interfere", "It has no possible measurement result"],
        answerIndex: 1,
        explanation: "Quantum amplitudes carry magnitude and phase, enabling interference.",
      },
    ],
  },
  "reading-the-charts": {
    sections: [
      {
        heading: "Probability bars",
        body:
          "The Probabilities chart answers the practical question: how often should each basis state appear when measured? For one qubit, the labels are |0⟩ and |1⟩.\n\nThe bar heights sum to one, apart from display rounding.",
        quantaNote: "Read the bars as frequencies you expect across many shots.",
      },
      {
        heading: "Phase and geometry",
        body:
          "Phase is an angle attached to an amplitude. Two states can have the same probabilities now but behave differently after a later gate because their phases combine differently.\n\nThe Bloch sphere is a geometric picture of a pure single-qubit state; it is a guide, not a third measurement axis.",
        quantaNote: "Probability tells how much; phase tells how paths meet.",
      },
      {
        heading: "Inspect a real example",
        body:
          "Use the H example and open Results → Probabilities, then inspect the phase display and Bloch visualization. Move through the operation in the Inspector to compare before and after.\n\nUse the labels consistently: basis-state amplitudes are not the same thing as histogram counts.",
        quantaNote: "Three panels, one state, different questions.",
      },
    ],
    quiz: [
      {
        id: "reading-the-charts-probability",
        question: "What does a probability bar represent?",
        options: ["Expected frequency of a measurement outcome", "The gate's screen position", "A phase angle in degrees"],
        answerIndex: 0,
        explanation: "Probabilities predict the distribution of computational-basis measurement results.",
      },
      {
        id: "reading-the-charts-phase",
        question: "Why can phase matter when probabilities are unchanged?",
        options: ["Phase is another classical bit", "Later gates can make phase differences interfere", "The chart is always wrong"],
        answerIndex: 1,
        explanation: "Interference converts relative phase into observable probability changes.",
      },
    ],
  },
  "tour-the-build-workspace": {
    sections: [
      {
        heading: "Find the four views",
        body:
          "The Gate library is where operations begin. The canvas is the timeline of wires and columns. The Inspector explains a selected operation and lets you edit it.\n\nResults answers what the circuit simulates, while Code shows a textual representation for import or export.",
        quantaNote: "A workspace is easier when each panel has one job.",
      },
      {
        heading: "Place and inspect",
        body:
          "Drag H from the Gate library onto q[0], then click the gate. Read the Inspector's type, target, and column fields before opening Results.\n\nSelect the Results panel → Probabilities to connect the operation you placed with its predicted outcomes.",
        quantaNote: "Place, select, inspect: a reliable three-step tour.",
      },
      {
        heading: "Follow the text",
        body:
          "Open Code and compare the generated line with the H tile. Export only after checking that the operation is represented; warnings should remain visible.\n\nOnce you know these panel names, later lessons can focus on physics instead of navigation.",
        quantaNote: "Quanta knows where the buttons are now too.",
      },
    ],
    quiz: [
      {
        id: "tour-the-build-panels",
        question: "Which panel explains a selected operation?",
        options: ["Inspector", "Results only", "The browser address bar"],
        answerIndex: 0,
        explanation: "Inspector shows operation identity, wires, parameters, and editable details.",
      },
      {
        id: "tour-the-build-results",
        question: "Where do you look for measurement probabilities?",
        options: ["Gate library → Delete", "Results → Probabilities", "Code → Import only"],
        answerIndex: 1,
        explanation: "The Results panel visualizes the simulated state and probabilities.",
      },
    ],
  },
  "z-and-phase": {
    sections: [
      {
        heading: "A phase-only change",
        body:
          "Z maps |0⟩ to |0⟩ and |1⟩ to −|1⟩. If the input is a basis state, the minus sign does not change its immediate measurement probability.\n\nThe phase is still physical information because later interference can compare it with another path.",
        quantaNote: "Invisible now does not mean irrelevant later.",
      },
      {
        heading: "Try the HZH path",
        body:
          "Open the HZH guided walkthrough and step to H, then Z. The probabilities remain 50/50 after Z, but the |1⟩ phase flips from 0° to 180°.\n\nAt the final H, interference converts that phase difference into the |1⟩ outcome.",
        quantaNote: "Phase waits patiently for the right interference experiment.",
      },
      {
        heading: "Build the lesson",
        body:
          "Return to Build, drag Z from the Gate library onto q[0], and select Check Answer. Then use the walkthrough link after completion to compare the three layers.\n\nThe checker cares that Z is present; the walkthrough supplies the deeper physical explanation.",
        quantaNote: "First place the gate, then ask why it matters.",
      },
    ],
    quiz: [
      {
        id: "z-and-phase-probability",
        question: "What does Z do to |1⟩?",
        options: ["Multiplies its amplitude by −1", "Measures it as 1", "Deletes the qubit"],
        answerIndex: 0,
        explanation: "Z changes the phase of |1⟩ by π while preserving its magnitude.",
      },
      {
        id: "z-and-phase-hzh",
        question: "What reveals the phase change in HZH?",
        options: ["The first wire label", "The final H causes interference", "Increasing the browser width"],
        answerIndex: 1,
        explanation: "The final H combines paths so the relative phase changes probabilities.",
      },
    ],
  },
  "s-and-t-gates": {
    sections: [
      {
        heading: "Smaller phase turns",
        body:
          "S applies a π/2 phase to |1⟩, while T applies a π/4 phase. Both leave |0⟩ unchanged and preserve amplitude magnitudes.\n\nThey are useful when a circuit needs a precise phase rotation rather than the full π shift of Z.",
        quantaNote: "S and T are careful little turns.",
      },
      {
        heading: "Compare the tiles",
        body:
          "Drag S or T from the Gate library onto q[0]. Select the operation and read its type in Inspector, then compare the phase display in Results.\n\nTry one at a time so the difference between π/2 and π/4 stays easy to identify.",
        quantaNote: "Small angles are still real quantum work.",
      },
      {
        heading: "Connect to interference",
        body:
          "A phase-only operation may leave immediate basis probabilities unchanged. Add a later H in an experiment to make the phase difference observable.\n\nThe lesson accepts either S or T, but the explanation should tell you which one you chose.",
        quantaNote: "Save the phase, then choose a gate that can reveal it.",
      },
    ],
    quiz: [
      {
        id: "s-and-t-angle",
        question: "Which phase does T apply to |1⟩?",
        options: ["π/4", "π", "0 for every state"],
        answerIndex: 0,
        explanation: "T is an eighth-turn phase gate, corresponding to π/4.",
      },
      {
        id: "s-and-t-choice",
        question: "What do S and T have in common?",
        options: ["They both measure q[0]", "They change phase without changing |0⟩", "They always swap two qubits"],
        answerIndex: 1,
        explanation: "Both are diagonal phase gates that leave the |0⟩ component unchanged.",
      },
    ],
  },
  "h-twice-is-identity": {
    sections: [
      {
        heading: "Some gates undo themselves",
        body:
          "Hadamard creates superposition, but a second Hadamard reverses that transformation. In matrix language H·H = I, the identity operation.\n\nThis is a reminder that a circuit is an ordered composition, not just a bag of gates.",
        quantaNote: "Two good moves can bring you back home.",
      },
      {
        heading: "Use separate columns",
        body:
          "Drag H onto q[0], then place another H in the next column. The canvas order should read H followed by H from left to right.\n\nThe Inspector and step timeline make the two layers explicit even though the final probability looks like the start.",
        quantaNote: "Columns are the rhythm of the circuit.",
      },
      {
        heading: "Check the identity",
        body:
          "After both gates, the ideal state returns to |0⟩. The intermediate state after the first H is still important; it is where the superposition exists.\n\nUse Step through to compare the intermediate and final snapshots.",
        quantaNote: "The path matters even when the destination repeats.",
      },
    ],
    quiz: [
      {
        id: "h-twice-identity-equation",
        question: "What is H·H?",
        options: ["The identity operation", "A measurement", "A controlled-X gate"],
        answerIndex: 0,
        explanation: "Hadamard is self-inverse, so two applications cancel.",
      },
      {
        id: "h-twice-identity-columns",
        question: "Why use two columns?",
        options: ["To create a second register automatically", "To show execution order", "To hide the first H"],
        answerIndex: 1,
        explanation: "Columns encode when operations occur in the circuit timeline.",
      },
    ],
  },
  "run-shots-histogram": {
    sections: [
      {
        heading: "One shot versus many",
        body:
          "A shot is one execution followed by measurement. A histogram groups many shots by their classical bit strings, making the expected distribution visible.\n\nFor H followed by Measure, a small sample may be uneven even though the ideal probabilities are equal.",
        quantaNote: "One duck-sized experiment is a sample; a flock shows a pattern.",
      },
      {
        heading: "Use Run and shots",
        body:
          "Build H on q[0] and Measure it into c[0]. Open Results, choose a shots count, and press Run to generate a histogram.\n\nIncrease the number of shots to reduce ordinary sampling noise, but do not expect every finite histogram to be perfectly balanced.",
        quantaNote: "More shots make the trend easier to see.",
      },
      {
        heading: "Read classical labels",
        body:
          "The histogram labels are classical outcomes, such as 0 and 1 or multi-bit strings. They are not amplitudes and they do not replace the circuit state view.\n\nCompare the histogram with Results → Probabilities to connect repeated sampling to the simulated prediction.",
        quantaNote: "Count outcomes, then ask what state produced them.",
      },
    ],
    quiz: [
      {
        id: "run-shots-purpose",
        question: "What does increasing shots mainly do?",
        options: ["Improves the estimate of the distribution", "Changes H into X", "Adds a qubit wire"],
        answerIndex: 0,
        explanation: "More independent samples make empirical frequencies more stable.",
      },
      {
        id: "run-shots-histogram",
        question: "What does a histogram bar count?",
        options: ["The phase in radians", "Occurrences of a classical outcome", "The number of Gate library tiles"],
        answerIndex: 1,
        explanation: "Histograms summarize measured classical bit strings across shots.",
      },
    ],
  },
  "measure-superposition": {
    sections: [
      {
        heading: "Prepare before measuring",
        body:
          "H creates equal amplitudes on |0⟩ and |1⟩. Measure then samples one of those outcomes and records it in a classical bit.\n\nIf measurement comes first, there is no longer an unmeasured superposition for H to sample.",
        quantaNote: "Preparation first, question second.",
      },
      {
        heading: "Build H then Measure",
        body:
          "Place H on q[0] in an earlier column and Measure on q[0] in the next column. Ensure the measurement maps to c[0].\n\nSelect each operation to inspect its column. The lesson checker uses that ordered structure rather than just counting gates.",
        quantaNote: "Read left to right like a recipe.",
      },
      {
        heading: "Repeat the experiment",
        body:
          "Run several shots and expect the histogram to approach a 50/50 split. The exact counts vary because each shot samples a probability distribution.\n\nThe circuit itself remains the same between shots; only the measurement result changes.",
        quantaNote: "A stable recipe can produce varied samples.",
      },
    ],
    quiz: [
      {
        id: "measure-superposition-order",
        question: "Which order creates and then measures a superposition?",
        options: ["H, then Measure", "Measure, then H", "Two Measures only"],
        answerIndex: 0,
        explanation: "H prepares the superposition before measurement samples it.",
      },
      {
        id: "measure-superposition-output",
        question: "What ideal distribution follows H then Measure?",
        options: ["100% 0 every time", "About 50% 0 and 50% 1", "Four equally likely two-bit strings"],
        answerIndex: 1,
        explanation: "A single-qubit H state has equal computational-basis probabilities.",
      },
    ],
  },
  "noise-vs-ideal": {
    sections: [
      {
        heading: "Ideal math and real devices",
        body:
          "An ideal simulator applies the circuit's matrices exactly. Hardware has imperfect gates, drifting calibration, and readout electronics that can turn a correct state into a surprising bit string.\n\nRun the Bell circuit with Ideal noise first. Its matching 00 and 11 outcomes are the clean mathematical prediction.",
        quantaNote: "The ideal result is a reference, not a promise from hardware.",
      },
      {
        heading: "Random Pauli kicks and readout errors",
        body:
          "Depolarizing noise models an occasional random X, Y, or Z kick after a gate. One-qubit and two-qubit gates can have different error rates because entangling hardware is harder to control.\n\nReadout error happens after measurement: the state may be right, but the classical electronics can report the opposite bit. Choose Realistic in Run and compare it with Ideal.",
        quantaNote: "A tiny random kick can change a whole experiment's story.",
      },
      {
        heading: "Read the noisy histogram",
        body:
          "The Realistic Bell histogram should still favor 00 and 11, but 01 and 10 can leak into the bars. More shots make the pattern easier to see; they do not remove hardware noise.\n\nEngineers use calibration, error mitigation, and eventually error correction to reduce these effects. A noisy result is information about the device, not a failed idea.",
        quantaNote: "Look for the shape of the signal, then measure the leakage.",
      },
    ],
    quiz: [
      {
        id: "noise-vs-ideal-reference",
        question: "What does the Ideal noise setting represent?",
        options: [
          "Exact circuit evolution without modeled errors",
          "A circuit with random readout flips",
          "A circuit with no measurements",
        ],
        answerIndex: 0,
        explanation: "Ideal mode applies the circuit operations and measurements without added noise.",
      },
      {
        id: "noise-vs-ideal-leak",
        question: "What can 01 and 10 bars show in a noisy Bell histogram?",
        options: [
          "That the circuit has three qubits",
          "Leakage caused by gate or readout errors",
          "That probabilities are never sampled",
        ],
        answerIndex: 1,
        explanation: "Noise can break the perfect correlation, causing mismatched classical outcomes.",
      },
    ],
  },
  "two-qubits-four-states": {
    sections: [
      {
        heading: "Adding a wire doubles labels",
        body:
          "One qubit has two computational basis states: |0⟩ and |1⟩. Two qubits have four ordered strings: |00⟩, |01⟩, |10⟩, and |11⟩.\n\nThe first character refers to one wire according to the app's basis-label convention; always read the labels shown in Results.",
        quantaNote: "A second wire gives the state space four corners.",
      },
      {
        heading: "Inspect the canvas",
        body:
          "Use the circuit controls to make sure q[0] and q[1] are present. Open Results → Probabilities and look for the four basis labels.\n\nNo gate is required to understand the state count. The empty two-wire circuit already has the |00⟩ starting state.",
        quantaNote: "Sometimes the important operation is counting carefully.",
      },
      {
        heading: "Why this scales",
        body:
          "Each added qubit doubles the number of basis states: three qubits have eight, four have sixteen. The state vector grows exponentially even though the circuit drawing adds one wire.\n\nThis is one reason quantum algorithms focus on structure and interference rather than listing every amplitude.",
        quantaNote: "More wires create more possibilities, not automatically more answers.",
      },
    ],
    quiz: [
      {
        id: "two-qubits-four-states-count",
        question: "How many computational basis states do two qubits have?",
        options: ["Four", "Two", "Eight"],
        answerIndex: 0,
        explanation: "There are 2² = 4 binary strings of length two.",
      },
      {
        id: "two-qubits-four-states-start",
        question: "What is the untouched two-qubit basis state?",
        options: ["|11⟩", "|00⟩", "A four-way mixture with no amplitudes"],
        answerIndex: 1,
        explanation: "Each qubit starts in |0⟩, giving the joint state |00⟩.",
      },
    ],
  },
  "cx-basics": {
    sections: [
      {
        heading: "Conditional action",
        body:
          "CX has a control and a target. It flips the target only when the control is |1⟩, leaving the control itself unchanged.\n\nThe gate is reversible, so applying the same CX twice returns the pair to its earlier state.",
        quantaNote: "The dot asks a question; the X acts only when the answer is yes.",
      },
      {
        heading: "Place a controlled gate",
        body:
          "Drag CX from the Gate library onto q[0] and q[1], or use the operation Inspector to set q[0] as control and q[1] as target. The canvas draws a connected multi-wire operation.\n\nClick the gate to confirm both wires; a target-only label is not enough to describe CX.",
        quantaNote: "Controls and targets are a pair of roles.",
      },
      {
        heading: "See correlation grow",
        body:
          "With q[0] in |0⟩, CX does nothing to |00⟩. After H on q[0], the same CX correlates the two branches and can produce a Bell state.\n\nUse Step through to see why the control's input matters.",
        quantaNote: "A controlled gate needs a meaningful control state.",
      },
    ],
    quiz: [
      {
        id: "cx-basics-condition",
        question: "When does CX flip its target?",
        options: ["When the control is |1⟩", "Whenever the target is |0⟩", "Only after measurement"],
        answerIndex: 0,
        explanation: "CX is a controlled-X: the control condition activates X on the target.",
      },
      {
        id: "cx-basics-wires",
        question: "What must a CX operation record?",
        options: ["Only one target label", "A control and a target wire", "A classical shot count"],
        answerIndex: 1,
        explanation: "The two roles determine the operation's behavior and visualization.",
      },
    ],
  },
  "cz-and-swap": {
    sections: [
      {
        heading: "Two different two-wire ideas",
        body:
          "CZ changes the phase of |11⟩ while leaving the computational labels in place. SWAP exchanges the complete states of two wires.\n\nBoth gates use two targets or a control-target structure, so preserving every wire is essential when editing them.",
        quantaNote: "Similar drawings can hide very different meanings.",
      },
      {
        heading: "Try CZ and SWAP",
        body:
          "Drag CZ or SWAP from the Gate library onto q[0] and q[1]. Click the operation and inspect all targets; the Inspector should never silently drop a wire.\n\nUse H before CZ if you want phase changes to become visible through interference.",
        quantaNote: "Select the operation and count its wires.",
      },
      {
        heading: "Retarget without losing structure",
        body:
          "Move a multi-wire operation to another pair of wires and verify that the entire block shifts together. Controls and targets should remain distinct and in range.\n\nThis editing habit matters for larger circuits where one missing target changes the algorithm.",
        quantaNote: "A gate is its whole wire pattern, not just its label.",
      },
    ],
    quiz: [
      {
        id: "cz-and-swap-difference",
        question: "What does SWAP do?",
        options: ["Exchanges two qubit states", "Adds a phase only to |11⟩", "Measures both wires"],
        answerIndex: 0,
        explanation: "SWAP exchanges the states of its two target wires.",
      },
      {
        id: "cz-and-swap-phase",
        question: "What special effect does CZ have on |11⟩?",
        options: ["A wire deletion", "A phase flip", "A guaranteed measurement of 1"],
        answerIndex: 1,
        explanation: "CZ multiplies the |11⟩ amplitude by −1 while preserving basis labels.",
      },
    ],
  },
  "toffoli": {
    sections: [
      {
        heading: "Two conditions, one flip",
        body:
          "Toffoli, or CCX, has two controls and one target. It flips the target only when both controls are |1⟩.\n\nThis makes it a reversible version of a three-input AND-controlled NOT and a useful bridge between classical logic and quantum circuits.",
        quantaNote: "Two dots can jointly authorize one X.",
      },
      {
        heading: "Build CCX",
        body:
          "Use three qubit wires. Drag CCX from the Gate library and place controls on q[0] and q[1] with q[2] as target, or configure the operation in Inspector.\n\nZoom or inspect carefully: the two control dots and one target are all part of the operation.",
        quantaNote: "Count two controls before you check the target.",
      },
      {
        heading: "Check the condition",
        body:
          "On |000⟩, Toffoli leaves the state unchanged because neither control is 1. On |110⟩, it produces |111⟩.\n\nThe gate remains reversible because running CCX again undoes the same conditional flip.",
        quantaNote: "A conditional gate can be quiet on the wrong input.",
      },
    ],
    quiz: [
      {
        id: "toffoli-controls",
        question: "When does Toffoli flip its target?",
        options: ["When both controls are 1", "When either control is 0", "After every measurement"],
        answerIndex: 0,
        explanation: "CCX applies X only when both control conditions are satisfied.",
      },
      {
        id: "toffoli-wires",
        question: "How many wires does a basic Toffoli use?",
        options: ["One", "Three", "Two classical bits only"],
        answerIndex: 1,
        explanation: "Two controls plus one target require three qubit wires.",
      },
    ],
  },
  "ghz-state": {
    sections: [
      {
        heading: "From Bell to GHZ",
        body:
          "A GHZ state extends Bell-style correlation to three qubits. The common preparation is H on q0, then CX from q0 to q1 and from q1 to q2.\n\nThe ideal final state has coherent support on |000⟩ and |111⟩.",
        quantaNote: "Entanglement can be a group project.",
      },
      {
        heading: "Build the chain",
        body:
          "Use three wires. Place H in the first column, then two CX operations in later columns so the chain connects the three qubits.\n\nOpen Step through and confirm that the controlled links are separate execution layers, not one gate with a missing target.",
        quantaNote: "Connect one new wire at a time.",
      },
      {
        heading: "Read the three-bit result",
        body:
          "When all three qubits are measured in the computational basis, the ideal GHZ experiment returns matching strings 000 or 111.\n\nThose correlations come from the joint state. Looking at one qubit alone cannot tell the whole story.",
        quantaNote: "The final string is shared across all three wires.",
      },
    ],
    quiz: [
      {
        id: "ghz-state-preparation",
        question: "Which pattern prepares the standard three-qubit GHZ state?",
        options: ["H, then two linked CX gates", "Three measurements only", "One X on the last qubit"],
        answerIndex: 0,
        explanation: "H creates the branch and the two CX gates propagate the correlation.",
      },
      {
        id: "ghz-state-outcomes",
        question: "Which ideal computational outcomes dominate a GHZ state?",
        options: ["001 and 010 only", "000 and 111", "All eight equally"],
        answerIndex: 1,
        explanation: "The standard GHZ state is (|000⟩ + |111⟩)/√2.",
      },
    ],
  },
  "phase-kickback": {
    sections: [
      {
        heading: "Phase can move through control",
        body:
          "A controlled phase operation can place a relative phase on a branch of a joint state. When the control is later put through interference, that phase can affect its probabilities.\n\nThis effect is often called phase kickback because information about a controlled operation appears in another part of the circuit.",
        quantaNote: "A phase can travel through a relationship without changing a label.",
      },
      {
        heading: "Use CZ between wires",
        body:
          "Place H on a wire, then CZ across q[0] and q[1]. Select CZ to inspect its two-wire roles and step through the operation.\n\nCompare the state before and after with the phase table in the explanation card.",
        quantaNote: "The phase table is your magnifying glass.",
      },
      {
        heading: "Reveal the effect",
        body:
          "A later H can turn a phase difference into a probability difference. Without that interference step, the probability chart may look unchanged even though the state has changed.\n\nThis is why algorithms often prepare, apply a controlled oracle, and interfere before measuring.",
        quantaNote: "Interference is how the hidden angle speaks up.",
      },
    ],
    quiz: [
      {
        id: "phase-kickback-meaning",
        question: "What does phase kickback describe?",
        options: ["A controlled phase becoming observable through another wire's interference", "A classical bit being copied", "A measurement undoing a gate"],
        answerIndex: 0,
        explanation: "Controlled operations can imprint relative phase that later affects interference.",
      },
      {
        id: "phase-kickback-reveal",
        question: "What often reveals a phase difference as probability?",
        options: ["Renaming q[0]", "An interference gate such as H", "Increasing the canvas height"],
        answerIndex: 1,
        explanation: "H mixes paths so their relative phase changes measurable probabilities.",
      },
    ],
  },
  "deutsch-problem": {
    sections: [
      {
        heading: "An algorithmic question",
        body:
          "Deutsch's problem asks whether a one-bit function is constant or balanced. The algorithm uses one oracle query and interference to answer the question.\n\nThe important lesson is the pattern: prepare, query, then interfere.",
        quantaNote: "Algorithms are recipes for extracting structure.",
      },
      {
        heading: "Build the two-wire pattern",
        body:
          "Use two qubits. Prepare the wires with H gates, place a CX-style oracle, then apply the final H to the measured input wire in a later column.\n\nRead the columns left to right and inspect each gate in Step through.",
        quantaNote: "The order is the algorithm's skeleton.",
      },
      {
        heading: "Why interference helps",
        body:
          "The oracle changes phase information without simply writing down the function's answer. The final H converts that phase pattern into a basis outcome.\n\nThis is a small example of quantum algorithms using amplitudes as a workspace.",
        quantaNote: "Prepare, query, interfere—then read the answer.",
      },
    ],
    quiz: [
      {
        id: "deutsch-problem-question",
        question: "What does Deutsch's problem classify?",
        options: ["A one-bit function as constant or balanced", "A qubit as hot or cold", "A histogram as tall or short"],
        answerIndex: 0,
        explanation: "The algorithm distinguishes the two possible function patterns.",
      },
      {
        id: "deutsch-problem-pattern",
        question: "What is the key algorithmic pattern?",
        options: ["Measure before every gate", "Prepare, query, interfere", "Copy each qubit into a classical bit"],
        answerIndex: 1,
        explanation: "The circuit uses superposition and interference around one oracle call.",
      },
    ],
  },
  "teleportation-tour": {
    sections: [
      {
        heading: "Teleportation is a protocol",
        body:
          "Quantum teleportation transfers an unknown state using a shared entangled pair, two classical measurement bits, and conditional corrections. It does not move matter and it does not clone the original state.\n\nThe receiver reconstructs the state after receiving classical information.",
        quantaNote: "Science fiction name, very precise circuit.",
      },
      {
        heading: "Trace three roles",
        body:
          "Add a third qubit so the circuit has three wires: the unknown input, the entangled partner, and the receiver (the Quantum Teleportation sample in File → Samples shows the full protocol). Follow preparation, Bell interaction, measurement, and correction columns.\n\nOpen Inspector for measurements and verify their classical targets; those bits control the later correction logic.",
        quantaNote: "Give each wire a job before reading the whole protocol.",
      },
      {
        heading: "Respect the no-cloning rule",
        body:
          "The input is consumed by the measurement part of the protocol, while the receiver becomes equivalent to the original state after corrections. No second independent copy is created.\n\nUse Step through to see why both classical bits are needed.",
        quantaNote: "Teleportation transfers information without copying the state.",
      },
    ],
    quiz: [
      {
        id: "teleportation-tour-resources",
        question: "What does teleportation require besides gates?",
        options: ["Entanglement and classical communication", "A faster-than-light wire", "A duplicate input qubit"],
        answerIndex: 0,
        explanation: "The protocol uses a shared Bell pair and two classical measurement results.",
      },
      {
        id: "teleportation-tour-cloning",
        question: "Does teleportation create a copy of the original state?",
        options: ["Yes, always two copies", "No, the protocol transfers it", "Only if no measurement occurs"],
        answerIndex: 1,
        explanation: "Measurement and the no-cloning principle prevent an extra independent copy.",
      },
    ],
  },
  "grover-two-qubits": {
    sections: [
      {
        heading: "Search by amplification",
        body:
          "Grover's algorithm starts with a broad superposition, marks a target using a phase oracle, and amplifies the marked amplitude with diffusion.\n\nA two-qubit example is small enough to inspect while still showing the prepare–oracle–amplify idea.",
        quantaNote: "Search becomes useful when interference amplifies the right path.",
      },
      {
        heading: "Prepare and mark",
        body:
          "Use H gates to prepare both qubits and CZ as a simple phase-marking operation. Select CZ and inspect its phase effect rather than expecting it to swap labels.\n\nThe Results panel can show that phase changes before the final diffusion-style steps.",
        quantaNote: "Marking is often a phase operation first.",
      },
      {
        heading: "Read the toy algorithm",
        body:
          "The two-qubit circuit is an intuition builder, not a practical database search. Its value is showing how a phase oracle and interference can reshape probabilities.\n\nStep through the layers and describe which basis states gain or lose amplitude.",
        quantaNote: "Small circuits can teach big algorithmic ideas.",
      },
    ],
    quiz: [
      {
        id: "grover-two-qubits-goal",
        question: "What does Grover amplification try to increase?",
        options: ["The marked state's probability", "The number of qubit wires", "The measurement phase label"],
        answerIndex: 0,
        explanation: "The algorithm uses interference to amplify a marked answer.",
      },
      {
        id: "grover-two-qubits-oracle",
        question: "What is CZ doing in the toy oracle?",
        options: ["Measuring the database", "Marking a branch through phase", "Swapping both qubits"],
        answerIndex: 1,
        explanation: "CZ changes a joint phase that later interference can use.",
      },
    ],
  },
  "openqasm-export": {
    sections: [
      {
        heading: "A standard exchange format",
        body:
          "OpenQASM is a text language for describing quantum registers, classical registers, and operations. It is useful when another tool needs a compact circuit description.\n\nThe syntax is explicit about wires and gate order.",
        quantaNote: "A circuit can travel in more than one textual dialect.",
      },
      {
        heading: "Choose OpenQASM",
        body:
          "Open the Code panel, switch to OpenQASM, and inspect the generated header and operation lines. Compare q[0] in the canvas with the index in the text.\n\nUse the export action only after checking that the language can represent your circuit.",
        quantaNote: "Read the register declaration before the gates.",
      },
      {
        heading: "Export with confidence",
        body:
          "A successful export should preserve the gates, order, and measurement mappings. If a warning appears, treat it as a prompt to inspect the generated text.\n\nThis workflow is the same discipline used in larger code-generation systems.",
        quantaNote: "Export is a translation you can audit.",
      },
    ],
    quiz: [
      {
        id: "openqasm-export-purpose",
        question: "What is OpenQASM useful for?",
        options: ["Exchanging circuit descriptions as text", "Replacing every probability with a word", "Adding screen animations"],
        answerIndex: 0,
        explanation: "OpenQASM gives tools a structured textual circuit format.",
      },
      {
        id: "openqasm-export-check",
        question: "What should you inspect after export?",
        options: ["Only the file color", "Register names, order, and mappings", "The browser's zoom level"],
        answerIndex: 1,
        explanation: "Those details determine whether the text still describes the circuit.",
      },
    ],
  },
  "bind-parameters": {
    sections: [
      {
        heading: "Symbols keep circuits reusable",
        body:
          "A parameter such as theta lets one circuit describe a family of experiments. RX(theta) has a clear structure even before theta receives a number.\n\nKeeping the symbol visible is useful for code generation and later parameter sweeps.",
        quantaNote: "A symbol is an honest promise to choose a value later.",
      },
      {
        heading: "Bind before simulating",
        body:
          "Place RX on q[0] and enter a numeric value for theta in the Inspector or code panel. The simulator should refuse an unbound symbol rather than silently treating it as zero.\n\nRead any warning badge and bind the parameter explicitly.",
        quantaNote: "No silent zeroes—Quanta likes honest experiments.",
      },
      {
        heading: "Compare two bindings",
        body:
          "Run the same circuit with θ = π/2 and another value. Compare Results → Probabilities and note that the circuit's shape did not change.\n\nThe parameter is part of the operation data, so export and import should preserve its meaning too.",
        quantaNote: "Change the value, not the experiment's identity.",
      },
    ],
    quiz: [
      {
        id: "bind-parameters-purpose",
        question: "Why use a symbolic theta?",
        options: ["To reuse one circuit with different angles", "To add a hidden qubit", "To force every angle to zero"],
        answerIndex: 0,
        explanation: "Symbols separate circuit structure from a particular numeric experiment.",
      },
      {
        id: "bind-parameters-simulate",
        question: "What should happen to RX(theta) before binding theta?",
        options: ["It should silently use zero", "Simulation should report it is unbound", "It should delete RX"],
        answerIndex: 1,
        explanation: "Refusing incomplete numeric input prevents misleading simulation results.",
      },
    ],
  },
  "capstone-bell-experiment": {
    sections: [
      {
        heading: "Plan the experiment",
        body:
          "The capstone combines preparation, entanglement, and measurement. Start with two |0⟩ qubits, apply H to q[0], and use CX to correlate q[1].\n\nThen measure q[0] into c[0] and q[1] into c[1] so both classical outcomes are recorded.",
        quantaNote: "You have all the pieces—now make them tell one story.",
      },
      {
        heading: "Inspect every layer",
        body:
          "Build the operations in separate columns and use Step through to inspect H, CX, and the measurement layer. Open Results → Probabilities before running shots.\n\nCheck the Inspector mappings carefully: a measurement without the right classical target is not the same experiment.",
        quantaNote: "Slow inspection is a superpower in a capstone.",
      },
      {
        heading: "Run and explain",
        body:
          "The ideal Bell experiment produces matching classical strings 00 and 11. Finite shots fluctuate, but mismatched outcomes should be strongly suppressed in the ideal noiseless simulation.\n\nWrite or say why H creates branches, CX correlates them, and measurement turns the joint state into classical data.",
        quantaNote: "Explain the circuit in your own words before celebrating.",
      },
    ],
    quiz: [
      {
        id: "capstone-bell-order",
        question: "What is the capstone's core operation order?",
        options: ["H, CX, then two measurements", "Two measurements, then H", "Only two X gates"],
        answerIndex: 0,
        explanation: "The experiment prepares, entangles, and finally records both qubits.",
      },
      {
        id: "capstone-bell-outcomes",
        question: "Which ideal classical strings should dominate?",
        options: ["01 and 10 only", "00 and 11", "All strings equally"],
        answerIndex: 1,
        explanation: "The Bell preparation correlates the two measurement results.",
      },
    ],
  },
  "qml-encode-data": {
    sections: [
      {
        heading: "From features to angles",
        body:
          "A classical dataset is a table of numbers. To feed it to a quantum circuit we map each number x to a rotation, most simply RY(x) on its own qubit. This is called angle encoding — quantum-learn's default `AngleEmbedding` does exactly this, one feature per qubit.\n\nTry it: the diagram shows RY(0.8) on a single qubit. Scrub the steps and watch the probability of |1⟩ rise from 0.",
        circuit: lessonCircuit("QML angle encoding", 1, 0, [
          op("qml-encode-ry", "ry", ["q0"], 0, [], [], numericParameter(0.8)),
        ]),
        quantaNote: "0.8 in, a tilted qubit out. Different data → different tilt.",
      },
      {
        heading: "Why the angle matters",
        body:
          "RY(x) rotates the qubit from |0⟩ toward |1⟩; the probability of measuring 1 is sin²(x/2). Small features barely move the qubit, features near π flip it. That non-linear response is the first ingredient of a quantum model.\n\nTwo features need two qubits: RY(x₀) on q0 and RY(x₁) on q1.",
        circuit: lessonCircuit("QML two features", 2, 0, [
          op("qml-feature0", "ry", ["q0"], 0, [], [], numericParameter(0.8)),
          op("qml-feature1", "ry", ["q1"], 0, [], [], numericParameter(2.4)),
        ]),
        quantaNote: "sin²(x/2) is your first activation function.",
      },
      {
        heading: "Encoding in quantum-learn",
        body:
          "In KUQCI's quantum-learn, `QuantumFeatureMap.transform(features)` runs an encoding circuit for every row of a dataset and returns the resulting quantum features. The default map is angle encoding, but any circuit you build here can be exported as one.\n\nOpen the Code panel's quantum-learn tab to see your circuit as a PennyLane function.",
        quantaNote: "Export → quantum-learn tab whenever you want the Python behind a lesson.",
      },
    ],
    quiz: [
      {
        id: "qml-encode-data-what",
        question: "In angle encoding, where does a data value end up?",
        options: ["As the label of a qubit", "As the rotation angle of a gate", "As the number of shots"],
        answerIndex: 1,
        explanation: "Each feature becomes the angle of a rotation gate such as RY(x).",
      },
      {
        id: "qml-encode-data-prob",
        question: "After RY(x) on |0⟩, the probability of measuring 1 is…",
        options: ["sin²(x/2)", "x", "always 0.5"],
        answerIndex: 0,
        explanation: "RY(x) tilts the qubit; P(1) = sin²(x/2), so 0 stays 0 and π gives 1.",
      },
    ],
  },
  "qml-parameterised-ansatz": {
    sections: [
      {
        heading: "Data vs. parameters",
        body:
          "The encoding layer holds data. The next layer holds parameters: angles the training loop is free to change. In the visualizer you make an angle symbolic by typing a name such as θ or theta instead of a number.\n\nThe diagram adds RY(θ₀) and RY(θ₁) after the encoding rotations.",
        circuit: lessonCircuit("QML parameter layer", 2, 0, [
          op("ans-enc0", "ry", ["q0"], 0, [], [], numericParameter(0.8)),
          op("ans-enc1", "ry", ["q1"], 0, [], [], numericParameter(2.4)),
          op("ans-theta0", "ry", ["q0"], 1, [], [], symbolicParameter("theta0")),
          op("ans-theta1", "ry", ["q1"], 1, [], [], symbolicParameter("theta1")),
        ]),
        quantaNote: "Symbols stay symbols in the exported code — they become params[i].",
      },
      {
        heading: "Entangle to mix features",
        body:
          "Rotations alone keep each qubit independent. A CX between the qubits lets the model combine features — the quantum analogue of a hidden layer connecting inputs.\n\nA common pattern is: encode → rotate(θ) → entangle → rotate(θ) again. Each repetition is a layer.",
        circuit: lessonCircuit("QML entangled ansatz", 2, 0, [
          op("ans-enc0", "ry", ["q0"], 0, [], [], numericParameter(0.8)),
          op("ans-enc1", "ry", ["q1"], 0, [], [], numericParameter(2.4)),
          op("ans-theta0", "ry", ["q0"], 1, [], [], symbolicParameter("theta0")),
          op("ans-theta1", "ry", ["q1"], 1, [], [], symbolicParameter("theta1")),
          op("ans-cx", "cx", ["q1"], 2, ["q0"]),
          op("ans-theta2", "ry", ["q0"], 3, [], [], symbolicParameter("theta2")),
          op("ans-theta3", "ry", ["q1"], 3, [], [], symbolicParameter("theta3")),
        ]),
        quantaNote: "No CX, no interaction. Entanglement is what makes it more than two separate models.",
      },
      {
        heading: "What quantum-learn does with it",
        body:
          "quantum-learn's `VariationalQuantumCircuit.fit(features, labels, ansatz=...)` calls your ansatz for every data row, measures the output, compares it with the label, and nudges every θ with gradient descent. Your job is the circuit shape; the library does the tuning.\n\nExport this lesson's circuit from the quantum-learn tab and look for `PARAM_NAMES`.",
        quantaNote: "Training is just: run, compare, nudge θ, repeat.",
      },
    ],
    quiz: [
      {
        id: "qml-ansatz-symbol",
        question: "What makes an angle trainable in the visualizer?",
        options: ["Setting it to π", "Giving it a symbolic name like theta", "Adding a measurement after it"],
        answerIndex: 1,
        explanation: "Symbolic parameters are exported as params[i] and tuned by the optimiser.",
      },
      {
        id: "qml-ansatz-cx",
        question: "Why include CX gates in an ansatz?",
        options: ["To reset the qubits", "So the model can combine information from different qubits", "To speed up simulation"],
        answerIndex: 1,
        explanation: "Without entangling gates each qubit stays an independent one-feature model.",
      },
    ],
  },
  "qml-measure-prediction": {
    sections: [
      {
        heading: "Expectation values as outputs",
        body:
          "Run the circuit many times and count. The fraction of 1s on a qubit is an estimate of its probability, and quantum-learn's `measurement=\"probabilities\"` returns exactly these numbers for every basis state.\n\nFor a two-class problem a simple rule is: predict class 1 when P(1) on q0 is at least 0.5.",
        circuit: lessonCircuit("QML prediction readout", 2, 2, [
          op("pred-enc0", "ry", ["q0"], 0, [], [], numericParameter(0.8)),
          op("pred-enc1", "ry", ["q1"], 0, [], [], numericParameter(2.4)),
          op("pred-theta0", "ry", ["q0"], 1, [], [], symbolicParameter("theta0")),
          op("pred-theta1", "ry", ["q1"], 1, [], [], symbolicParameter("theta1")),
          op("pred-cx", "cx", ["q1"], 2, ["q0"]),
          op("pred-measure", "measure", ["q0"], 3, [], ["c0"]),
        ]),
        quantaNote: "Shots are how a quantum model speaks.",
      },
      {
        heading: "Loss: how wrong were we?",
        body:
          "Training compares the predicted probabilities with the true label using a loss such as cross-entropy. Lower loss means the histogram leans toward the right answer. Gradient descent then moves every θ a little in the direction that lowers the loss.\n\nThis is the same loop as classical neural networks — only the model is a circuit.",
        quantaNote: "Cross-entropy punishes confident wrong answers the most.",
      },
      {
        heading: "Noise changes the answer",
        body:
          "You saw in Why Hardware Disagrees that noise leaks probability into other outcomes. For a classifier that means predictions near the 0.5 boundary can flip on hardware. Try this circuit with the Realistic noise preset and compare P(1).\n\nRobust QML models keep decisions away from the boundary.",
        quantaNote: "Confident models survive noise better than borderline ones.",
      },
    ],
    quiz: [
      {
        id: "qml-measure-rule",
        question: "With the rule 'class 1 if P(1) ≥ 0.5', a run giving 620 ones out of 1000 shots predicts…",
        options: ["Class 0", "Class 1", "Undefined"],
        answerIndex: 1,
        explanation: "P(1) ≈ 0.62 ≥ 0.5, so the model predicts class 1.",
      },
      {
        id: "qml-measure-loss",
        question: "What does the loss function measure?",
        options: ["How long the circuit is", "How far the predicted probabilities are from the true labels", "How many qubits are used"],
        answerIndex: 1,
        explanation: "Loss quantifies prediction error; training lowers it by adjusting θ.",
      },
    ],
  },
  "qml-training-loop": {
    sections: [
      {
        heading: "One knob, one target",
        body:
          "Suppose the label says P(1) should be 0.9. Our model is RY(θ) followed by a measurement, so P(1) = sin²(θ/2). At θ = 0.3, P(1) ≈ 0.02 — far too low. The loss is large.\n\nScrub the diagram to see the state after RY(0.3).",
        circuit: lessonCircuit("QML training start", 1, 1, [
          op("train-ry", "ry", ["q0"], 0, [], [], numericParameter(0.3)),
          op("train-measure", "measure", ["q0"], 1, [], ["c0"]),
        ]),
        quantaNote: "The loss tells you how far; the gradient tells you which way.",
      },
      {
        heading: "Follow the gradient",
        body:
          "Increasing θ raises P(1), so the gradient points toward larger θ. A step to θ = 1.0 gives P(1) ≈ 0.23; θ = 2.0 gives ≈ 0.71; θ ≈ 2.5 gives ≈ 0.90. Each step lowers the loss until it stops improving.\n\nquantum-learn does this with PennyLane's automatic differentiation over all parameters at once.",
        circuit: lessonCircuit("QML training target", 1, 1, [
          op("train-ry", "ry", ["q0"], 0, [], [], numericParameter(2.5)),
          op("train-measure", "measure", ["q0"], 1, [], ["c0"]),
        ]),
        quantaNote: "Autodiff means nobody types these derivatives by hand.",
      },
      {
        heading: "Epochs, batches, and stopping",
        body:
          "Real training repeats the step for every sample (a batch) and over the whole dataset several times (epochs). `fit(features, labels, epochs=..., batch_size=...)` exposes both. Too few epochs under-fit; too many waste hardware time and can over-fit.\n\nBind θ in the inspector and check Results to reproduce the numbers above.",
        quantaNote: "Stop when the loss flattens — not when you run out of patience.",
      },
    ],
    quiz: [
      {
        id: "qml-train-direction",
        question: "P(1) is 0.02 but the target is 0.9. For RY(θ) starting at θ = 0.3, training should…",
        options: ["Decrease θ", "Increase θ", "Leave θ unchanged"],
        answerIndex: 1,
        explanation: "P(1) = sin²(θ/2) grows with θ up to π, so the gradient step increases θ.",
      },
      {
        id: "qml-train-epoch",
        question: "What is an epoch?",
        options: ["One gate in the ansatz", "One pass over the whole training dataset", "One measurement shot"],
        answerIndex: 1,
        explanation: "An epoch is a full pass over the data; batches split it into smaller update steps.",
      },
    ],
  },
  "qml-capstone-classifier": {
    sections: [
      {
        heading: "The full recipe",
        body:
          "Encoding: RY(x₀) on q0, RY(x₁) on q1. Ansatz: RY(θ₀), RY(θ₁), then CX q0→q1, then RY(θ₂) on q0. Readout: measure q0.\n\nThe diagram shows the complete circuit; the state preview shows how the θ layer and CX reshape the probabilities.",
        circuit: lessonCircuit("QML classifier target", 2, 2, [
          op("cap-enc0", "ry", ["q0"], 0, [], [], numericParameter(0.8)),
          op("cap-enc1", "ry", ["q1"], 0, [], [], numericParameter(2.4)),
          op("cap-theta0", "ry", ["q0"], 1, [], [], symbolicParameter("theta0")),
          op("cap-theta1", "ry", ["q1"], 1, [], [], symbolicParameter("theta1")),
          op("cap-cx", "cx", ["q1"], 2, ["q0"]),
          op("cap-theta2", "ry", ["q0"], 3, [], [], symbolicParameter("theta2")),
          op("cap-measure", "measure", ["q0"], 4, [], ["c0"]),
        ]),
        quantaNote: "Four kinds of gate, one model.",
      },
      {
        heading: "Export and train",
        body:
          "Open the Code panel, choose quantum-learn, and copy the code. It defines `ansatz(features, params, n_qubits)` with `PARAM_NAMES = [\"theta0\", \"theta1\", \"theta2\"]` and a `VariationalQuantumClassifier` ready for `fit`. Install with `pip install \"quantum-learn[pennylane]\"`, pass a pandas DataFrame of two features and a Series of 0/1 labels, and train.\n\nThe encoding RY gates in the export become the library's AngleEmbedding — same idea, one line.",
        quantaNote: "From canvas to trained model in one copy-paste.",
      },
      {
        heading: "Where to go next",
        body:
          "quantum-learn also offers `VariationalQuantumRegressor` for continuous targets, `HybridClassification` that feeds quantum features into a classical scikit-learn model, and Hugging Face Hub saving with `push_to_hub`. Read the docs at quantum-learn.readthedocs.io and try the Iris dataset.\n\nEverything you built in the Academy — superposition, entanglement, measurement, noise — is what makes these models tick.",
        quantaNote: "You started with a blank wire. Now you train quantum models. Go build something.",
      },
    ],
    quiz: [
      {
        id: "qml-capstone-order",
        question: "Which order describes a variational classifier?",
        options: ["Measure → encode → rotate", "Encode → trainable rotations + CX → measure", "CX → measure → encode"],
        answerIndex: 1,
        explanation: "Data goes in first, the trainable ansatz reshapes it, and measurement reads the answer.",
      },
      {
        id: "qml-capstone-export",
        question: "In the quantum-learn export, symbolic angles appear as…",
        options: ["Entries of params listed in PARAM_NAMES", "Fixed numbers", "Extra qubits"],
        answerIndex: 0,
        explanation: "Each symbol becomes params[i]; PARAM_NAMES records the order.",
      },
    ],
  },
};

export const LESSONS: LessonDefinition[] = [...BASE_LESSONS, ...EXTRA_LESSONS].map((lesson) => ({
  ...lesson,
  ...LESSON_CONTENT[lesson.id],
  sections: LESSON_CONTENT[lesson.id].sections.map((section, index) =>
    index === 1 && !section.circuit
      ? { ...section, circuit: lesson.starterCircuit }
      : section
  ),
}));

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
