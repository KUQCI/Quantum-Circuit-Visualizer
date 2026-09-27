import { describe, expect, it } from "vitest";
import { LESSONS } from "@/lib/learning/lessons";
import { MODULE_IDS } from "@/lib/learning/progress";
import { checkCircuit } from "@/lib/learning/checker";
import { createEmptyCircuit } from "@/lib/circuit-schema";
import type { CheckCondition } from "@/lib/learning/types";

function solutionFor(condition: CheckCondition, circuit: (typeof LESSONS)[number]["starterCircuit"]) {
  let qubitCount = circuit.qubits.length;
  let classicalCount = circuit.classicalBits.length;
  const inspect = (item: CheckCondition) => {
    if (item.type === "minQubits") qubitCount = Math.max(qubitCount, item.count);
    if (item.type === "hasControlledGate") qubitCount = Math.max(qubitCount, 2);
    if (item.type === "hasMeasurement") classicalCount = Math.max(classicalCount, item.count ?? 1);
    if (item.type === "operationOrder") {
      for (const operation of item.operations) {
        for (const wire of [operation.target, operation.control]) {
          if (wire?.startsWith("q")) qubitCount = Math.max(qubitCount, Number(wire.slice(1)) + 1);
        }
      }
    }
    if (item.type === "all" || item.type === "any") item.conditions.forEach(inspect);
  };
  inspect(condition);
  const next = createEmptyCircuit("solution", qubitCount, classicalCount);
  let counter = 0;
  const add = (
    type: string,
    target = "q0",
    controls: string[] = [],
    classicalTargets = type === "measure" ? ["c0"] : [],
    symbol?: string
  ) => {
    next.operations.push({
      id: `solution-${counter++}`,
      type,
      label: type.toUpperCase(),
      targets: [target],
      controls,
      classicalTargets,
      parameters:
        symbol
          ? [{ value: 0.5, display: symbol, symbol }]
          : ["rx", "ry", "rz", "p", "u"].includes(type)
            ? [{ value: 1, display: "theta" }]
            : undefined,
      column: counter,
    });
  };
  const visit = (item: CheckCondition) => {
    if (item.type === "hasGate" || item.type === "hasGateOnQubit") {
      add(item.gate, item.type === "hasGateOnQubit" ? item.target : "q0");
    } else if (item.type === "hasControlledGate") {
      add(item.gate ?? "cx", "q1", ["q0"]);
    } else if (item.type === "hasMeasurement") {
      for (let index = 0; index < (item.count ?? 1); index += 1) {
        add(
          "measure",
          item.qubit ?? `q${index}`,
          [],
          item.classical ? [item.classical] : undefined
        );
      }
    } else if (item.type === "hasParameterGate") {
      add(item.gate ?? "rx");
    } else if (item.type === "hasSymbolicParameter") {
      for (let index = 0; index < (item.minCount ?? 1); index += 1) {
        add(item.gate ?? "ry", `q${index}`, [], [], `theta${index}`);
      }
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
  it("uses contiguous order grouped by module", () => {
    const ordered = [...LESSONS].sort((a, b) => a.order - b.order);
    expect(ordered.map((lesson) => lesson.order)).toEqual(
      Array.from({ length: ordered.length }, (_, index) => index + 1)
    );

    const expectedModuleOrder = MODULE_IDS.flatMap((moduleId) =>
      LESSONS.filter((lesson) => lesson.module === moduleId)
        .sort((a, b) => a.order - b.order)
        .map((lesson) => lesson.id)
    );
    expect(ordered.map((lesson) => lesson.id)).toEqual(expectedModuleOrder);
  });

  it("provides complete, valid content for every lesson", () => {
    const ids = new Set<string>();
    for (const lesson of LESSONS) {
      expect(ids.has(lesson.id)).toBe(false);
      ids.add(lesson.id);
      expect(lesson.sections).toHaveLength(3);
      expect(lesson.sections.every((section) => section.quantaNote)).toBe(true);
      expect(lesson.quiz.length).toBe(2);
      for (const question of lesson.quiz) {
        expect(question.options.length).toBeGreaterThanOrEqual(3);
        expect(question.options.length).toBeLessThanOrEqual(4);
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
        exportedLanguages: ["qiskit", "openqasm", "cirq", "qiskit-runtime", "json"],
        actionImportDone: includesAction(lesson.successCondition, "actionImport"),
      });
      expect(result.success, `${lesson.id}: ${result.message}`).toBe(true);
    }
  });

  it("starts every build lesson below its success condition", () => {
    for (const lesson of LESSONS) {
      if (
        lesson.successCondition.type === "manual" ||
        lesson.id === "noise-vs-ideal" ||
        lesson.id === "qml-training-loop"
      )
        continue;
      const result = checkCircuit(lesson.starterCircuit, lesson.successCondition, {
        actionExportDone: false,
        actionImportDone: false,
      });
      expect(result.success, `${lesson.id}: starter already passes`).toBe(false);
    }
  });

  it("requires one measurement on each Bell qubit and classical bit", () => {
    const lesson = LESSONS.find((item) => item.id === "capstone-bell-experiment");
    if (!lesson) throw new Error("Capstone lesson missing");

    const q0Only = structuredClone(lesson.starterCircuit);
    q0Only.operations.push({
      id: "extra-q0-measure",
      type: "measure",
      label: "Measure",
      targets: ["q0"],
      controls: [],
      classicalTargets: ["c0"],
      column: 3,
    });
    expect(checkCircuit(q0Only, lesson.successCondition).success).toBe(false);

    const complete = structuredClone(lesson.starterCircuit);
    complete.operations.push({
      id: "q1-measure",
      type: "measure",
      label: "Measure",
      targets: ["q1"],
      controls: [],
      classicalTargets: ["c1"],
      column: 3,
    });
    expect(checkCircuit(complete, lesson.successCondition).success).toBe(true);
  });

  it("checks the Module 9 capstone target circuit", () => {
    const lesson = LESSONS.find((item) => item.id === "qml-capstone-classifier");
    if (!lesson) throw new Error("QML capstone lesson missing");
    const target = lesson.sections[0]?.circuit;
    if (!target) throw new Error("QML capstone target circuit missing");

    expect(checkCircuit(target, lesson.successCondition).success).toBe(true);
    expect(checkCircuit(lesson.starterCircuit, lesson.successCondition).success).toBe(false);
  });

  it("checks symbolic parameters with optional gate and count scopes", () => {
    const circuit = createEmptyCircuit("symbolic", 1, 0);
    circuit.operations.push({
      id: "symbolic-ry",
      type: "ry",
      label: "RY",
      targets: ["q0"],
      controls: [],
      classicalTargets: [],
      parameters: [{ value: 0.5, symbol: "theta", display: "theta" }],
      column: 0,
    });

    expect(
      checkCircuit(circuit, { type: "hasSymbolicParameter", gate: "ry" }).success
    ).toBe(true);
    expect(
      checkCircuit(circuit, { type: "hasSymbolicParameter", minCount: 2 }).success
    ).toBe(false);
    expect(
      checkCircuit(circuit, { type: "hasSymbolicParameter", gate: "rx" }).success
    ).toBe(false);
  });
});
