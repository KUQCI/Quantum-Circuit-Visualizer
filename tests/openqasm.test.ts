import { describe, it, expect } from "vitest";
import { parseOpenQasm } from "@/lib/openqasm-parser";
import { generateOpenQasm } from "@/lib/openqasm-generator";
import { bellStateCircuit, bellStateOpenQasmCode } from "@/lib/sample-circuits";

describe("OpenQASM parser", () => {
  it("parses Bell state OpenQASM", () => {
    const result = parseOpenQasm(bellStateOpenQasmCode);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.circuit.qubits.length).toBe(2);
    expect(result.circuit.operations.length).toBe(2);
    expect(result.circuit.operations[0].type).toBe("h");
    expect(result.circuit.operations[1].type).toBe("cx");
  });

  it("round-trips Bell state through OpenQASM", () => {
    const qasm = generateOpenQasm(bellStateCircuit);
    expect(qasm.success).toBe(true);
    if (!qasm.success) return;
    expect(qasm.code).toContain("OPENQASM 2.0");
    expect(qasm.code).toContain("h q[0]");
    expect(qasm.code).toContain("cx q[0],q[1]");

    const reparsed = parseOpenQasm(qasm.code);
    expect(reparsed.success).toBe(true);
    if (!reparsed.success) return;
    expect(reparsed.circuit.operations.map((o) => o.type)).toEqual(["h", "cx"]);
  });
});
