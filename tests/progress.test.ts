import { beforeEach, describe, expect, it } from "vitest";
import {
  DAILY_GOAL_XP,
  LEVEL_THRESHOLDS,
  LEVEL_TITLES,
  getLevelFromXp,
  getLevelTitle,
  levelQuantaVariant,
} from "@/lib/learning/progress";
import { useProgressStore } from "@/store/progress-store";

beforeEach(() => {
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
      algorithms: 0,
      phase: 0,
      qiskit: 0,
    },
    exportActionCount: 0,
    importActionCount: 0,
    projectSaved: false,
    hasEverPlacedGate: false,
    hasEverUsedControlledGate: false,
    dailyXp: {},
    quizFirstTryLessons: [],
    lastCelebratedLevel: 1,
    completedModules: [],
  });
});

describe("academy progress", () => {
  it("uses the twelve level thresholds and titles", () => {
    expect(LEVEL_THRESHOLDS).toHaveLength(12);
    expect(LEVEL_TITLES).toHaveLength(12);
    expect(getLevelFromXp(8500)).toBe(12);
    expect(getLevelTitle(12)).toBe("Quantum Architect");
    expect(levelQuantaVariant(1)).toBe("empty");
    expect(levelQuantaVariant(12)).toBe("success");
  });

  it("tracks daily XP and first-try quizzes", () => {
    const state = useProgressStore.getState();
    state.awardXp(25, "lesson");
    state.recordQuizResult("what-is-a-qubit", true);
    expect(useProgressStore.getState().totalXp).toBe(25);
    expect(useProgressStore.getState().quizFirstTryLessons).toEqual([
      "what-is-a-qubit",
    ]);
    expect(Object.values(useProgressStore.getState().dailyXp)).toContain(25);
    expect(DAILY_GOAL_XP).toBe(50);
  });

  it("detects level-up progress and can mark it celebrated", () => {
    const state = useProgressStore.getState();
    state.awardXp(100, "level test");
    expect(state.getLevel()).toBe(2);
    useProgressStore.getState().markLevelCelebrated(2);
    expect(useProgressStore.getState().lastCelebratedLevel).toBe(2);
  });
});
