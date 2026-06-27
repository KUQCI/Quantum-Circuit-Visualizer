import { describe, it, expect } from "vitest";
import {
  simulateCircuit,
  indexToQSphereCoords,
  nChooseK,
  bitStringIndex,
} from "@/lib/quantum-state";
import {
  bellStateCircuit,
  ghzStateCircuit,
  simpleSuperpositionCircuit,
} from "@/lib/sample-circuits";
import { createEmptyCircuit } from "@/lib/circuit-schema";
import type { Circuit } from "@/lib/circuit-schema";

function probSum(result: ReturnType<typeof simulateCircuit>) {
  return result.probabilities.reduce((s, p) => s + p.probability, 0);
}

describe("Quantum State Simulation", () => {
  it("returns |0⟩ for empty circuit", () => {
    const circuit = createEmptyCircuit("Empty", 1);
    const result = simulateCircuit(circuit);
    expect(result.error).toBeNull();
    expect(result.probabilities[0].probability).toBeCloseTo(1);
    expect(result.probabilities[0].label).toBe("|0⟩");
    expect(probSum(result)).toBeCloseTo(1);
  });

  it("simulates simple superposition (50/50)", () => {
    const result = simulateCircuit(simpleSuperpositionCircuit);
    expect(result.error).toBeNull();
    expect(result.probabilities[0].probability).toBeCloseTo(0.5);
    expect(result.probabilities[1].probability).toBeCloseTo(0.5);
    expect(probSum(result)).toBeCloseTo(1);
  });

  it("simulates Bell state (|00⟩ and |11⟩)", () => {
    const result = simulateCircuit(bellStateCircuit);
    expect(result.error).toBeNull();
    expect(result.probabilities[0].probability).toBeCloseTo(0.5);
    expect(result.probabilities[1].probability).toBeCloseTo(0);
    expect(result.probabilities[2].probability).toBeCloseTo(0);
    expect(result.probabilities[3].probability).toBeCloseTo(0.5);
    expect(probSum(result)).toBeCloseTo(1);
  });

  it("simulates GHZ state", () => {
    const result = simulateCircuit(ghzStateCircuit);
    expect(result.error).toBeNull();
    const p000 = result.probabilities.find((p) => p.label === "|000⟩");
    const p111 = result.probabilities.find((p) => p.label === "|111⟩");
    expect(p000?.probability).toBeCloseTo(0.5);
    expect(p111?.probability).toBeCloseTo(0.5);
    expect(probSum(result)).toBeCloseTo(1);
  });

  it("provides Q-sphere points for entangled states", () => {
    const result = simulateCircuit(bellStateCircuit);
    expect(result.qSpherePoints.length).toBe(2);
    const totalProb = result.qSpherePoints.reduce(
      (sum, p) => sum + p.probability,
      0
    );
    expect(totalProb).toBeCloseTo(1);
  });

  it("computes Bloch vector for single qubit |+⟩", () => {
    const result = simulateCircuit(simpleSuperpositionCircuit);
    expect(result.blochVector).not.toBeNull();
    expect(result.blochVector!.x).toBeCloseTo(1);
    expect(result.blochVector!.y).toBeCloseTo(0);
    expect(result.blochVector!.z).toBeCloseTo(0);
  });

  it("rejects circuits with too many qubits", () => {
    const circuit = createEmptyCircuit("Big", 8);
    const result = simulateCircuit(circuit);
    expect(result.error).toContain("6 qubits");
  });

  it("simulates Z gate phase on |+⟩", () => {
    const circuit: Circuit = {
      name: "H then Z",
      qubits: [{ id: "q0", label: "q[0]" }],
      classicalBits: [],
      operations: [
        {
          id: "h1",
          type: "h",
          label: "H",
          targets: ["q0"],
          controls: [],
          classicalTargets: [],
          column: 0,
        },
        {
          id: "z1",
          type: "z",
          label: "Z",
          targets: ["q0"],
          controls: [],
          classicalTargets: [],
          column: 1,
        },
      ],
    };
    const result = simulateCircuit(circuit);
    expect(result.error).toBeNull();
    expect(result.probabilities[0].probability).toBeCloseTo(0.5);
    expect(result.probabilities[1].probability).toBeCloseTo(0.5);
    // |+⟩ after Z → |−⟩ : phase of |1⟩ amplitude is π
    expect(result.amplitudes[1].re).toBeCloseTo(-0.707, 2);
  });

  it("simulates SX gate as sqrt(X)", () => {
    const circuit: Circuit = {
      name: "SX",
      qubits: [{ id: "q0", label: "q[0]" }],
      classicalBits: [],
      operations: [
        {
          id: "sx1",
          type: "sx",
          label: "SX",
          targets: ["q0"],
          controls: [],
          classicalTargets: [],
          column: 0,
        },
        {
          id: "sx2",
          type: "sx",
          label: "SX",
          targets: ["q0"],
          controls: [],
          classicalTargets: [],
          column: 1,
        },
      ],
    };
    const result = simulateCircuit(circuit);
    expect(result.error).toBeNull();
    // SX² = X, so |0⟩ → |1⟩
    expect(result.probabilities[0].probability).toBeCloseTo(0);
    expect(result.probabilities[1].probability).toBeCloseTo(1);
  });

  it("simulates CCX (Toffoli) gate", () => {
    const circuit: Circuit = {
      name: "CCX",
      qubits: [
        { id: "q0", label: "q[0]" },
        { id: "q1", label: "q[1]" },
        { id: "q2", label: "q[2]" },
      ],
      classicalBits: [],
      operations: [
        { id: "x0", type: "x", label: "X", targets: ["q0"], controls: [], classicalTargets: [], column: 0 },
        { id: "x1", type: "x", label: "X", targets: ["q1"], controls: [], classicalTargets: [], column: 1 },
        { id: "ccx", type: "ccx", label: "CCX", targets: ["q2"], controls: ["q0", "q1"], classicalTargets: [], column: 2 },
      ],
    };
    const result = simulateCircuit(circuit);
    expect(result.error).toBeNull();
    const p111 = result.probabilities.find((p) => p.label === "|111⟩");
    expect(p111?.probability).toBeCloseTo(1);
  });
});

