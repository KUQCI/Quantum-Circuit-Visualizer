import { describe, expect, it } from "vitest";
import { createEmptyCircuit } from "@/lib/circuit-schema";
import {
  buildLessonWalkthrough,
  estimateSceneMs,
  pickWalkthroughCircuit,
  toSpeechText,
} from "@/lib/learning/lesson-walkthrough";
import { LESSONS } from "@/lib/learning/lessons";
import type { CheckCondition, LessonDefinition } from "@/lib/learning/types";
import { computeStepSnapshots } from "@/lib/step-explanations";

describe("lesson walkthrough data", () => {
  it("creates useful, ordered scenes for every lesson", () => {
    for (const lesson of LESSONS) {
      const walkthrough = buildLessonWalkthrough(lesson);
      const snapshotCount = walkthrough.circuit
        ? computeStepSnapshots(walkthrough.circuit).length
        : 0;

      expect(walkthrough.scenes.length, lesson.id).toBeGreaterThanOrEqual(2);
      expect(walkthrough.scenes.every((scene) => scene.title.trim()), lesson.id)
        .toBe(true);
      expect(
        walkthrough.scenes.every((scene) => scene.caption.trim()),
        lesson.id
      ).toBe(true);
      expect(walkthrough.scenes.every((scene) => scene.speech.trim()), lesson.id)
        .toBe(true);
      expect(
        walkthrough.scenes.every(
          (scene) => !scene.speech.includes("⟩") && !scene.speech.includes("|")
        ),
        lesson.id
      ).toBe(true);

      let visibleSteps = 0;
      for (const scene of walkthrough.scenes) {
        expect(scene.visibleSteps, lesson.id).toBeGreaterThanOrEqual(
          visibleSteps
        );
        visibleSteps = scene.visibleSteps;
        expect(
          scene.snapshotStep === null ||
            (scene.snapshotStep >= 0 && scene.snapshotStep < snapshotCount),
          lesson.id
        ).toBe(true);
      }
    }
  });

  it("uses the Bell circuit and explains the entangling step", () => {
    const lesson = LESSONS.find((item) => item.id === "build-bell-state");
    expect(lesson).toBeDefined();

    const walkthrough = buildLessonWalkthrough(lesson!);
    expect(walkthrough.circuit?.operations.map((operation) => operation.type))
      .toEqual(expect.arrayContaining(["h", "cx"]));

    const gateScenes = walkthrough.scenes.filter((scene) =>
      scene.id.startsWith("step-")
    );
    expect(gateScenes.length).toBeGreaterThanOrEqual(2);
    expect(gateScenes.at(-1)?.caption.toLowerCase()).toContain("entangled");
  });

  it("builds a circuit for each lesson with an authored walkthrough source", () => {
    for (const lesson of LESSONS) {
      if (lesson.walkthroughId || containsOperationOrder(lesson.successCondition)) {
        expect(pickWalkthroughCircuit(lesson), lesson.id).not.toBeNull();
      }
    }
  });

  it("falls back to section scenes when no circuit qualifies", () => {
    const lesson: LessonDefinition = {
      id: "no-walkthrough-circuit",
      title: "A circuit-free lesson",
      module: "basics",
      description: "A minimal fixture.",
      story: "First story sentence. Second story sentence. Third story sentence.",
      difficulty: "beginner",
      estimatedMinutes: 1,
      xpReward: 0,
      skills: [],
      starterCircuit: createEmptyCircuit("No gates", 1),
      successCondition: { type: "manual" },
      hint: "",
      quantaIntro: "An introduction.",
      quantaHint: "",
      quantaSuccess: "",
      quantaIncorrect: "",
      order: 1,
      sections: [
        {
          heading: "First section",
          body: "First sentence. Second sentence. Third sentence.",
        },
        {
          heading: "Second section",
          body: "A single sentence.",
          quantaNote: "A short note.",
        },
      ],
      quiz: [],
    };

    const walkthrough = buildLessonWalkthrough(lesson);
    expect(walkthrough.circuit).toBeNull();
    expect(walkthrough.scenes.map((scene) => scene.id)).toEqual([
      "intro",
      "section-0",
      "section-1",
      "outro",
    ]);
    expect(walkthrough.scenes[1].caption).toBe(
      "First sentence. Second sentence."
    );
    expect(walkthrough.scenes[2].caption).toBe("A short note.");
    expect(walkthrough.scenes[3].caption).toBe(
      "First story sentence. Second story sentence."
    );
    expect(walkthrough.scenes.every((scene) => scene.snapshotStep === null))
      .toBe(true);
  });

  it("prefers an exact-match circuit on a tie and later sections otherwise", () => {
    const lesson: LessonDefinition = {
      ...LESSONS[0],
      sections: [
        { heading: "Earlier", body: "", circuit: createCircuit("x") },
        { heading: "Later", body: "", circuit: createCircuit("z") },
      ],
      successCondition: {
        type: "all",
        conditions: [
          {
            type: "any",
            conditions: [
              { type: "manual" },
              {
                type: "exactCircuitMatch",
                circuit: createCircuit("h"),
              },
            ],
          },
        ],
      },
    };

    expect(
      pickWalkthroughCircuit(lesson)?.operations[0].type
    ).toBe("h");

    const withoutExactMatch: LessonDefinition = {
      ...lesson,
      successCondition: { type: "manual" },
    };
    expect(
      pickWalkthroughCircuit(withoutExactMatch)?.operations[0].type
    ).toBe("z");
  });

  it("applies walkthrough and operation-order source priority on ties", () => {
    const bellLesson = LESSONS.find((item) => item.id === "build-bell-state")!;
    const sectionCircuit = createLinearCircuit(2);
    const lesson: LessonDefinition = {
      ...bellLesson,
      successCondition: {
        type: "operationOrder",
        operations: [
          { gate: "x", target: "q0" },
          { gate: "z", target: "q1" },
        ],
      },
      sections: [{ heading: "Section", body: "", circuit: sectionCircuit }],
    };

    expect(
      pickWalkthroughCircuit(lesson)?.operations.map((operation) => operation.type)
    ).toEqual(["h", "cx"]);

    const exactCircuit = createLinearCircuit(2);
    const exactLesson: LessonDefinition = {
      ...lesson,
      successCondition: { type: "exactCircuitMatch", circuit: exactCircuit },
    };
    expect(pickWalkthroughCircuit(exactLesson)).toBe(exactCircuit);

    const operationOrderLesson: LessonDefinition = {
      ...LESSONS[0],
      successCondition: {
        type: "operationOrder",
        operations: [{ gate: "x", target: "q0" }],
      },
      sections: [
        { heading: "Later", body: "", circuit: createCircuit("z") },
      ],
    };
    expect(
      pickWalkthroughCircuit(operationOrderLesson)?.operations[0].type
    ).toBe("x");
  });

  it("limits long circuits to the first seven and final execution layers", () => {
    const lesson: LessonDefinition = {
      ...LESSONS[0],
      successCondition: {
        type: "exactCircuitMatch",
        circuit: createLinearCircuit(10),
      },
      sections: [],
    };

    const walkthrough = buildLessonWalkthrough(lesson);
    expect(
      walkthrough.scenes
        .filter((scene) => scene.id.startsWith("step-"))
        .map((scene) => scene.snapshotStep)
    ).toEqual([1, 2, 3, 4, 5, 6, 7, 10]);
    expect(walkthrough.scenes.at(-2)?.title).toBe(
      "…and the rest of the circuit"
    );
  });

  it("synthesizes operation-order gates with defaults and required qubits", () => {
    const lesson: LessonDefinition = {
      ...LESSONS[0],
      starterCircuit: createEmptyCircuit("One qubit", 1),
      successCondition: {
        type: "operationOrder",
        operations: [{ gate: "rx", target: "q2" }],
      },
      sections: [],
    };

    const circuit = pickWalkthroughCircuit(lesson);
    expect(circuit?.qubits.map((qubit) => qubit.id)).toEqual([
      "q0",
      "q1",
      "q2",
    ]);
    expect(circuit?.operations[0]).toMatchObject({
      type: "rx",
      targets: ["q2"],
      column: 0,
      parameters: [{ value: Math.PI / 2, display: "pi/2" }],
    });
  });

  it("skips operation-order circuits with unknown gates or unresolved qubits", () => {
    const base: LessonDefinition = {
      ...LESSONS[0],
      starterCircuit: createEmptyCircuit("One qubit", 1),
      sections: [],
    };
    const unknownGate: LessonDefinition = {
      ...base,
      successCondition: {
        type: "operationOrder",
        operations: [{ gate: "not-a-gate", target: "q0" }],
      },
    };
    const unknownQubit: LessonDefinition = {
      ...base,
      successCondition: {
        type: "operationOrder",
        operations: [{ gate: "x", target: "ancilla" }],
      },
    };

    expect(pickWalkthroughCircuit(unknownGate)).toBeNull();
    expect(pickWalkthroughCircuit(unknownQubit)).toBeNull();
  });
});

