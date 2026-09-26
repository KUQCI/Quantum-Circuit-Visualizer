import { describe, expect, it } from "vitest";
import { LESSONS } from "@/lib/learning/lessons";
import { MODULE_IDS } from "@/lib/learning/progress";
import { checkCircuit } from "@/lib/learning/checker";
import type { CheckCondition } from "@/lib/learning/types";

function solutionFor(condition: CheckCondition, circuit: (typeof LESSONS)[number]["starterCircuit"]) {
  const next = structuredClone(circuit);
  let counter = next.operations.length;
  const add = (type: string, target = "q0", controls: string[] = []) => {
    next.operations.push({
      id: `solution-${counter++}`,
      type,
      label: type.toUpperCase(),
      targets: [target],
      controls,
      classicalTargets: type === "measure" ? ["c0"] : [],
      parameters:
        type === "rx" ? [{ value: 1, display: "theta" }] : undefined,
      column: counter,
    });
  };
  const visit = (item: CheckCondition) => {
    if (item.type === "hasGate" || item.type === "hasGateOnQubit") {
      add(item.gate, item.type === "hasGateOnQubit" ? item.target : "q0");
    } else if (item.type === "hasControlledGate") {
      add(item.gate ?? "cx", "q1", ["q0"]);
    } else if (item.type === "hasMeasurement") {
      add("measure", item.qubit ?? "q0");
    } else if (item.type === "hasParameterGate") {
      add(item.gate ?? "rx");
    } else if (item.type === "operationOrder") {
      for (const operation of item.operations) {
        add(operation.gate, operation.target ?? "q0", operation.control ? [operation.control] : []);
      }
    } else if (item.type === "all") {
      item.conditions.forEach(visit);
    } else if (item.type === "any") {
      visit(item.conditions[0]);
    }
  };
  visit(condition);
  return next;
}

function includesAction(
  condition: CheckCondition,
  type: "actionExport" | "actionImport"
): boolean {
  if (condition.type === type) return true;
  if (condition.type === "all" || condition.type === "any") {
    return condition.conditions.some((item) => includesAction(item, type));
  }
  return false;
}

describe("academy lesson content", () => {
  it("provides complete, valid content for every lesson", () => {
    const ids = new Set<string>();
    for (const lesson of LESSONS) {
      expect(ids.has(lesson.id)).toBe(false);
      ids.add(lesson.id);
      expect(lesson.sections.length).toBeGreaterThanOrEqual(2);
      expect(lesson.quiz.length).toBeGreaterThanOrEqual(1);
      for (const question of lesson.quiz) {
        expect(question.answerIndex).toBeGreaterThanOrEqual(0);
        expect(question.answerIndex).toBeLessThan(question.options.length);
      }
    }
    for (const moduleId of MODULE_IDS) {
      expect(LESSONS.some((lesson) => lesson.module === moduleId)).toBe(true);
    }
  });

  it("resolves prerequisites and walkthrough references", () => {
    const ids = new Set(LESSONS.map((lesson) => lesson.id));
    for (const lesson of LESSONS) {
      for (const prerequisite of lesson.prerequisites ?? []) {
        expect(ids.has(prerequisite)).toBe(true);
      }
      if (lesson.walkthroughId) {
        expect(["bell", "hzh"]).toContain(lesson.walkthroughId);
      }
    }
  });

  it("accepts each starter circuit as an obvious solution when applicable", () => {
    for (const lesson of LESSONS) {
      const result = checkCircuit(solutionFor(lesson.successCondition, lesson.starterCircuit), lesson.successCondition, {
        actionExportDone: includesAction(lesson.successCondition, "actionExport"),
        actionImportDone: includesAction(lesson.successCondition, "actionImport"),
      });
      expect(result.success, `${lesson.id}: ${result.message}`).toBe(true);
    }
  });
});
