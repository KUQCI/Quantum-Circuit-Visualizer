import { describe, it, expect } from "vitest";
import { parseQiskitCode } from "@/lib/qiskit-parser";
import { generateQiskitCode } from "@/lib/qiskit-generator";
import { CircuitSchema, createEmptyCircuit } from "@/lib/circuit-schema";
import { validateCircuit, validateCircuitSemantics } from "@/lib/validation";
import {
  bellStateCircuit,
  bellStateQiskitCode,
} from "@/lib/sample-circuits";
import {
  evalExpr,
  formatParam,
  parseParamExpression,
  tokenize,
} from "@/lib/translator-core";

describe("Qiskit Parser", () => {
  it("parses Bell State Qiskit into JSON circuit", () => {
    const result = parseQiskitCode(bellStateQiskitCode, "Bell State");
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.circuit.qubits).toHaveLength(2);
    expect(result.circuit.operations.map((o) => o.type)).toEqual(["h", "cx"]);
  });

  it("parses QuantumCircuit(2) and QuantumCircuit(2, 2)", () => {
    const a = parseQiskitCode(`from qiskit import QuantumCircuit\nqc = QuantumCircuit(2)\nqc.h(0)\n`);
    expect(a.success).toBe(true);
    if (a.success) expect(a.circuit.classicalBits).toHaveLength(0);

    const b = parseQiskitCode(
      `from qiskit import QuantumCircuit\nqc = QuantumCircuit(2, 2)\nqc.h(0)\nqc.measure(0, 0)\n`
    );
    expect(b.success).toBe(true);
    if (b.success) {
      expect(b.circuit.classicalBits).toHaveLength(2);
      expect(b.circuit.operations.some((o) => o.type === "measure")).toBe(true);
    }
  });

  it("parses circuit = QuantumCircuit alias", () => {
    const result = parseQiskitCode(`from qiskit import QuantumCircuit
circuit = QuantumCircuit(3)
circuit.h(0)
circuit.cx(0, 1)
`);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.circuit.operations).toHaveLength(2);
  });

  it("parses H, X, Y, Z, S, SDG, T, TDG", () => {
    const result = parseQiskitCode(`from qiskit import QuantumCircuit
qc = QuantumCircuit(1)
qc.h(0)
qc.x(0)
qc.y(0)
qc.z(0)
qc.s(0)
qc.sdg(0)
qc.t(0)
qc.tdg(0)
`);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.circuit.operations.map((o) => o.type)).toEqual([
      "h",
      "x",
      "y",
      "z",
      "s",
      "sdg",
      "t",
      "tdg",
    ]);
  });

  it("parses RX/RY/RZ with numeric and symbolic params", () => {
    const result = parseQiskitCode(`from qiskit import QuantumCircuit
qc = QuantumCircuit(1)
qc.rx(1.57, 0)
qc.ry(theta, 0)
qc.rz(pi/2, 0)
`);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.circuit.operations[0].parameters?.[0].value).toBeCloseTo(1.57);
    expect(result.circuit.operations[1].parameters?.[0].display).toBe("theta");
    expect(result.circuit.operations[2].parameters?.[0].display).toBe("pi/2");
  });

  it("parses nested param expressions", () => {
    const result = parseQiskitCode(`from qiskit import QuantumCircuit
qc = QuantumCircuit(1)
qc.rx(sin(pi/2), 0)
`);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.circuit.operations[0].parameters?.[0].value).toBeCloseTo(1);
  });

  it("parses CX, CZ, SWAP with correct wire roles", () => {
    const result = parseQiskitCode(`from qiskit import QuantumCircuit
qc = QuantumCircuit(2)
qc.cx(0, 1)
qc.cz(0, 1)
qc.swap(0, 1)
`);
    expect(result.success).toBe(true);
    if (!result.success) return;
    const [cx, cz, swap] = result.circuit.operations;
    expect(cx.controls).toEqual(["q0"]);
    expect(cx.targets).toEqual(["q1"]);
    expect(cz.controls).toEqual(["q0"]);
    expect(swap.targets).toEqual(["q0", "q1"]);
    expect(swap.controls).toEqual([]);
  });

  it("parses measure list and barrier variants", () => {
    const result = parseQiskitCode(`from qiskit import QuantumCircuit
qc = QuantumCircuit(2, 2)
qc.barrier()
qc.barrier(0)
qc.barrier([0, 1])
qc.measure(0, 0)
qc.measure([0, 1], [0, 1])
`);
    expect(result.success).toBe(true);
    if (!result.success) return;
    const measures = result.circuit.operations.filter((o) => o.type === "measure");
    expect(measures.length).toBe(3);
    const barriers = result.circuit.operations.filter((o) => o.type === "barrier");
    expect(barriers[0].targets).toHaveLength(2);
    expect(barriers[1].targets).toEqual(["q0"]);
  });

  it("ignores comments and blank lines", () => {
    const result = parseQiskitCode(`from qiskit import QuantumCircuit

# create circuit
qc = QuantumCircuit(1)

qc.h(0)  # hadamard
`);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.circuit.operations).toHaveLength(1);
  });

  it("returns warning for unsupported gate without failing", () => {
    const result = parseQiskitCode(`from qiskit import QuantumCircuit
qc = QuantumCircuit(2)
qc.h(0)
qc.unknown_gate(0)
qc.cx(0, 1)
`);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.warnings.some((w) => w.includes("unknown_gate"))).toBe(true);
    expect(result.circuit.operations.map((o) => o.type)).toEqual(["h", "cx"]);
  });

  it("fails clearly without QuantumCircuit declaration", () => {
    const result = parseQiskitCode("this is not valid python");
    expect(result.success).toBe(false);
  });

  it("rejects out-of-range qubit indices", () => {
    const result = parseQiskitCode(`from qiskit import QuantumCircuit
qc = QuantumCircuit(1)
qc.h(5)
`);
    expect(result.success).toBe(false);
  });
});

