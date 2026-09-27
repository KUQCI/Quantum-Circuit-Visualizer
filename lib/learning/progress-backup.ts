import type { Project } from "@/store/circuit-store";
import type { PersistedProgress } from "@/store/progress-store";
import type { SkillTag } from "@/lib/learning/types";
import { LESSONS } from "@/lib/learning/lessons";
import { MODULE_IDS } from "@/lib/learning/progress";
import { asBoolean, asNumber, asStringArray } from "@/lib/safe-persist";
import { prepareCircuit } from "@/lib/circuit-guard";
import { validateCircuit } from "@/lib/validation";

export const PROGRESS_BACKUP_VERSION = 1;

export interface ProgressBackup {
  kind: "qci-progress-backup";
  version: 1;
  exportedAt: string;
  progress: PersistedProgress;
  projects: Project[];
}

const SKILL_TAGS: SkillTag[] = [
  "qubits",
  "gates",
  "measurement",
  "entanglement",
  "qiskit",
  "algorithms",
  "phase",
];

function nonNegativeNumber(value: unknown, fallback: number): number {
  return Math.max(0, asNumber(value, fallback));
}

export function sanitizeDailyXp(value: unknown): Record<string, number> {
  if (!value || typeof value !== "object") return {};
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 13);
  const result: Record<string, number> = {};
  for (const [date, amount] of Object.entries(value)) {
    const parsed = new Date(`${date}T12:00:00`);
    if (!Number.isNaN(parsed.getTime()) && parsed >= cutoff) {
      result[date] = nonNegativeNumber(amount, 0);
    }
  }
  return result;
}

export function sanitizeSkillXp(
  value: unknown,
  fallback: Record<SkillTag, number> = Object.fromEntries(
    SKILL_TAGS.map((skill) => [skill, 0])
  ) as Record<SkillTag, number>
): Record<SkillTag, number> {
  const result = { ...fallback };
  if (!value || typeof value !== "object") return result;
  for (const skill of SKILL_TAGS) {
    result[skill] = nonNegativeNumber(
      (value as Record<string, unknown>)[skill],
      result[skill] ?? 0
    );
  }
  return result;
}

export function completedModulesFor(completedLessons: string[]): string[] {
  return MODULE_IDS.filter((module) => {
    const lessons = LESSONS.filter((lesson) => lesson.module === module);
    return (
      lessons.length > 0 &&
      lessons.every((lesson) => completedLessons.includes(lesson.id))
    );
  });
}

export function sanitizeProjects(value: unknown): Project[] {
  if (!Array.isArray(value)) return [];
  const projects: Project[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const record = item as Partial<Project>;
    if (typeof record.id !== "string" || typeof record.name !== "string") {
      continue;
    }
    const circuitResult = validateCircuit(record.circuit);
    if (!circuitResult.valid) continue;
    const now = new Date().toISOString();
    projects.push({
      id: record.id,
      name: record.name,
      circuit: prepareCircuit(circuitResult.circuit),
      createdAt: typeof record.createdAt === "string" ? record.createdAt : now,
      updatedAt: typeof record.updatedAt === "string" ? record.updatedAt : now,
    });
  }
  return projects;
}

function sanitizeProgress(value: unknown): PersistedProgress {
  const record =
    value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : {};
  const completedLessons = asStringArray(record.completedLessons);
  return {
    totalXp: nonNegativeNumber(record.totalXp, 0),
    completedLessons,
    completedChallenges: asStringArray(record.completedChallenges),
    unlockedAchievements: asStringArray(record.unlockedAchievements),
    currentStreak: nonNegativeNumber(record.currentStreak, 0),
    lastActiveDate:
      typeof record.lastActiveDate === "string" ? record.lastActiveDate : null,
    skillXp: sanitizeSkillXp(record.skillXp),
    exportActionCount: nonNegativeNumber(record.exportActionCount, 0),
    importActionCount: nonNegativeNumber(record.importActionCount, 0),
    projectSaved: asBoolean(record.projectSaved, false),
    hasEverPlacedGate: asBoolean(record.hasEverPlacedGate, false),
    hasEverUsedControlledGate: asBoolean(
      record.hasEverUsedControlledGate,
      false
    ),
    dailyXp: sanitizeDailyXp(record.dailyXp),
    quizFirstTryLessons: asStringArray(record.quizFirstTryLessons),
    lastCelebratedLevel: nonNegativeNumber(record.lastCelebratedLevel, 1),
    completedModules: completedModulesFor(completedLessons),
  };
}

export function createProgressBackup(
  progress: PersistedProgress,
  projects: Project[]
): ProgressBackup {
  return {
    kind: "qci-progress-backup",
    version: PROGRESS_BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    progress: sanitizeProgress(progress),
    projects: sanitizeProjects(projects),
  };
}

