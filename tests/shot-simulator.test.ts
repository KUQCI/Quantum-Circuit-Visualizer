import { describe, it, expect } from "vitest";
import { runCircuitShots } from "@/lib/shot-simulator";
import {
  bellStateCircuit,
  simpleSuperpositionCircuit,
} from "@/lib/sample-circuits";
import { createEmptyCircuit } from "@/lib/circuit-schema";
import type { Circuit } from "@/lib/circuit-schema";

function bellWithMeasure(): Circuit {
  return {
    ...bellStateCircuit,
    classicalBits: [{ id: "c0", label: "c[0]" }, { id: "c1", label: "c[1]" }],
    operations: [
      ...bellStateCircuit.operations,
      {
        id: "op_bell_m0",
        type: "measure",
        label: "M",
        targets: ["q0"],
        controls: [],
        classicalTargets: ["c0"],
        column: 2,
      },
      {
        id: "op_bell_m1",
        type: "measure",
        label: "M",
        targets: ["q1"],
        controls: [],
        classicalTargets: ["c1"],
        column: 3,
      },
    ],
  };
}

describe("Shot simulator", () => {
  it("returns error for empty qubit register", () => {
    const circuit = createEmptyCircuit("Empty", 0);
    const result = runCircuitShots(circuit, 100);
    expect(result.error).toContain("no qubits");
  });

  it("returns error for circuits exceeding qubit limit", () => {
    const circuit = createEmptyCircuit("Big", 8);
    const result = runCircuitShots(circuit, 100);
    expect(result.error).toContain("6 qubits");
  });

  it("samples H gate roughly 50/50 on computational basis", () => {
    const result = runCircuitShots(simpleSuperpositionCircuit, 4096);
    expect(result.error).toBeNull();
    expect(result.histogram.length).toBe(2);

    const p0 = result.histogram.find((h) => h.label === "0")?.probability ?? 0;
    const p1 = result.histogram.find((h) => h.label === "1")?.probability ?? 0;
    expect(p0).toBeGreaterThan(0.4);
    expect(p0).toBeLessThan(0.6);
    expect(p1).toBeGreaterThan(0.4);
    expect(p1).toBeLessThan(0.6);
    expect(p0 + p1).toBeCloseTo(1);
  });

  it("measures Bell state as 00 or 11 only", () => {
    const result = runCircuitShots(bellWithMeasure(), 2048);
    expect(result.error).toBeNull();
    expect(result.histogram.every((h) => h.label === "00" || h.label === "11")).toBe(
      true
    );

    const p00 = result.histogram.find((h) => h.label === "00")?.probability ?? 0;
    const p11 = result.histogram.find((h) => h.label === "11")?.probability ?? 0;
    expect(p00).toBeGreaterThan(0.35);
    expect(p11).toBeGreaterThan(0.35);
    expect(p00 + p11).toBeCloseTo(1);
  });

  it("uses classical register labels when measurements are present", () => {
    const result = runCircuitShots(bellWithMeasure(), 128);
    expect(result.registerLabel).toContain("c[");
  });

  it("aggregates counts to match shot total", () => {
    const shots = 512;
    const result = runCircuitShots(simpleSuperpositionCircuit, shots);
    const total = result.histogram.reduce((sum, h) => sum + h.count, 0);
    expect(total).toBe(shots);
  });
});
