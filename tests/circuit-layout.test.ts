import { describe, expect, it } from "vitest";
import {
  compactColumnsLeft,
  getExecutionLayers,
  predictLeftAlignedColumn,
} from "@/lib/circuit-layout";
import type { Operation } from "@/lib/circuit-schema";

describe("circuit layout", () => {
  it("reserves intermediate wires when compacting multi-qubit gates", () => {
    const operations: Operation[] = [
      {
        id: "cx",
        type: "cx",
        label: "CX",
        targets: ["q2"],
        controls: ["q0"],
        classicalTargets: [],
        column: 0,
      },
      {
        id: "h",
        type: "h",
        label: "H",
        targets: ["q1"],
        controls: [],
        classicalTargets: [],
        column: 2,
      },
    ];

    const compacted = compactColumnsLeft(operations);
    expect(compacted.find((operation) => operation.id === "h")?.column).toBe(1);
    expect(getExecutionLayers(operations).map((layer) => layer[0].id)).toEqual([
      "cx",
      "h",
    ]);
  });

  it("predicts the landing column on an empty circuit", () => {
    const candidate: Operation = {
      id: "__preview__",
      type: "h",
      label: "H",
      targets: ["q0"],
      controls: [],
      classicalTargets: [],
      column: 4,
    };

    expect(predictLeftAlignedColumn([], candidate)).toBe(0);
  });

  it("predicts the first available column before an occupied wire gap", () => {
    const operations: Operation[] = [
      {
        id: "first",
        type: "h",
        label: "H",
        targets: ["q0"],
        controls: [],
        classicalTargets: [],
        column: 0,
      },
      {
        id: "later",
        type: "x",
        label: "X",
        targets: ["q0"],
        controls: [],
        classicalTargets: [],
        column: 3,
      },
    ];
    const candidate: Operation = {
      id: "__preview__",
      type: "y",
      label: "Y",
      targets: ["q0"],
      controls: [],
      classicalTargets: [],
      column: 2,
    };

    expect(predictLeftAlignedColumn(operations, candidate)).toBe(1);
  });

  it("predicts around a controlled gate's occupied span", () => {
    const operations: Operation[] = [
      {
        id: "cx",
        type: "cx",
        label: "CX",
        targets: ["q2"],
        controls: ["q0"],
        classicalTargets: [],
        column: 0,
      },
    ];
    const candidate: Operation = {
      id: "__preview__",
      type: "h",
      label: "H",
      targets: ["q1"],
      controls: [],
      classicalTargets: [],
      column: 3,
    };

    expect(predictLeftAlignedColumn(operations, candidate)).toBe(1);
  });
});
