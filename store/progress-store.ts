"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ACHIEVEMENTS, evaluateAchievements } from "@/lib/learning/achievements";
import {
  getLevelFromXp,
  updateStreak,
} from "@/lib/learning/progress";
import type { SkillTag } from "@/lib/learning/types";
import {
  completedModulesFor,
  mergeProgress,
  sanitizeDailyXp,
  sanitizeQuizHistory,
  sanitizeProgressSnapshot,
  sanitizeSkillXp,
} from "@/lib/learning/progress-backup";
import {
  asBoolean,
  asNumber,
  asStringArray,
  createSafeJsonStorage,
} from "@/lib/safe-persist";

export { completedModulesFor };

export interface PersistedProgress {
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
  quizHistory: Record<string, QuizHistoryEntry>;
  sandboxCompleted: number;
}

export interface QuizHistoryEntry {
  box: 0 | 1 | 2 | 3;
  due: string;
  correct: number;
  wrong: number;
}

interface ProgressState extends PersistedProgress {
  recordActivity: () => void;
  completeLesson: (id: string, xp: number, skills?: SkillTag[]) => boolean;
  completeChallenge: (id: string, xp: number) => boolean;
  recordQuizResult: (lessonId: string, firstTry: boolean) => void;
  recordQuizAnswer: (
    lessonId: string,
    questionId: string,
    correct: boolean,
    today?: string
  ) => void;
  recordSandboxCompleted: () => void;
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
  exportSnapshot: () => PersistedProgress;
  restoreSnapshot: (
    snapshot: PersistedProgress,
    mode: "replace" | "merge"
  ) => void;
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

export function todayIso(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function addXp(
  state: Pick<ProgressState, "totalXp" | "dailyXp">,
  amount: number
): { totalXp: number; dailyXp: Record<string, number> } {
  const safeAmount = Math.max(0, Math.round(amount));
  const dailyXp = sanitizeDailyXp(state.dailyXp);
  if (!safeAmount) return { totalXp: state.totalXp, dailyXp };
  const date = todayIso();
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
        qml: 0,
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
      quizHistory: {},
      sandboxCompleted: 0,

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

      recordQuizAnswer: (lessonId, questionId, correct, today = todayIso()) => {
        const key = `${lessonId}:${questionId}`;
        const previous = get().quizHistory[key];
        const previousBox =
          previous && previous.box >= 0 && previous.box <= 3 ? previous.box : 0;
        const box = correct
          ? (Math.min(3, previousBox + 1) as 0 | 1 | 2 | 3)
          : 0;
        const intervalDays = [1, 3, 7, 14][box];
        const dueDate = new Date(`${today}T12:00:00`);
        dueDate.setDate(dueDate.getDate() + intervalDays);
        const due = `${dueDate.getFullYear()}-${String(
          dueDate.getMonth() + 1
        ).padStart(2, "0")}-${String(dueDate.getDate()).padStart(2, "0")}`;
        set({
          quizHistory: {
            ...get().quizHistory,
            [key]: {
              box,
              due,
              correct: (previous?.correct ?? 0) + (correct ? 1 : 0),
              wrong: (previous?.wrong ?? 0) + (correct ? 0 : 1),
            },
          },
        });
      },

      recordSandboxCompleted: () => {
        set({ sandboxCompleted: get().sandboxCompleted + 1 });
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

      exportSnapshot: () => {
        const state = get();
        return {
          totalXp: state.totalXp,
          completedLessons: [...state.completedLessons],
          completedChallenges: [...state.completedChallenges],
          unlockedAchievements: [...state.unlockedAchievements],
          currentStreak: state.currentStreak,
          lastActiveDate: state.lastActiveDate,
          skillXp: { ...state.skillXp },
          exportActionCount: state.exportActionCount,
          importActionCount: state.importActionCount,
          projectSaved: state.projectSaved,
          hasEverPlacedGate: state.hasEverPlacedGate,
          hasEverUsedControlledGate: state.hasEverUsedControlledGate,
          dailyXp: { ...state.dailyXp },
          quizFirstTryLessons: [...state.quizFirstTryLessons],
          lastCelebratedLevel: state.lastCelebratedLevel,
          completedModules: [...state.completedModules],
          quizHistory: structuredClone(state.quizHistory),
          sandboxCompleted: state.sandboxCompleted,
        };
      },

      restoreSnapshot: (snapshot, mode) => {
        const next =
          mode === "merge"
            ? mergeProgress(get().exportSnapshot(), snapshot)
            : sanitizeProgressSnapshot(snapshot);
        set(next);
        checkAchievements(get, set);
      },
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
          | "quizHistory"
          | "sandboxCompleted"
        >
      >(),
      merge: (persisted, current) => {
        const saved = persisted as Partial<ProgressState> | undefined;
        if (!saved) return current;

        const skillXp = sanitizeSkillXp(saved.skillXp, current.skillXp);

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
          hasEverPlacedGate: asBoolean(
            saved.hasEverPlacedGate,
            current.hasEverPlacedGate
          ),
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
          quizHistory: sanitizeQuizHistory(saved.quizHistory),
          sandboxCompleted: asNumber(saved.sandboxCompleted, current.sandboxCompleted),
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