describe("Q-sphere coordinate mapping (Qiskit algorithm)", () => {
  it("places |00⟩ at north pole for 2 qubits", () => {
    const coords = indexToQSphereCoords(0, 2);
    expect(coords.z).toBeCloseTo(1);
    expect(coords.x).toBeCloseTo(0);
    expect(coords.y).toBeCloseTo(0);
  });

  it("places |11⟩ at south pole for 2 qubits", () => {
    const coords = indexToQSphereCoords(3, 2);
    expect(coords.z).toBeCloseTo(-1);
  });

  it("places |01⟩ and |10⟩ on the same latitude for 2 qubits", () => {
    const c01 = indexToQSphereCoords(1, 2);
    const c10 = indexToQSphereCoords(2, 2);
    expect(c01.z).toBeCloseTo(c10.z);
    expect(c01.z).toBeCloseTo(0);
  });

  it("computes binomial coefficients", () => {
    expect(nChooseK(3, 1)).toBe(3);
    expect(nChooseK(3, 2)).toBe(3);
    expect(nChooseK(4, 2)).toBe(6);
  });

  it("indexes bit strings by Hamming weight order", () => {
    expect(bitStringIndex("001")).toBe(0);
    expect(bitStringIndex("010")).toBe(1);
    expect(bitStringIndex("100")).toBe(2);
  });

  it("Bell state Q-sphere points at north and south poles", () => {
    const result = simulateCircuit(bellStateCircuit);
    const p00 = result.qSpherePoints.find((p) => p.label === "00");
    const p11 = result.qSpherePoints.find((p) => p.label === "11");
    expect(p00?.z).toBeCloseTo(1);
    expect(p11?.z).toBeCloseTo(-1);
    expect(p00?.probability).toBeCloseTo(0.5);
    expect(p11?.probability).toBeCloseTo(0.5);
  });
});