export function parseProgressBackup(
  raw: string
): { ok: true; backup: ProgressBackup } | { ok: false; error: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, error: "Not valid JSON" };
  }

  if (!parsed || typeof parsed !== "object") {
    return { ok: false, error: "Not a QCI progress backup" };
  }
  const record = parsed as Record<string, unknown>;
  if (record.kind !== "qci-progress-backup") {
    return { ok: false, error: "Not a QCI progress backup" };
  }
  if (record.version !== PROGRESS_BACKUP_VERSION) {
    return { ok: false, error: "Unsupported backup version" };
  }
  if (
    !record.progress ||
    typeof record.progress !== "object" ||
    Array.isArray(record.progress)
  ) {
    return { ok: false, error: "Backup is missing progress data" };
  }
  if (!Array.isArray(record.projects)) {
    return { ok: false, error: "Backup is missing project data" };
  }

  return {
    ok: true,
    backup: {
      kind: "qci-progress-backup",
      version: 1,
      exportedAt:
        typeof record.exportedAt === "string"
          ? record.exportedAt
          : new Date().toISOString(),
      progress: sanitizeProgress(record.progress),
      projects: sanitizeProjects(record.projects),
    },
  };
}

function union(current: string[], incoming: string[]): string[] {
  return Array.from(new Set([...current, ...incoming]));
}

function mergeStreakPair(
  current: Pick<PersistedProgress, "currentStreak" | "lastActiveDate">,
  incoming: Pick<PersistedProgress, "currentStreak" | "lastActiveDate">
): Pick<PersistedProgress, "currentStreak" | "lastActiveDate"> {
  if (!current.lastActiveDate && !incoming.lastActiveDate) {
    return {
      currentStreak: Math.max(current.currentStreak, incoming.currentStreak),
      lastActiveDate: null,
    };
  }
  if (!current.lastActiveDate) {
    return {
      currentStreak: incoming.currentStreak,
      lastActiveDate: incoming.lastActiveDate,
    };
  }
  if (!incoming.lastActiveDate) {
    return {
      currentStreak: current.currentStreak,
      lastActiveDate: current.lastActiveDate,
    };
  }

  const currentTime = Date.parse(current.lastActiveDate);
  const incomingTime = Date.parse(incoming.lastActiveDate);
  if (Number.isNaN(currentTime)) {
    return Number.isNaN(incomingTime)
      ? {
          currentStreak: Math.max(
            current.currentStreak,
            incoming.currentStreak
          ),
          lastActiveDate: current.lastActiveDate,
        }
      : incoming;
  }
  if (Number.isNaN(incomingTime) || currentTime > incomingTime) {
    return current;
  }
  if (incomingTime > currentTime) {
    return incoming;
  }
  return {
    currentStreak: Math.max(current.currentStreak, incoming.currentStreak),
    lastActiveDate: current.lastActiveDate,
  };
}

export function mergeProgress(
  current: PersistedProgress,
  incoming: PersistedProgress
): PersistedProgress {
  const currentSafe = sanitizeProgress(current);
  const incomingSafe = sanitizeProgress(incoming);
  const completedLessons = union(
    currentSafe.completedLessons,
    incomingSafe.completedLessons
  );
  const skillXp = { ...currentSafe.skillXp };
  for (const skill of SKILL_TAGS) {
    skillXp[skill] = Math.max(
      currentSafe.skillXp[skill] ?? 0,
      incomingSafe.skillXp[skill] ?? 0
    );
  }
  const dailyXp = { ...currentSafe.dailyXp };
  for (const [date, amount] of Object.entries(incomingSafe.dailyXp)) {
    dailyXp[date] = Math.max(dailyXp[date] ?? 0, amount);
  }
  const streakPair = mergeStreakPair(currentSafe, incomingSafe);

  return {
    totalXp: Math.max(currentSafe.totalXp, incomingSafe.totalXp),
    completedLessons,
    completedChallenges: union(
      currentSafe.completedChallenges,
      incomingSafe.completedChallenges
    ),
    unlockedAchievements: union(
      currentSafe.unlockedAchievements,
      incomingSafe.unlockedAchievements
    ),
    currentStreak: streakPair.currentStreak,
    lastActiveDate: streakPair.lastActiveDate,
    skillXp,
    exportActionCount: Math.max(
      currentSafe.exportActionCount,
      incomingSafe.exportActionCount
    ),
    importActionCount: Math.max(
      currentSafe.importActionCount,
      incomingSafe.importActionCount
    ),
    projectSaved: currentSafe.projectSaved || incomingSafe.projectSaved,
    hasEverPlacedGate:
      currentSafe.hasEverPlacedGate || incomingSafe.hasEverPlacedGate,
    hasEverUsedControlledGate:
      currentSafe.hasEverUsedControlledGate ||
      incomingSafe.hasEverUsedControlledGate,
    dailyXp,
    quizFirstTryLessons: union(
      currentSafe.quizFirstTryLessons,
      incomingSafe.quizFirstTryLessons
    ),
    lastCelebratedLevel: Math.max(
      currentSafe.lastCelebratedLevel,
      incomingSafe.lastCelebratedLevel
    ),
    completedModules: completedModulesFor(completedLessons),
  };
}

export function sanitizeProgressSnapshot(
  value: unknown
): PersistedProgress {
  return sanitizeProgress(value);
}
