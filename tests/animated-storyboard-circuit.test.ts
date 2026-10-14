import { describe, expect, it } from "vitest";
import {
  getAnimatedStoryboard,
  storyboardSceneToCircuit,
} from "@/lib/learning/animated-videos";
import { computeStepSnapshots } from "@/lib/step-explanations";

function circuitBeat(lessonId: string, beatId: string) {
  const beat = getAnimatedStoryboard(lessonId)?.beats.find(
    (candidate) => candidate.id === beatId
  );
  if (!beat || beat.scene.kind !== "circuit") {
    throw new Error(`Missing circuit beat ${lessonId}/${beatId}`);
  }
  return storyboardSceneToCircuit(beat.scene);
}

describe("storyboard circuit conversion", () => {
  it("converts the superposition H gate and simulates balanced probabilities", () => {
    const circuit = circuitBeat("create-superposition", "place-h");
    const operation = circuit.operations[0];

    expect(operation).toMatchObject({
      type: "h",
      targets: ["q0"],
      controls: [],
    });
    const probabilities =
      computeStepSnapshots(circuit).at(-1)?.after.probabilities;
    expect(probabilities?.map(({ label }) => label)).toEqual(["|0⟩", "|1⟩"]);
    probabilities?.forEach(({ probability }) => {
      expect(probability).toBeCloseTo(0.5);
    });
  });

  it("converts the Bell-state CNOT control and target", () => {
    const circuit = circuitBeat("build-bell-state", "step-cx");

    expect(circuit.operations.map((operation) => operation.type)).toEqual([
      "h",
      "cx",
    ]);
    expect(circuit.operations[1]).toMatchObject({
      targets: ["q1"],
      controls: ["q0"],
    });
  });

  it("converts a parameterized rotation", () => {
    const circuit = circuitBeat("rotate-with-rx", "quarter-turn");

    expect(circuit.operations[0]).toMatchObject({
      type: "rx",
      targets: ["q0"],
      controls: [],
      parameters: [{ value: Math.PI / 2 }],
    });
  });
});