describe("toSpeechText", () => {
  it("speaks kets, plus signs, and qubit identifiers", () => {
    expect(toSpeechText("|00⟩ + |11⟩")).toBe("ket 0 0 plus ket 1 1");
    expect(toSpeechText("|+⟩")).toBe("ket plus");
    expect(toSpeechText("|-⟩")).toBe("ket minus");
    expect(toSpeechText("Read q[0] and q3.")).toBe(
      "Read qubit 0 and qubit 3."
    );
    expect(toSpeechText("q[0]→q1")).toBe("qubit 0 to qubit 1");
  });

  it("speaks quantum symbols and removes markdown", () => {
    expect(toSpeechText("90°")).toBe("90 degrees");
    expect(toSpeechText("RX(π/2)")).toContain("pi");
    expect(toSpeechText("**State**: √X† is 25% of ψ.")).toBe(
      "State: square root of X dagger is 25 percent of psi."
    );
  });

  it("estimates scene durations within the supported range", () => {
    expect(estimateSceneMs("")).toBe(2500);
    expect(estimateSceneMs("one two")).toBe(2500);
    expect(estimateSceneMs("word ".repeat(4))).toBe(2500);
    expect(estimateSceneMs("word ".repeat(10))).toBe(3800);
    expect(estimateSceneMs("word ".repeat(40))).toBe(9000);
  });
});

function createCircuit(type: string) {
  const circuit = createEmptyCircuit(`${type} circuit`, 1);
  return {
    ...circuit,
    operations: [
      {
        id: `${type}-0`,
        type,
        label: type.toUpperCase(),
        targets: ["q0"],
        controls: [],
        classicalTargets: [],
        column: 0,
      },
    ],
  };
}

function createLinearCircuit(stepCount: number) {
  const circuit = createEmptyCircuit("Long circuit", 1);
  return {
    ...circuit,
    operations: Array.from({ length: stepCount }, (_, index) => ({
      id: `x-${index}`,
      type: "x",
      label: "X",
      targets: ["q0"],
      controls: [],
      classicalTargets: [],
      column: index,
    })),
  };
}

function containsOperationOrder(condition: CheckCondition): boolean {
  if (condition.type === "operationOrder") return true;
  if (condition.type === "all" || condition.type === "any") {
    return condition.conditions.some(containsOperationOrder);
  }
  return false;
}
