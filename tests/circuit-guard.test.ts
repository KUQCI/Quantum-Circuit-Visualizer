import { describe, expect, it } from "vitest";
import { prepareCircuit, prepareHistory } from "@/lib/circuit-guard";
import { createEmptyCircuit } from "@/lib/circuit-schema";

describe("circuit-guard", () => {
  it("repairs circuits with out-of-range operations", () => {
    const circuit = createEmptyCircuit("Test", 2, 0);
    circuit.operations = [
      {
        id: "good",
        type: "h",
        label: "H",
        targets: ["q0"],
        controls: [],
        classicalTargets: [],
        column: 0,
      },
      {
        id: "bad",
        type: "x",
        label: "X",
        targets: ["q5"],
        controls: [],
        classicalTargets: [],
        column: 1,
      },
    ];

    const prepared = prepareCircuit(circuit);
    expect(prepared.operations).toHaveLength(1);
    expect(prepared.operations[0].id).toBe("good");
  });

  it("falls back to a valid empty circuit for garbage input", () => {
    const prepared = prepareCircuit(null, { fallbackName: "Recovered" });
    expect(prepared.name).toBe("Recovered");
    expect(prepared.qubits.length).toBeGreaterThan(0);
  });

  it("normalizes history entries", () => {
    const history = prepareHistory([
      { circuit: { name: "bad" } },
      {
        circuit: createEmptyCircuit("ok", 2, 0),
      },
    ]);

    expect(history).toHaveLength(2);
    expect(history.every((entry) => entry.circuit.qubits.length > 0)).toBe(true);
  });
});
