import { beforeEach, describe, expect, it } from "vitest";
import { useProgressStore } from "@/store/progress-store";

function resetProgress() {
  useProgressStore.setState({
    totalXp: 0,
    completedLessons: [],
    completedChallenges: [],
    unlockedAchievements: [],
    currentStreak: 0,
    lastActiveDate: null,
    skillXp: {
      qubits: 0,
      gates: 0,
      measurement: 0,
      entanglement: 0,
      qiskit: 0,
    },
    exportActionCount: 0,
    importActionCount: 0,
    projectSaved: false,
    hasEverPlacedGate: false,
    hasEverUsedControlledGate: false,
  });
}

describe("XP awarding", () => {
  beforeEach(() => {
    resetProgress();
  });

  it("awards lesson XP only once", () => {
    const first = useProgressStore
      .getState()
      .completeLesson("what-is-a-qubit", 50, ["qubits"]);
    expect(first).toBe(true);
    expect(useProgressStore.getState().totalXp).toBeGreaterThanOrEqual(50);

    const xpAfterFirst = useProgressStore.getState().totalXp;
    const second = useProgressStore
      .getState()
      .completeLesson("what-is-a-qubit", 50, ["qubits"]);
    expect(second).toBe(false);
    expect(useProgressStore.getState().totalXp).toBe(xpAfterFirst);
    expect(useProgressStore.getState().completedLessons).toEqual([
      "what-is-a-qubit",
    ]);
  });

  it("awards challenge XP only once", () => {
    const first = useProgressStore
      .getState()
      .completeChallenge("superposition-sprint", 40);
    expect(first).toBe(true);
    const xpAfterFirst = useProgressStore.getState().totalXp;

    const second = useProgressStore
      .getState()
      .completeChallenge("superposition-sprint", 40);
    expect(second).toBe(false);
    expect(useProgressStore.getState().totalXp).toBe(xpAfterFirst);
  });
});
