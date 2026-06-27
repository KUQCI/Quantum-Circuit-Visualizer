import { describe, it, expect } from "vitest";
import { checkCircuit } from "@/lib/learning/checker";
import { createEmptyCircuit } from "@/lib/circuit-schema";
import { bellStateCircuit, simpleSuperpositionCircuit } from "@/lib/sample-circuits";
import { getLevelFromXp, xpForNextLevel } from "@/lib/learning/progress";

describe("Learning checker", () => {
  it("passes superposition lesson condition", () => {
    const circuit = simpleSuperpositionCircuit;
    const result = checkCircuit(circuit, {
      type: "all",
      conditions: [
        { type: "hasGateOnQubit", gate: "h", target: "q0" },
        { type: "maxOperations", count: 1 },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("passes Bell state operation order", () => {
    const result = checkCircuit(bellStateCircuit, {
      type: "operationOrder",
      operations: [
        { gate: "h", target: "q0" },
        { gate: "cx", control: "q0", target: "q1" },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("fails when X missing on q0", () => {
    const circuit = createEmptyCircuit("Empty", 1);
    const result = checkCircuit(circuit, {
      type: "hasGateOnQubit",
      gate: "x",
      target: "q0",
    });
    expect(result.success).toBe(false);
  });

  it("requires export action when configured", () => {
    const circuit = simpleSuperpositionCircuit;
    expect(
      checkCircuit(circuit, { type: "actionExport" }, { actionExportDone: false })
        .success
    ).toBe(false);
    expect(
      checkCircuit(circuit, { type: "actionExport" }, { actionExportDone: true })
        .success
    ).toBe(true);
  });
});

describe("Progress levels", () => {
  it("computes level from XP", () => {
    expect(getLevelFromXp(0)).toBe(1);
    expect(getLevelFromXp(100)).toBe(2);
    expect(getLevelFromXp(250)).toBe(3);
  });

  it("computes XP to next level", () => {
    const info = xpForNextLevel(150);
    expect(info.currentLevel).toBe(2);
    expect(info.nextLevel).toBe(3);
  });
});
