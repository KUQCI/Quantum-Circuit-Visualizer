import { describe, expect, it } from "vitest";
import { createEmptyCircuit } from "@/lib/circuit-schema";
import { buildLessonDiagram } from "@/lib/learning/lesson-diagram";
import { LESSONS } from "@/lib/learning/lessons";
import { bellStateCircuit } from "@/lib/sample-circuits";
import { computeStepSnapshots } from "@/lib/step-explanations";

describe("lesson diagram layout", () => {
  it("lays out Bell controls and targets in execution columns", () => {
    const diagram = buildLessonDiagram(bellStateCircuit);

    expect(diagram.columns).toHaveLength(2);
    expect(diagram.columns[1].items[0]).toMatchObject({
      type: "cx",
      controls: [0],
      targets: [1],
    });
  });

  it("excludes barriers and handles empty circuits", () => {
    const circuit = createEmptyCircuit("Barrier", 2);
    circuit.operations = [
      {
        id: "barrier",
        type: "barrier",
        label: "Barrier",
        targets: ["q0", "q1"],
        controls: [],
        classicalTargets: [],
        column: 0,
      },
    ];

    expect(buildLessonDiagram(circuit).columns).toEqual([]);
    expect(buildLessonDiagram(createEmptyCircuit("Empty", 1))).toEqual({
      columns: [],
      qubitCount: 1,
    });
  });

  it("builds and simulates every lesson section and starter circuit", () => {
    for (const lesson of LESSONS) {
      expect(() => buildLessonDiagram(lesson.starterCircuit)).not.toThrow();
      expect(() => computeStepSnapshots(lesson.starterCircuit)).not.toThrow();
      for (const section of lesson.sections) {
        if (!section.circuit) continue;
        const sectionCircuit = section.circuit;
        expect(() => buildLessonDiagram(sectionCircuit)).not.toThrow();
        expect(() => computeStepSnapshots(sectionCircuit)).not.toThrow();
      }
    }
  });
});
