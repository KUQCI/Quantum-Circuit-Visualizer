import { describe, expect, it } from "vitest";
import {
  canRetargetOnWire,
  retargetOperation,
  primaryWireIndex,
  countOpsUsingQubit,
  countOpsUsingClassical,
} from "@/lib/circuit-edit";
import type { Operation, Circuit } from "@/lib/circuit-schema";

const baseOp = (overrides: Partial<Operation>): Operation => ({
  id: "op1",
  type: "h",
  label: "H",
  targets: ["q0"],
  controls: [],
  classicalTargets: [],
  column: 0,
  ...overrides,
});

describe("circuit-edit", () => {
  it("canRetargetOnWire allows single-qubit gates", () => {
    expect(canRetargetOnWire(baseOp({ type: "h" }))).toBe(true);
    expect(canRetargetOnWire(baseOp({ type: "barrier" }))).toBe(false);
  });

  it("retargetOperation moves single-qubit gate to new qubit", () => {
    const op = baseOp({ type: "x", targets: ["q0"], column: 2 });
    const next = retargetOperation(op, 3, 1, 3, 0);
    expect(next.column).toBe(3);
    expect(next.targets).toEqual(["q1"]);
  });

  it("retargetOperation updates measure mapping", () => {
    const op = baseOp({
      type: "measure",
      targets: ["q0"],
      classicalTargets: ["c0"],
    });
    const next = retargetOperation(op, 1, 1, 2, 2);
    expect(next.targets).toEqual(["q1"]);
    expect(next.classicalTargets).toEqual(["c1"]);
  });

  it("retargetOperation preserves control/target offset for CX", () => {
    const op = baseOp({
      type: "cx",
      controls: ["q0"],
      targets: ["q1"],
      column: 0,
    });
    const next = retargetOperation(op, 2, 1, 4, 0);
    expect(next.controls).toEqual(["q1"]);
    expect(next.targets).toEqual(["q2"]);
    expect(next.column).toBe(2);
  });

  it("primaryWireIndex returns minimum wire", () => {
    const op = baseOp({ controls: ["q2"], targets: ["q3"] });
    expect(primaryWireIndex(op)).toBe(2);
  });

  it("countOpsUsingQubit counts affected operations", () => {
    const circuit: Circuit = {
      name: "Test",
      qubits: [
        { id: "q0", label: "q[0]" },
        { id: "q1", label: "q[1]" },
      ],
      classicalBits: [],
      operations: [
        baseOp({ id: "a", targets: ["q0"] }),
        baseOp({ id: "b", controls: ["q0"], targets: ["q1"], type: "cx" }),
      ],
    };
    expect(countOpsUsingQubit(circuit, "q0")).toBe(2);
    expect(countOpsUsingClassical(circuit, "c0")).toBe(0);
  });
});
