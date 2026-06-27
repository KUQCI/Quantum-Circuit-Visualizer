import { describe, it, expect } from "vitest";
import { simulateCircuit } from "@/lib/quantum-state";
import {
  bellStateCircuit,
  ghzStateCircuit,
  simpleSuperpositionCircuit,
} from "@/lib/sample-circuits";
import { createEmptyCircuit } from "@/lib/circuit-schema";

describe("Quantum State Simulation", () => {
  it("returns |0⟩ for empty circuit", () => {
    const circuit = createEmptyCircuit("Empty", 1);
    const result = simulateCircuit(circuit);
    expect(result.error).toBeNull();
    expect(result.probabilities[0].probability).toBeCloseTo(1);
    expect(result.probabilities[0].label).toBe("|0⟩");
  });

  it("simulates simple superposition (50/50)", () => {
    const result = simulateCircuit(simpleSuperpositionCircuit);
    expect(result.error).toBeNull();
    expect(result.probabilities[0].probability).toBeCloseTo(0.5);
    expect(result.probabilities[1].probability).toBeCloseTo(0.5);
  });

  it("simulates Bell state (|00⟩ and |11⟩)", () => {
    const result = simulateCircuit(bellStateCircuit);
    expect(result.error).toBeNull();
    expect(result.probabilities[0].probability).toBeCloseTo(0.5);
    expect(result.probabilities[1].probability).toBeCloseTo(0);
    expect(result.probabilities[2].probability).toBeCloseTo(0);
    expect(result.probabilities[3].probability).toBeCloseTo(0.5);
  });

  it("simulates GHZ state", () => {
    const result = simulateCircuit(ghzStateCircuit);
    expect(result.error).toBeNull();
    const p000 = result.probabilities.find((p) => p.label === "|000⟩");
    const p111 = result.probabilities.find((p) => p.label === "|111⟩");
    expect(p000?.probability).toBeCloseTo(0.5);
    expect(p111?.probability).toBeCloseTo(0.5);
  });

  it("provides Q-sphere points for entangled states", () => {
    const result = simulateCircuit(bellStateCircuit);
    expect(result.qSpherePoints.length).toBeGreaterThan(0);
    const totalProb = result.qSpherePoints.reduce(
      (sum, p) => sum + p.probability,
      0
    );
    expect(totalProb).toBeCloseTo(1);
  });

  it("computes Bloch vector for single qubit", () => {
    const result = simulateCircuit(simpleSuperpositionCircuit);
    expect(result.blochVector).not.toBeNull();
    expect(result.blochVector!.x).toBeCloseTo(1);
    expect(result.blochVector!.z).toBeCloseTo(0);
  });

  it("rejects circuits with too many qubits", () => {
    const circuit = createEmptyCircuit("Big", 8);
    const result = simulateCircuit(circuit);
    expect(result.error).toContain("6 qubits");
  });
});
