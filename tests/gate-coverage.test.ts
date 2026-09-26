import { describe, it, expect } from "vitest";
import { parseOpenQasm } from "@/lib/openqasm-parser";
import { simulateCircuit } from "@/lib/quantum-state";
import { generateCirqCode } from "@/lib/cirq-generator";
import { generateQiskitCode } from "@/lib/qiskit-generator";
import { getCodeLanguage } from "@/lib/code-adapters";
import { createEmptyCircuit } from "@/lib/circuit-schema";
import type { Circuit } from "@/lib/circuit-schema";

function circuitFromBody(body: string, qubits = 4): Circuit {
  const qasm = `OPENQASM 2.0;\ninclude "qelib1.inc";\nqreg q[${qubits}];\n${body}\n`;
  const parsed = parseOpenQasm(qasm);
  if (!parsed.success) throw new Error(parsed.error);
  return parsed.circuit;
}

function probabilityOf(circuit: Circuit, label: string): number {
  const result = simulateCircuit(circuit);
  expect(result.error).toBeNull();
  return result.probabilities.find((p) => p.label === `|${label}⟩`)?.probability ?? 0;
}

const SIMULATED_GATES: Record<string, string> = {
  u1: "u1(0.7) q[0];",
  u2: "u2(0.3,0.9) q[0];",
  u3: "u3(0.4,0.5,0.6) q[0];",
  cy: "cy q[0],q[1];",
  ch: "ch q[0],q[1];",
  csx: "csx q[0],q[1];",
  crz: "crz(0.8) q[0],q[1];",
  cu1: "cu1(0.8) q[0],q[1];",
  cu3: "cu3(0.4,0.5,0.6) q[0],q[1];",
  cu: "cu(0.4,0.5,0.6,0.2) q[0],q[1];",
  cswap: "cswap q[0],q[1],q[2];",
  ccx: "ccx q[0],q[1],q[2];",
  rccx: "rccx q[0],q[1],q[2];",
  rc3x: "rc3x q[0],q[1],q[2],q[3];",
};

describe("simulator gate coverage", () => {
  for (const [name, body] of Object.entries(SIMULATED_GATES)) {
    it(`simulates ${name}`, () => {
      const circuit = circuitFromBody(`h q[0];\nh q[1];\nh q[2];\n${body}`);
      const result = simulateCircuit(circuit);
      expect(result.error).toBeNull();
      const total = result.probabilities.reduce((s, p) => s + p.probability, 0);
      expect(total).toBeCloseTo(1, 9);
    });
  }

  it("cswap exchanges targets only when the control is set", () => {
    expect(probabilityOf(circuitFromBody("x q[0];\nx q[1];\ncswap q[0],q[1],q[2];", 3), "101")).toBeCloseTo(1, 9);
    expect(probabilityOf(circuitFromBody("x q[1];\ncswap q[0],q[1],q[2];", 3), "010")).toBeCloseTo(1, 9);
  });

  it("cy flips the target with a phase when the control is set", () => {
    const result = simulateCircuit(circuitFromBody("x q[0];\ncy q[0],q[1];", 2));
    expect(result.error).toBeNull();
    const amp = result.amplitudes[3];
    expect(amp.re).toBeCloseTo(0, 9);
    expect(amp.im).toBeCloseTo(1, 9);
  });

  it("cu1 applies a relative phase on |11>", () => {
    const result = simulateCircuit(circuitFromBody("h q[0];\nh q[1];\ncu1(pi) q[0],q[1];", 2));
    expect(result.error).toBeNull();
    expect(result.amplitudes[3].re).toBeCloseTo(-0.5, 9);
  });

  it("rccx acts as a Toffoli on computational basis states", () => {
    expect(probabilityOf(circuitFromBody("x q[0];\nx q[1];\nrccx q[0],q[1],q[2];", 3), "111")).toBeCloseTo(1, 9);
    expect(probabilityOf(circuitFromBody("x q[0];\nrccx q[0],q[1],q[2];", 3), "001")).toBeCloseTo(1, 9);
  });

  it("rc3x acts as a triple-controlled X on computational basis states", () => {
    expect(probabilityOf(circuitFromBody("x q[0];\nx q[1];\nx q[2];\nrc3x q[0],q[1],q[2],q[3];", 4), "1111")).toBeCloseTo(1, 9);
    expect(probabilityOf(circuitFromBody("x q[0];\nx q[1];\nrc3x q[0],q[1],q[2],q[3];", 4), "0011")).toBeCloseTo(1, 9);
  });
});

describe("Cirq export", () => {
  it("emits Cirq gate constants in upper case", () => {
    const circuit = circuitFromBody("h q[0];\nx q[1];\ny q[2];\nz q[3];\ns q[0];\nt q[1];");
    const result = generateCirqCode(circuit);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.code).toContain("cirq.H(qubits[0])");
    expect(result.code).toContain("cirq.X(qubits[1])");
    expect(result.code).toContain("cirq.T(qubits[1])");
    expect(result.code).not.toMatch(/cirq\.[hxyzst]\(/);
  });

  it("exports multi-qubit gates without warnings", () => {
    const circuit = circuitFromBody(
      "cy q[0],q[1];\nch q[0],q[2];\nccx q[0],q[1],q[2];\ncswap q[0],q[2],q[3];\nrxx(0.3) q[0],q[1];\nrzz(0.7) q[2],q[3];"
    );
    const result = generateCirqCode(circuit);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.warnings).toEqual([]);
    expect(result.code).toContain("cirq.CCX(");
    expect(result.code).toContain("cirq.CSWAP(");
    expect(result.code).toContain("cirq.XXPowGate(");
  });
});

describe("Qiskit export", () => {
  it("exports controlled gates instead of dropping them", () => {
    const circuit = circuitFromBody(
      "cy q[0],q[1];\nch q[0],q[2];\ncsx q[0],q[3];\ncrz(0.8) q[0],q[1];\ncu1(0.8) q[0],q[2];\ncu3(0.4,0.5,0.6) q[0],q[3];\ncswap q[0],q[1],q[2];"
    );
    const result = generateQiskitCode(circuit);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.warnings).toEqual([]);
    expect(result.code).toContain("qc.cy(0, 1)");
    expect(result.code).toContain("qc.ch(0, 2)");
    expect(result.code).toContain("qc.csx(0, 3)");
    expect(result.code).toContain("qc.crz(0.8, 0, 1)");
    expect(result.code).toContain("qc.cp(0.8, 0, 2)");
    expect(result.code).toContain("qc.cu(0.4, 0.5, 0.6, 0, 0, 3)");
    expect(result.code).toContain("qc.cswap(0, 1, 2)");
  });

  it("uses the Qiskit method name for the relative-phase CCCX", () => {
    const circuit = circuitFromBody("rc3x q[0],q[1],q[2],q[3];");
    const result = generateQiskitCode(circuit);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.code).toContain("qc.rcccx(0, 1, 2, 3)");
  });
});

describe("Qiskit Runtime snippet", () => {
  const adapter = getCodeLanguage("qiskit-runtime");

  it("reads counts when the circuit measures", () => {
    const circuit = circuitFromBody("h q[0];\ncreg c[1];\nmeasure q[0] -> c[0];", 1);
    const result = adapter.generate(circuit);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.code).toContain("result[0].data.c.get_counts()");
  });

  it("does not read a classical register when the circuit has none", () => {
    const circuit = createEmptyCircuit("No measurement", 1, 0);
    const result = adapter.generate(circuit);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.code).not.toContain("data.c.get_counts()");
    expect(result.code).toContain("print(result[0].data)");
  });
});
