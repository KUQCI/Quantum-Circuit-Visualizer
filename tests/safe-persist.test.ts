import { describe, expect, it } from "vitest";
import { asStringArray, sanitizeCircuit } from "@/lib/safe-persist";

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
});
