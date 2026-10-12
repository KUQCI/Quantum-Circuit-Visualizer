import { describe, expect, it } from "vitest";
import {
  getNextLesson,
  getNextChallenge,
  getRelatedChallenge,
  getRelatedLesson,
  getAchievementHint,
  getBeginnerChallenge,
  getLandingLessonCta,
} from "@/lib/navigation/flow";

describe("navigation flow", () => {
  it("returns first incomplete lesson", () => {
    const next = getNextLesson([]);
    expect(next?.id).toBe("what-is-a-qubit");
  });

  it("skips completed lessons", () => {
    const next = getNextLesson(["what-is-a-qubit"]);
    expect(next?.id).toBe("bits-vs-qubits");
  });

  it("returns next challenge when tier unlocked", () => {
    const next = getNextChallenge([], []);
    expect(next?.id).toBe("superposition-sprint");
  });

  it("maps related lesson and challenge", () => {
    expect(getRelatedChallenge("create-superposition")?.id).toBe(
      "superposition-sprint"
    );
    expect(getRelatedLesson("pauli-flip")?.id).toBe("flip-with-x");
  });

  it("provides achievement hints", () => {
    expect(getAchievementHint("pauli-pro")?.href).toBe("/challenges/pauli-flip");
  });

  it("returns null when all beginner challenges complete", () => {
    const beginnerIds = [
      "superposition-sprint",
      "pauli-flip",
      "measurement-check",
    ];
    expect(getBeginnerChallenge([], beginnerIds)).toBeNull();
  });

  it("points new learners at lesson 1 on the landing page", () => {
    const cta = getLandingLessonCta([]);
    expect(cta.href).toBe("/learn/what-is-a-qubit");
    expect(cta.returning).toBe(false);
    expect(cta.detail).toContain("Lesson 1");
  });

  it("points returning learners at their next lesson", () => {
    const cta = getLandingLessonCta(["what-is-a-qubit"]);
    expect(cta.href).toBe("/learn/bits-vs-qubits");
    expect(cta.returning).toBe(true);
    expect(cta.label).toBe("Continue learning");
  });
});
