"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { evaluateAchievements } from "@/lib/learning/achievements";
import { getLevelFromXp, updateStreak } from "@/lib/learning/progress";
import type { SkillTag } from "@/lib/learning/types";
import {
  asBoolean,
  asNumber,
  asStringArray,
  createSafeJsonStorage,
} from "@/lib/safe-persist";

interface ProgressState {
  totalXp: number;
  completedLessons: string[];
  completedChallenges: string[];
  unlockedAchievements: string[];
  currentStreak: number;
  lastActiveDate: string | null;
  skillXp: Record<SkillTag, number>;
  exportActionCount: number;
  importActionCount: number;
  projectSaved: boolean;
  hasEverPlacedGate: boolean;
  hasEverUsedControlledGate: boolean;

  recordActivity: () => void;
  completeLesson: (id: string, xp: number, skills?: SkillTag[]) => boolean;
  completeChallenge: (id: string, xp: number) => boolean;
  recordExport: () => void;
  recordImport: () => void;
  recordGatePlaced: (hasControlled?: boolean) => void;
  recordProjectSaved: () => void;
  isLessonComplete: (id: string) => boolean;
  isChallengeComplete: (id: string) => boolean;
  isAchievementUnlocked: (id: string) => boolean;
  isLessonUnlocked: (lessonId: string, order: number) => boolean;
  isChallengeUnlocked: (
    challengeId: string,
    difficulty: "beginner" | "intermediate" | "advanced",
    order: number
  ) => boolean;
  getLevel: () => number;
}

function addSkillXp(
  current: Record<SkillTag, number>,
  skills: SkillTag[],
  xp: number
): Record<SkillTag, number> {
  const next = { ...current };
  const perSkill = Math.ceil(xp / Math.max(skills.length, 1));
  for (const s of skills) {
    next[s] = (next[s] ?? 0) + perSkill;
  }
  return next;
}

