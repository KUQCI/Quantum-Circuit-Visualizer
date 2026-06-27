import { describe, it, expect } from "vitest";
import { parseQiskitCode } from "@/lib/qiskit-parser";
import { generateQiskitCode } from "@/lib/qiskit-generator";
import { CircuitSchema } from "@/lib/circuit-schema";
import { validateCircuit } from "@/lib/validation";
import {
  bellStateCircuit,
  bellStateQiskitCode,
  ghzStateCircuit,
} from "@/lib/sample-circuits";
import {
  evalExpr,
  formatParam,
  parseParamExpression,
  tokenize,
} from "@/lib/translator-core";

describe("Qiskit Parser", () => {
  it("parses valid Bell State Qiskit code into JSON circuit", () => {
    const result = parseQiskitCode(bellStateQiskitCode, "Bell State");
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.circuit.name).toBe("Bell State");
    expect(result.circuit.qubits).toHaveLength(2);
    expect(result.circuit.operations).toHaveLength(2);
    expect(result.circuit.operations[0].type).toBe("h");
    expect(result.circuit.operations[1].type).toBe("cx");
  });

  it("parses parameterized rotation gates", () => {
    const code = `from qiskit import QuantumCircuit
qc = QuantumCircuit(1)
qc.rx(pi/2, 0)
`;
    const result = parseQiskitCode(code);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.circuit.operations[0].type).toBe("rx");
    expect(result.circuit.operations[0].parameters?.[0].display).toBe("pi/2");
  });

  it("handles unsupported syntax gracefully", () => {
    const result = parseQiskitCode("this is not valid python");
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error).toBeTruthy();
  });

  it("rejects unsupported gates", () => {
    const code = `from qiskit import QuantumCircuit
qc = QuantumCircuit(2)
qc.ccx(0, 1, 2)
`;
    const result = parseQiskitCode(code);
    expect(result.success).toBe(false);
  });
});

describe("Qiskit Generator", () => {
  it("generates Qiskit code from valid JSON circuit IR", () => {
    const result = generateQiskitCode(bellStateCircuit);
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.code).toContain("from qiskit import QuantumCircuit");
    expect(result.code).toContain("QuantumCircuit(2)");
    expect(result.code).toContain("qc.h(0)");
    expect(result.code).toContain("qc.cx(0, 1)");
  });

  it("generates code for GHZ state", () => {
    const result = generateQiskitCode(ghzStateCircuit);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.code).toContain("qc.h(0)");
    expect(result.code).toContain("qc.cx(0, 1)");
    expect(result.code).toContain("qc.cx(0, 2)");
  });
});

describe("Round-trip consistency", () => {
  it("import Bell State → JSON → export → reimport produces equivalent circuit", () => {
    const import1 = parseQiskitCode(bellStateQiskitCode, "Bell State");
    expect(import1.success).toBe(true);
    if (!import1.success) return;

    const export1 = generateQiskitCode(import1.circuit);
    expect(export1.success).toBe(true);
    if (!export1.success) return;

    const import2 = parseQiskitCode(export1.code, "Bell State");
    expect(import2.success).toBe(true);
    if (!import2.success) return;

    expect(import2.circuit.qubits.length).toBe(import1.circuit.qubits.length);
    expect(import2.circuit.operations.length).toBe(import1.circuit.operations.length);
    expect(import2.circuit.operations[0].type).toBe("h");
    expect(import2.circuit.operations[1].type).toBe("cx");
  });
});

describe("JSON Schema Validation", () => {
  it("validates correct circuit JSON", () => {
    const result = validateCircuit(bellStateCircuit);
    expect(result.valid).toBe(true);
  });

  it("rejects invalid circuit JSON", () => {
    const result = validateCircuit({ name: "Bad", qubits: [] });
    expect(result.valid).toBe(false);
    if (result.valid) return;
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("CircuitSchema parses valid circuit", () => {
    const parsed = CircuitSchema.safeParse(bellStateCircuit);
    expect(parsed.success).toBe(true);
  });
});

describe("Translator Core (ported from Python)", () => {
  it("tokenizes QASM-like expressions", () => {
    const tokens = tokenize("pi/2");
    expect(tokens.some((t) => t.value === "pi")).toBe(true);
    expect(tokens.some((t) => t.value === "/")).toBe(true);
  });

  it("evaluates pi/2 expression", () => {
    const tokens = tokenize("pi/2");
    const value = evalExpr(tokens.slice(0, -1));
    expect(value).toBeCloseTo(Math.PI / 2);
  });

  it("formats pi/2 as fraction string", () => {
    expect(formatParam(Math.PI / 2)).toBe("pi/2");
    expect(formatParam(Math.PI)).toBe("pi");
    expect(formatParam(0)).toBe("0");
  });

  it("parses param expressions via parseParamExpression", () => {
    expect(parseParamExpression("3*pi/4")).toBeCloseTo((3 * Math.PI) / 4);
    expect(parseParamExpression("sin(pi/2)")).toBeCloseTo(1);
  });
});
