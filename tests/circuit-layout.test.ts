import { describe, expect, it } from "vitest";
import {
  compactColumnsLeft,
  getExecutionLayers,
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
});
