import { describe, it, expect } from "vitest";
import { generateQiskitCode, getCircuitSummary } from "@/lib/qiskit-generator";
import { parseQiskitCode, circuitToQasm } from "@/lib/qiskit-parser";
import {
  bellStateCircuit,
  simpleSuperpositionCircuit,
  quantumTeleportationCircuit,
} from "@/lib/sample-circuits";

describe("Generator", () => {
  it("generates valid Python for superposition circuit", () => {
    const result = generateQiskitCode(simpleSuperpositionCircuit);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.code).toMatch(/qc\.h\(0\)/);
  });

  it("generates measure gates for teleportation circuit", () => {
    const result = generateQiskitCode(quantumTeleportationCircuit);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.code).toContain("qc.measure(");
  });

  it("provides accurate circuit summary", () => {
    const summary = getCircuitSummary(quantumTeleportationCircuit);
    expect(summary.qubits).toBe(3);
    expect(summary.classicalBits).toBe(2);
    expect(summary.measurements).toBe(2);
    expect(summary.depth).toBeGreaterThan(0);
  });

  it("generates QASM from circuit JSON", () => {
    const qasm = circuitToQasm(bellStateCircuit);
    expect(qasm).toContain("OPENQASM 2.0");
    expect(qasm).toContain("h q[0]");
    expect(qasm).toContain("cx q[0],q[1]");
  });

  it("round-trips through QASM-compatible structure", () => {
    const code = generateQiskitCode(bellStateCircuit);
    expect(code.success).toBe(true);
    if (!code.success) return;

    const reparsed = parseQiskitCode(code.code);
    expect(reparsed.success).toBe(true);
    if (!reparsed.success) return;

    expect(reparsed.circuit.operations.map((o) => o.type)).toEqual(["h", "cx"]);
  });
});
