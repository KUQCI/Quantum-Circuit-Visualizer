import { describe, expect, it } from "vitest";
import animatedStoryboardsJson from "@/lib/learning/animated-storyboards.json";
import {
  animatedVideoTranscript,
  getAnimatedStoryboard,
  type AnimatedStoryboard,
} from "@/lib/learning/animated-videos";
import { LESSON_IDS } from "@/lib/learning/lessons";

const storyboards = animatedStoryboardsJson as unknown as {
  lessons: AnimatedStoryboard[];
};
const beatKinds = new Set([
  "title",
  "circuit",
  "histogram",
  "cards",
  "code",
  "outro",
]);
const supportedGates = new Set([
  "h",
  "x",
  "y",
  "z",
  "s",
  "sdg",
  "t",
  "tdg",
  "sx",
  "rx",
  "ry",
  "rz",
  "p",
  "cx",
  "cz",
  "cy",
  "swap",
  "ccx",
  "cp",
  "crz",
  "crx",
  "cry",
  "measure",
  "barrier",
]);

describe("animated lesson storyboards", () => {
  it("uses unique lesson ids that exist in the lesson catalog", () => {
    const lessonIds = storyboards.lessons.map((lesson) => lesson.id);
    expect(new Set(lessonIds).size).toBe(lessonIds.length);
    for (const lessonId of lessonIds) {
      expect(LESSON_IDS).toContain(lessonId);
    }
  });

  it("has unique beat ids and non-empty captions and speech", () => {
    for (const lesson of storyboards.lessons) {
      const beatIds = lesson.beats.map((beat) => beat.id);
      expect(new Set(beatIds).size).toBe(beatIds.length);
      for (const beat of lesson.beats) {
        expect(beat.caption.trim()).not.toBe("");
        expect(beat.speech.trim()).not.toBe("");
      }
    }
  });

  it("uses supported generic scene kinds and valid circuit data", () => {
    for (const lesson of storyboards.lessons) {
      for (const beat of lesson.beats) {
        const scene = beat.scene;
        expect(beatKinds.has(scene.kind)).toBe(true);
        if (scene.kind === "circuit") {
          const gates = (scene.gates ?? []) as Array<{ gate?: string }>;
          for (const gate of gates) {
            expect(supportedGates.has(gate.gate ?? "")).toBe(true);
          }
          const reveal = Number(scene.reveal ?? 0);
          const add = Number(scene.add ?? 0);
          expect(reveal + add).toBeLessThanOrEqual(gates.length);
          const panels = scene.panels as string[] | undefined;
          if (panels?.includes("bloch")) {
            expect(scene.qubits).toBe(1);
          }
        }
        if (scene.kind === "histogram") {
          const counts = scene.counts as Record<string, number>;
          expect(Object.keys(counts).length).toBeGreaterThan(0);
          for (const count of Object.values(counts)) {
            expect(Number.isInteger(count) && count > 0).toBe(true);
          }
        }
      }
    }
  });

  it("provides storyboard speech and returns null for lessons without one", () => {
    const moduleOneTranscript = animatedVideoTranscript("what-is-a-qubit");
    expect(moduleOneTranscript).toEqual(
      storyboards.lessons
        .find((lesson) => lesson.id === "what-is-a-qubit")
        ?.beats.map((beat) => beat.speech)
    );

    expect(animatedVideoTranscript("not-a-storyboarded-lesson")).toBeNull();
  });

  it("returns a typed storyboard for every lesson", () => {
    expect(storyboards.lessons).toHaveLength(36);
    for (const lesson of storyboards.lessons) {
      expect(getAnimatedStoryboard(lesson.id)).toEqual(lesson);
      expect(lesson.beats.every((beat) => beat.scene)).toBe(true);
    }
    expect(getAnimatedStoryboard("not-a-storyboarded-lesson")).toBeNull();
  });
});
