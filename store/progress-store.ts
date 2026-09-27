"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ACHIEVEMENTS, evaluateAchievements } from "@/lib/learning/achievements";
import { LESSONS } from "@/lib/learning/lessons";
import {
  getLevelFromXp,
  MODULE_IDS,
  updateStreak,
} from "@/lib/learning/progress";
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
  dailyXp: Record<string, number>;
  quizFirstTryLessons: string[];
  lastCelebratedLevel: number;
  completedModules: string[];

  recordActivity: () => void;
  completeLesson: (id: string, xp: number, skills?: SkillTag[]) => boolean;
  completeChallenge: (id: string, xp: number) => boolean;
  recordQuizResult: (lessonId: string, firstTry: boolean) => void;
  awardXp: (amount: number, reason: string) => void;
  markLevelCelebrated: (level: number) => void;
  recordExport: () => void;
  recordImport: () => void;
  recordGatePlaced: (hasControlled?: boolean) => void;
  recordProjectSaved: () => void;
  isLessonComplete: (id: string) => boolean;
  isChallengeComplete: (id: string) => boolean;
  isAchievementUnlocked: (id: string) => boolean;
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

function todayKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function sanitizeDailyXp(value: unknown): Record<string, number> {
  if (!value || typeof value !== "object") return {};
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 13);
  const result: Record<string, number> = {};
  for (const [date, amount] of Object.entries(value)) {
    const parsed = new Date(`${date}T12:00:00`);
    if (!Number.isNaN(parsed.getTime()) && parsed >= cutoff) {
      result[date] = Math.max(0, asNumber(amount, 0));
    }
  }
  return result;
}

function completedModulesFor(completedLessons: string[]): string[] {
  return MODULE_IDS.filter((module) => {
    const lessons = LESSONS.filter((lesson) => lesson.module === module);
    return lessons.length > 0 && lessons.every((lesson) => completedLessons.includes(lesson.id));
  });
}

function addXp(
  state: Pick<ProgressState, "totalXp" | "dailyXp">,
  amount: number
): { totalXp: number; dailyXp: Record<string, number> } {
  const safeAmount = Math.max(0, Math.round(amount));
  const dailyXp = sanitizeDailyXp(state.dailyXp);
  if (!safeAmount) return { totalXp: state.totalXp, dailyXp };
  const date = todayKey();
  dailyXp[date] = (dailyXp[date] ?? 0) + safeAmount;
  return {
    totalXp: state.totalXp + safeAmount,
    dailyXp,
  };
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
      completedModules: state.completedModules,
      firstTryQuizzes: state.quizFirstTryLessons.length,
      currentStreak: state.currentStreak,
      completedLessonsCount: state.completedLessons.length,
    },
    state.unlockedAchievements
  );

  if (newly.length === 0) return;

  const achievementXp = newly.reduce(
    (sum, id) => sum + (ACHIEVEMENTS.find((achievement) => achievement.id === id)?.xpReward ?? 0),
    0
  );
  const xp = addXp(state, achievementXp);
  set({
    unlockedAchievements: [...state.unlockedAchievements, ...newly],
    ...xp,
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

      recordActivity: () => {
        const { lastActiveDate, currentStreak } = get();
        const updated = updateStreak(lastActiveDate, currentStreak);
        set({
          currentStreak: updated.streak,
          lastActiveDate: updated.lastActiveDate,
        });
        checkAchievements(get, set);
      },

      awardXp: (amount, reason) => {
        void reason;
        set(addXp(get(), amount));
      },

      completeLesson: (id, xp, skills = []) => {
        const state = get();
        if (state.completedLessons.includes(id)) return false;

        set({
          completedLessons: [...state.completedLessons, id],
          skillXp: addSkillXp(state.skillXp, skills, xp),
          completedModules: completedModulesFor([...state.completedLessons, id]),
        });
        get().awardXp(xp, `Complete ${id}`);
        get().recordActivity();
        checkAchievements(get, set);
        return true;
      },

      completeChallenge: (id, xp) => {
        const state = get();
        if (state.completedChallenges.includes(id)) return false;

        set({
          completedChallenges: [...state.completedChallenges, id],
        });
        get().awardXp(xp, `Complete ${id}`);
        get().recordActivity();
        checkAchievements(get, set);
        return true;
      },

      recordQuizResult: (lessonId, firstTry) => {
        if (!firstTry || get().quizFirstTryLessons.includes(lessonId)) return;
        set({
          quizFirstTryLessons: [...get().quizFirstTryLessons, lessonId],
        });
        checkAchievements(get, set);
      },

      markLevelCelebrated: (level) => {
        set({ lastCelebratedLevel: Math.max(1, Math.round(level)) });
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
          | "dailyXp"
          | "quizFirstTryLessons"
          | "lastCelebratedLevel"
          | "completedModules"
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
          dailyXp: sanitizeDailyXp(saved.dailyXp),
          quizFirstTryLessons: asStringArray(saved.quizFirstTryLessons),
          lastCelebratedLevel: asNumber(
            saved.lastCelebratedLevel,
            current.lastCelebratedLevel
          ),
          completedModules: asStringArray(saved.completedModules),
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
