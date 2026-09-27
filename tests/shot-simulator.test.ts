import { afterEach, describe, it, expect, vi } from "vitest";
import { runCircuitShots } from "@/lib/shot-simulator";
import {
  bellStateCircuit,
  simpleSuperpositionCircuit,
} from "@/lib/sample-circuits";
import { createEmptyCircuit } from "@/lib/circuit-schema";
import type { Circuit } from "@/lib/circuit-schema";
import { IDEAL_NOISE } from "@/lib/noise-model";

afterEach(() => {
  vi.restoreAllMocks();
});

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

  it("prints classical bits from highest to lowest index", () => {
    const circuit = createEmptyCircuit("Measure q0", 2, 2);
    circuit.operations.push(
      { id: "x0", type: "x", label: "X", targets: ["q0"], controls: [], classicalTargets: [], column: 0 },
      { id: "m0", type: "measure", label: "M", targets: ["q0"], controls: [], classicalTargets: ["c0"], column: 1 }
    );
    expect(runCircuitShots(circuit, 1).counts).toEqual({ "01": 1 });
  });

  it("keeps an ideal Bell measurement at 00 or 11", () => {
    const result = runCircuitShots(bellWithMeasure(), 4096, "local-sampler", IDEAL_NOISE);
    expect(result.counts["01"] ?? 0).toBe(0);
    expect(result.counts["10"] ?? 0).toBe(0);
  });

  it("adds readout noise to a Bell measurement", () => {
    let seed = 0x12345678;
    vi.spyOn(Math, "random").mockImplementation(() => {
      seed = (1664525 * seed + 1013904223) >>> 0;
      return seed / 0x100000000;
    });
    const result = runCircuitShots(bellWithMeasure(), 4096, "local-sampler", {
      enabled: true,
      depolarizing1q: 0,
      depolarizing2q: 0,
      readoutError: 0.2,
    });
    const mismatched = (result.counts["01"] ?? 0) + (result.counts["10"] ?? 0);
    expect(mismatched / 4096).toBeGreaterThan(0.15);
    expect(mismatched / 4096).toBeLessThan(0.5);
  });

  it("does not depolarize a circuit with no gates", () => {
    const circuit = createEmptyCircuit("Empty measurement", 1, 1);
    circuit.operations.push({
      id: "measure",
      type: "measure",
      label: "M",
      targets: ["q0"],
      controls: [],
      classicalTargets: ["c0"],
      column: 0,
    });
    const result = runCircuitShots(circuit, 4096, "local-sampler", {
      enabled: true,
      depolarizing1q: 1,
      depolarizing2q: 1,
      readoutError: 0,
    });
    expect(result.counts).toEqual({ "0": 4096 });
  });

  it("treats disabled noise as ideal", () => {
    let seed = 0xabcdef01;
    const random = () => {
      seed = (1664525 * seed + 1013904223) >>> 0;
      return seed / 0x100000000;
    };
    vi.spyOn(Math, "random").mockImplementation(random);
    const ideal = runCircuitShots(bellWithMeasure(), 512);
    seed = 0xabcdef01;
    const disabled = runCircuitShots(bellWithMeasure(), 512, "local-sampler", {
      enabled: false,
      depolarizing1q: 0.2,
      depolarizing2q: 0.2,
      readoutError: 0.2,
    });
    expect(disabled.counts).toEqual(ideal.counts);
    expect(disabled.histogram).toEqual(ideal.histogram);
  });
});
