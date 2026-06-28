import { describe, expect, it } from "vitest";
import { asStringArray, sanitizeCircuit } from "@/lib/safe-persist";
import { repairCircuit } from "@/lib/validation";
import { createEmptyCircuit } from "@/lib/circuit-schema";

describe("safe-persist", () => {
  it("coerces missing arrays to empty arrays", () => {
    expect(asStringArray(null)).toEqual([]);
    expect(asStringArray(["a", 1, "b"])).toEqual(["a", "b"]);
  });

  it("falls back to a valid empty circuit for corrupt data", () => {
    const circuit = sanitizeCircuit({ name: "bad" });
    expect(circuit.qubits.length).toBeGreaterThan(0);
    expect(Array.isArray(circuit.operations)).toBe(true);
  });

  it("drops operations that reference missing qubits", () => {
    const circuit = createEmptyCircuit("test", 2, 0);
    circuit.operations = [
      {
        id: "ok",
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
        targets: ["q9"],
        controls: [],
        classicalTargets: [],
        column: 1,
      },
    ];

    const repaired = repairCircuit(circuit);
    expect(repaired.operations).toHaveLength(1);
    expect(repaired.operations[0].id).toBe("ok");
  });
});