function checkAchievements(get: () => ProgressState, set: (p: Partial<ProgressState>) => void) {
  const state = get();
  const newly = evaluateAchievements(
    {
      completedLessons: state.completedLessons,
      completedChallenges: state.completedChallenges,
      hasAnyGate: state.hasEverPlacedGate,
      hasControlledGate: state.hasEverUsedControlledGate,
      exportDone: state.exportActionCount > 0,
      importDone: state.importActionCount > 0,
      projectSaved: state.projectSaved,
    },
    state.unlockedAchievements
  );

  if (newly.length === 0) return;

  const achievementXp = newly.length * 10;
  set({
    unlockedAchievements: [...state.unlockedAchievements, ...newly],
    totalXp: state.totalXp + achievementXp,
  });
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
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

      recordActivity: () => {
        const { lastActiveDate, currentStreak } = get();
        const updated = updateStreak(lastActiveDate, currentStreak);
        set(updated);
      },

      completeLesson: (id, xp, skills = []) => {
        const state = get();
        if (state.completedLessons.includes(id)) return false;

        set({
          completedLessons: [...state.completedLessons, id],
          totalXp: state.totalXp + xp,
          skillXp: addSkillXp(state.skillXp, skills, xp),
        });
        get().recordActivity();
        checkAchievements(get, set);
        return true;
      },

      completeChallenge: (id, xp) => {
        const state = get();
        if (state.completedChallenges.includes(id)) return false;

        set({
          completedChallenges: [...state.completedChallenges, id],
          totalXp: state.totalXp + xp,
        });
        get().recordActivity();
        checkAchievements(get, set);
        return true;
      },

      recordExport: () => {
        set({ exportActionCount: get().exportActionCount + 1 });
        checkAchievements(get, set);
      },

      recordImport: () => {
        set({ importActionCount: get().importActionCount + 1 });
        checkAchievements(get, set);
      },

      recordGatePlaced: (hasControlled = false) => {
        set({
          hasEverPlacedGate: true,
          hasEverUsedControlledGate:
            get().hasEverUsedControlledGate || hasControlled,
        });
        checkAchievements(get, set);
      },

      recordProjectSaved: () => {
        set({ projectSaved: true });
        checkAchievements(get, set);
      },

      isLessonComplete: (id) => get().completedLessons.includes(id),

      isChallengeComplete: (id) => get().completedChallenges.includes(id),

      isAchievementUnlocked: (id) => get().unlockedAchievements.includes(id),

      isLessonUnlocked: (_lessonId, order) => {
        if (order <= 1) return true;
        const prev = get().completedLessons;
        const lessons = order - 1;
        return prev.length >= lessons - 1 || order <= prev.length + 1;
      },

      isChallengeUnlocked: (_id, difficulty, order) => {
        const state = get();
        if (difficulty === "beginner") return true;
        if (difficulty === "intermediate") {
          return state.completedLessons.length >= 3 || order <= 2;
        }
        return state.completedLessons.length >= 6 || state.completedChallenges.length >= 4;
      },

      getLevel: () => getLevelFromXp(get().totalXp),
    }),
    {
      name: "qiskit-visualizer-progress",
      storage: createSafeJsonStorage<
        Pick<
          ProgressState,
          | "totalXp"
          | "completedLessons"
          | "completedChallenges"
          | "unlockedAchievements"
          | "currentStreak"
          | "lastActiveDate"
          | "skillXp"
          | "exportActionCount"
          | "importActionCount"
          | "projectSaved"
          | "hasEverPlacedGate"
          | "hasEverUsedControlledGate"
        >
      >(),
      merge: (persisted, current) => {
        const saved = persisted as Partial<ProgressState> | undefined;
        if (!saved) return current;

        const skillXp = { ...current.skillXp };
        if (saved.skillXp && typeof saved.skillXp === "object") {
          for (const key of Object.keys(skillXp) as SkillTag[]) {
            const value = (saved.skillXp as Record<string, unknown>)[key];
            skillXp[key] = asNumber(value, skillXp[key]);
          }
        }

        return {
          ...current,
          totalXp: asNumber(saved.totalXp, current.totalXp),
          completedLessons: asStringArray(saved.completedLessons),
          completedChallenges: asStringArray(saved.completedChallenges),
          unlockedAchievements: asStringArray(saved.unlockedAchievements),
          currentStreak: asNumber(saved.currentStreak, current.currentStreak),
          lastActiveDate:
            typeof saved.lastActiveDate === "string" ? saved.lastActiveDate : null,
          skillXp,
          exportActionCount: asNumber(saved.exportActionCount, current.exportActionCount),
          importActionCount: asNumber(saved.importActionCount, current.importActionCount),
          projectSaved: asBoolean(saved.projectSaved, current.projectSaved),
          hasEverPlacedGate: asBoolean(saved.hasEverPlacedGate, current.hasEverPlacedGate),
          hasEverUsedControlledGate: asBoolean(
            saved.hasEverUsedControlledGate,
            current.hasEverUsedControlledGate
          ),
        };
      },
    }
  )
);

/** Sequential lesson unlock: previous lesson must be complete */
export function isLessonUnlockedByOrder(
  lessonId: string,
  lessonOrder: number,
  completedLessons: string[],
  allLessonIds: { id: string; order: number }[]
): boolean {
  if (lessonOrder <= 1) return true;
  const prev = allLessonIds.find((l) => l.order === lessonOrder - 1);
  if (!prev) return true;
  return completedLessons.includes(prev.id);
}

/** Challenge tier unlock */
export function isChallengeUnlockedByTier(
  difficulty: "beginner" | "intermediate" | "advanced",
  completedLessons: string[],
  completedChallenges: string[]
): boolean {
  if (difficulty === "beginner") return true;
  if (difficulty === "intermediate") return completedLessons.length >= 3;
  return completedLessons.length >= 6 && completedChallenges.length >= 2;
}
