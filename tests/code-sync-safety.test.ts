import { describe, expect, it } from "vitest";
import { decideCodeSync } from "@/lib/code-sync-policy";
import { createEmptyCircuit } from "@/lib/circuit-schema";
import { generateOpenQasm } from "@/lib/openqasm-generator";
import { generateQiskitCode } from "@/lib/qiskit-generator";
import { parseOpenQasm } from "@/lib/openqasm-parser";
import { parseQiskitCode } from "@/lib/qiskit-parser";
import { simulateCircuit } from "@/lib/quantum-state";
import { runCircuitShots } from "@/lib/shot-simulator";
import type { CodeParseResult } from "@/lib/code-adapters";

const validate = (circuit: ReturnType<typeof createEmptyCircuit>) => ({
  valid: true,
  errors: [],
  circuit,
});

describe("code sync safety", () => {
  it("applies parsed circuits without warnings", () => {
    const circuit = createEmptyCircuit();
    const result: CodeParseResult = { success: true, circuit };

    expect(decideCodeSync(result, validate)).toEqual({
      kind: "apply",
      circuit,
      warnings: [],
    });
  });

  it("applies unbound-parameter warnings as informational", () => {
    const circuit = createEmptyCircuit();
    const warning =
      'Line 3: unbound parameter "theta" — bind a value before simulating';
    const result: CodeParseResult = {
      success: true,
      circuit,
      warnings: [warning],
    };

    expect(decideCodeSync(result, validate)).toEqual({
      kind: "apply",
      circuit,
      warnings: [warning],
    });
  });

  it("blocks parsed circuits when lines were ignored", () => {
    const circuit = createEmptyCircuit();
    const warning = "Line 9: unsupported or unrecognized — qc.foo(1)";
    const result: CodeParseResult = {
      success: true,
      circuit,
      warnings: [warning],
    };

    expect(decideCodeSync(result, validate)).toEqual({
      kind: "blocked",
      circuit,
      warnings: [warning],
    });
  });

  it("returns an error when validation fails", () => {
    const circuit = createEmptyCircuit();
    const result: CodeParseResult = { success: true, circuit };
    const validation = () => ({
      valid: false,
      errors: ["invalid circuit"],
      circuit,
    });

    expect(decideCodeSync(result, validation)).toEqual({
      kind: "error",
      error: "invalid circuit",
      warnings: [],
    });
  });

  it("rejects unbound parameters in both simulators", () => {
    const parsed = parseQiskitCode(
      "from qiskit import QuantumCircuit\nqc = QuantumCircuit(1)\nqc.rx(theta, 0)\n"
    );
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;

    const state = simulateCircuit(parsed.circuit);
    expect(state.error).toContain("Unbound parameter theta");
    expect(state.probabilities).toEqual([]);

    const shots = runCircuitShots(parsed.circuit, 10);
    expect(shots.error).toContain("Unbound parameter theta");
    expect(shots.histogram).toEqual([]);
  });

  it("preserves symbolic parameters through Qiskit and OpenQASM exports", () => {
    const qiskit = parseQiskitCode(
      "from qiskit import QuantumCircuit\nqc = QuantumCircuit(1)\nqc.rx(theta, 0)\n"
    );
    expect(qiskit.success).toBe(true);
    if (!qiskit.success) return;

    const qiskitExport = generateQiskitCode(qiskit.circuit);
    expect(qiskitExport.success).toBe(true);
    if (!qiskitExport.success) return;
    expect(qiskitExport.code).toContain("qc.rx(theta, 0)");

    const qasm = parseOpenQasm(
      'OPENQASM 2.0;\ninclude "qelib1.inc";\nqreg q[1];\nrx(theta) q[0];\n'
    );
    expect(qasm.success).toBe(true);
    if (!qasm.success) return;

    const qasmExport = generateOpenQasm(qasm.circuit);
    expect(qasmExport.success).toBe(true);
    if (!qasmExport.success) return;
    expect(qasmExport.code).toContain("rx(theta) q[0];");
  });
});
