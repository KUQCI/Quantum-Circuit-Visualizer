import { describe, expect, it } from "vitest";
import { getLessonGateTypes } from "@/lib/learning/checker";
import { CHALLENGES } from "@/lib/learning/challenges";
import { LESSONS } from "@/lib/learning/lessons";
import { createEmptyCircuit } from "@/lib/circuit-schema";

describe("lesson gate filtering", () => {
  it("collects the gate needed by a single-gate lesson", () => {
    const lesson = LESSONS.find((item) => item.id === "add-first-gate");
    expect(lesson).toBeDefined();
    expect(getLessonGateTypes(lesson!.successCondition, lesson!.starterCircuit)).toEqual(["x"]);
  });

  it("includes starter operations and measurements", () => {
    const lesson = LESSONS.find((item) => item.id === "capstone-bell-experiment");
    expect(lesson).toBeDefined();
    expect(getLessonGateTypes(lesson!.successCondition, lesson!.starterCircuit)).toEqual(
      expect.arrayContaining(["h", "cx", "measure"])
    );
  });

  it("collects exact-match and no-extra gate types", () => {
    const challenge = CHALLENGES.find((item) => item.id === "match-target-circuit");
    expect(challenge).toBeDefined();
    expect(getLessonGateTypes(challenge!.successCondition, challenge!.starterCircuit)).toEqual(["h"]);
    expect(
      getLessonGateTypes(
        { type: "noExtraGates", allowed: ["cnot", "x"] },
        createEmptyCircuit("test", 2)
      )
    ).toEqual(["cx", "x"]);
  });

  it("returns null for action and manual conditions", () => {
    const starter = createEmptyCircuit("test");
    expect(getLessonGateTypes({ type: "manual" }, starter)).toBeNull();
    expect(getLessonGateTypes({ type: "actionExport" }, starter)).toBeNull();
    expect(getLessonGateTypes({ type: "actionImport" }, starter)).toBeNull();
  });

  it("supports controlled-gate conditions without a specific gate", () => {
    expect(
      getLessonGateTypes(
        { type: "hasControlledGate" },
        createEmptyCircuit("test", 2)
      )
    ).toEqual(["cx", "cz", "ccx", "rccx", "rc3x"]);
  });
});