describe("Qiskit Generator", () => {
  it("generates Bell state", () => {
    const result = generateQiskitCode(bellStateCircuit);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.code).toContain("qc.h(0)");
    expect(result.code).toContain("qc.cx(0, 1)");
  });

  it("generates parameter gates and measurements", () => {
    const circuit = createEmptyCircuit("P", 1, 1);
    circuit.operations = [
      {
        id: "1",
        type: "rx",
        label: "RX",
        targets: ["q0"],
        controls: [],
        classicalTargets: [],
        column: 0,
        parameters: [{ value: Math.PI / 2, display: "pi/2" }],
      },
      {
        id: "2",
        type: "measure",
        label: "M",
        targets: ["q0"],
        controls: [],
        classicalTargets: ["c0"],
        column: 1,
      },
      {
        id: "3",
        type: "barrier",
        label: "‖",
        targets: ["q0"],
        controls: [],
        classicalTargets: [],
        column: 2,
      },
    ];
    const result = generateQiskitCode(circuit);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.code).toContain("QuantumCircuit(1, 1)");
    expect(result.code).toContain("qc.rx(pi/2, 0)");
    expect(result.code).toContain("qc.measure(0, 0)");
    expect(result.code).toMatch(/qc\.barrier/);
  });

  it("generates SWAP from two-target canvas IR", () => {
    const circuit = createEmptyCircuit("S", 2, 0);
    circuit.operations = [
      {
        id: "1",
        type: "swap",
        label: "SWAP",
        targets: ["q0", "q1"],
        controls: [],
        classicalTargets: [],
        column: 0,
      },
    ];
    const result = generateQiskitCode(circuit);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.code).toContain("qc.swap(0, 1)");
  });

  it("generates no-classical-bit circuit", () => {
    const result = generateQiskitCode(createEmptyCircuit("E", 2, 0));
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.code).toContain("QuantumCircuit(2)");
    expect(result.code).not.toContain("QuantumCircuit(2,");
  });
});

describe("Round-trip", () => {
  it("Qiskit → IR → Qiskit preserves gates", () => {
    const import1 = parseQiskitCode(bellStateQiskitCode, "Bell State");
    expect(import1.success).toBe(true);
    if (!import1.success) return;
    const export1 = generateQiskitCode(import1.circuit);
    expect(export1.success).toBe(true);
    if (!export1.success) return;
    const import2 = parseQiskitCode(export1.code, "Bell State");
    expect(import2.success).toBe(true);
    if (!import2.success) return;
    expect(import2.circuit.operations.map((o) => o.type)).toEqual(["h", "cx"]);
  });

  it("SWAP round-trips", () => {
    const code = `from qiskit import QuantumCircuit
qc = QuantumCircuit(2)
qc.swap(0, 1)
`;
    const parsed = parseQiskitCode(code);
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    const gen = generateQiskitCode(parsed.circuit);
    expect(gen.success).toBe(true);
    if (!gen.success) return;
    expect(gen.code).toContain("qc.swap(0, 1)");
    const again = parseQiskitCode(gen.code);
    expect(again.success).toBe(true);
    if (!again.success) return;
    expect(again.circuit.operations[0].targets).toEqual(["q0", "q1"]);
  });

  it("IR → Qiskit → IR for measure + params", () => {
    const src = `from qiskit import QuantumCircuit
qc = QuantumCircuit(2, 2)
qc.rx(pi/2, 0)
qc.cx(0, 1)
qc.measure([0, 1], [0, 1])
`;
    const a = parseQiskitCode(src);
    expect(a.success).toBe(true);
    if (!a.success) return;
    const b = generateQiskitCode(a.circuit);
    expect(b.success).toBe(true);
    if (!b.success) return;
    const c = parseQiskitCode(b.code);
    expect(c.success).toBe(true);
    if (!c.success) return;
    expect(c.circuit.operations.filter((o) => o.type === "measure")).toHaveLength(2);
  });
});

describe("JSON Schema Validation", () => {
  it("validates correct circuit JSON", () => {
    expect(validateCircuit(bellStateCircuit).valid).toBe(true);
  });

  it("rejects invalid circuit JSON", () => {
    const result = validateCircuit({ name: "Bad", qubits: [] });
    expect(result.valid).toBe(false);
  });

  it("CircuitSchema parses valid circuit", () => {
    expect(CircuitSchema.safeParse(bellStateCircuit).success).toBe(true);
  });

  it("semantic validation catches bad CX / measure", () => {
    const circuit = createEmptyCircuit("Bad", 2, 0);
    circuit.operations = [
      {
        id: "1",
        type: "cx",
        label: "CX",
        targets: ["q1"],
        controls: [],
        classicalTargets: [],
        column: 0,
      },
    ];
    const result = validateCircuitSemantics(circuit);
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes("cx"))).toBe(true);
  });
});

describe("Translator Core", () => {
  it("tokenizes and evaluates expressions", () => {
    const tokens = tokenize("pi/2");
    expect(evalExpr(tokens.slice(0, -1))).toBeCloseTo(Math.PI / 2);
    expect(formatParam(Math.PI / 2)).toBe("pi/2");
    expect(parseParamExpression("sin(pi/2)")).toBeCloseTo(1);
  });

  it("throws on unterminated string instead of hanging", () => {
    expect(() => tokenize('include "qelib1.inc')).toThrow(/Unterminated string/);
  });
});
