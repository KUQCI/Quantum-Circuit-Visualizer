import { describe, expect, it } from "vitest";
import {
  canRetargetOnWire,
  retargetOperation,
  primaryWireIndex,
  countOpsUsingQubit,
  countOpsUsingClassical,
  findPlacementConflict,
  occupiedWires,
  placementConflictMessage,
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
    const next = retargetOperation(op, 3, 1, 3);
    expect(next.column).toBe(3);
    expect(next.targets).toEqual(["q1"]);
  });

  it("retargetOperation updates measure mapping", () => {
    const op = baseOp({
      type: "measure",
      targets: ["q0"],
      classicalTargets: ["c0"],
    });
    const next = retargetOperation(op, 1, 1, 2);
    expect(next.targets).toEqual(["q1"]);
    expect(next.classicalTargets).toEqual(["c0"]);
  });

  it("retargetOperation preserves a measurement classical target in either direction", () => {
    const op = baseOp({
      type: "measure",
      targets: ["q1"],
      classicalTargets: ["c0"],
    });
    const next = retargetOperation(op, 2, 0, 2);
    expect(next.targets).toEqual(["q0"]);
    expect(next.classicalTargets).toEqual(["c0"]);
  });

  it("retargetOperation preserves control/target offset for CX", () => {
    const op = baseOp({
      type: "cx",
      controls: ["q0"],
      targets: ["q1"],
      column: 0,
    });
    const next = retargetOperation(op, 2, 1, 4);
    expect(next.controls).toEqual(["q1"]);
    expect(next.targets).toEqual(["q2"]);
    expect(next.column).toBe(2);
  });

  it("retargetOperation shifts every wire in a controlled block", () => {
    const op = baseOp({
      type: "ccx",
      controls: ["q0", "q1"],
      targets: ["q2"],
    });
    const next = retargetOperation(op, 1, 1, 4);
    expect(next.controls).toEqual(["q1", "q2"]);
    expect(next.targets).toEqual(["q3"]);
  });

  it("retargetOperation keeps both CSWAP targets", () => {
    const op = baseOp({
      type: "cswap",
      controls: ["q0"],
      targets: ["q1", "q2"],
    });
    const next = retargetOperation(op, 1, 1, 4);
    expect(next.controls).toEqual(["q1"]);
    expect(next.targets).toEqual(["q2", "q3"]);
  });

  it("retargetOperation shifts multi-target operations with bounds clamping", () => {
    const op = baseOp({
      type: "rzz",
      targets: ["q0", "q1"],
    });
    const next = retargetOperation(op, 1, 2, 3);
    expect(next.targets).toEqual(["q1", "q2"]);
  });

  it("retargetOperation only changes the column when a block cannot fit", () => {
    const op = baseOp({
      type: "ccx",
      controls: ["q0", "q1"],
      targets: ["q2"],
    });
    const next = retargetOperation(op, 4, 0, 2);
    expect(next.column).toBe(4);
    expect(next.controls).toEqual(op.controls);
    expect(next.targets).toEqual(op.targets);
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

  it("returns every wire occupied by a multi-qubit connector", () => {
    const cx = baseOp({
      type: "cx",
      label: "CX",
      targets: ["q2"],
      controls: ["q0"],
    });

    expect(occupiedWires(cx)).toEqual([0, 1, 2]);
  });

  it("finds a conflict only on a shared wire in the same column", () => {
    const h = baseOp({ targets: ["q0"], column: 1 });

    expect(
      findPlacementConflict([h], {
        targets: ["q0"],
        controls: [],
        column: 1,
      })
    ).toBe(h);
    expect(
      findPlacementConflict([h], {
        targets: ["q1"],
        controls: [],
        column: 1,
      })
    ).toBeNull();
    expect(
      findPlacementConflict([h], {
        targets: ["q0"],
        controls: [],
        column: 2,
      })
    ).toBeNull();
  });

  it("detects a conflict on an intermediate wire spanned by CX", () => {
    const cx = baseOp({
      id: "cx",
      type: "cx",
      label: "CX",
      targets: ["q2"],
      controls: ["q0"],
    });
    const h = baseOp({ id: "h1", targets: ["q1"] });

    expect(
      findPlacementConflict([cx], {
        targets: h.targets,
        controls: h.controls,
        column: h.column,
      })
    ).toBe(cx);
  });

  it("can exclude the operation being moved", () => {
    const h = baseOp({ id: "h1", targets: ["q1"] });

    expect(
      findPlacementConflict(
        [h],
        { targets: h.targets, controls: h.controls, column: h.column },
        h.id
      )
    ).toBeNull();
  });

  it("does not conflict when either operation has no qubit wires", () => {
    const wireless = baseOp({ id: "empty", targets: [], controls: [] });

    expect(
      findPlacementConflict([wireless], {
        targets: ["q0"],
        controls: [],
        column: 0,
      })
    ).toBeNull();
    expect(
      findPlacementConflict([baseOp({ targets: ["q0"] })], {
        targets: [],
        controls: [],
        column: 0,
      })
    ).toBeNull();
  });

  it("treats barriers as occupying all of their target wires", () => {
    const h = baseOp({ id: "h2", targets: ["q2"] });
    const barrier = baseOp({
      id: "barrier",
      type: "barrier",
      label: "Barrier",
      targets: ["q0", "q1", "q2"],
    });

    expect(
      findPlacementConflict(
        [h],
        {
          targets: barrier.targets,
          controls: barrier.controls,
          column: barrier.column,
        }
      )
    ).toBe(h);
  });

  it("describes the shared wire and existing operation", () => {
    const cx = baseOp({
      type: "cx",
      label: "CX",
      targets: ["q2"],
      controls: ["q0"],
    });

    expect(
      placementConflictMessage(cx, {
        targets: ["q1"],
        controls: [],
        column: 2,
      })
    ).toBe(
      "q1 already has a gate (CX) in column 3 — drop it on an empty spot."
    );
  });
});
