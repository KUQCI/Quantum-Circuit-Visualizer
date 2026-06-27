import { describe, expect, it } from "vitest";
import {
  getNextLesson,
  getNextChallenge,
  getRelatedChallenge,
  getRelatedLesson,
  getAchievementHint,
  getBeginnerChallenge,
} from "@/lib/navigation/flow";

describe("navigation flow", () => {
  it("returns first incomplete lesson", () => {
    const next = getNextLesson([]);
    expect(next?.id).toBe("what-is-a-qubit");
  });

  it("skips completed lessons", () => {
    const next = getNextLesson(["what-is-a-qubit"]);
    expect(next?.id).toBe("add-first-gate");
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
});
