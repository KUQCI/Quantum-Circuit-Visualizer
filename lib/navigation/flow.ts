import type { Project } from "@/store/circuit-store";
import {
  isChallengeUnlockedByTier,
  isLessonUnlockedByOrder,
} from "@/store/progress-store";
import { CHALLENGES, getChallengeById } from "@/lib/learning/challenges";
import { LESSONS, getLessonById } from "@/lib/learning/lessons";
import { MODULE_LABELS } from "@/lib/learning/progress";
import type { ChallengeDefinition, LessonDefinition } from "@/lib/learning/types";

const LESSON_ORDER = [...LESSONS].sort((a, b) => a.order - b.order);
const CHALLENGE_ORDER = [...CHALLENGES].sort((a, b) => a.order - b.order);

const LESSON_TO_CHALLENGE: Record<string, string> = {
  "create-superposition": "superposition-sprint",
  "flip-with-x": "pauli-flip",
  "measure-a-qubit": "measurement-check",
  "build-bell-state": "bell-pair-builder",
  "entangle-two-qubits": "bell-pair-builder",
  "export-first-qiskit": "canvas-to-qiskit-code",
  "import-qiskit-visualize": "qiskit-code-to-canvas",
};

const CHALLENGE_TO_LESSON: Record<string, string> = Object.fromEntries(
  Object.entries(LESSON_TO_CHALLENGE).map(([lesson, challenge]) => [challenge, lesson])
);

export interface ContinueTargets {
  lesson: LessonDefinition | null;
  challenge: ChallengeDefinition | null;
  project: Project | null;
}

export function getNextLesson(completedLessons: string[]): LessonDefinition | null {
  const allIds = LESSON_ORDER.map((l) => ({ id: l.id, order: l.order }));
  for (const lesson of LESSON_ORDER) {
    if (completedLessons.includes(lesson.id)) continue;
    if (isLessonUnlockedByOrder(lesson.id, lesson.order, completedLessons, allIds)) {
      return lesson;
    }
  }
  return null;
}

export function getNextChallenge(
  completedLessons: string[],
  completedChallenges: string[]
): ChallengeDefinition | null {
  for (const challenge of CHALLENGE_ORDER) {
    if (completedChallenges.includes(challenge.id)) continue;
    if (
      isChallengeUnlockedByTier(
        challenge.difficulty,
        completedLessons,
        completedChallenges
      )
    ) {
      return challenge;
    }
  }
  return null;
}

export function getPrevLesson(lessonId: string): LessonDefinition | null {
  const idx = LESSON_ORDER.findIndex((l) => l.id === lessonId);
  return idx > 0 ? LESSON_ORDER[idx - 1] : null;
}

export function getNextLessonById(lessonId: string): LessonDefinition | null {
  const idx = LESSON_ORDER.findIndex((l) => l.id === lessonId);
  return idx >= 0 && idx < LESSON_ORDER.length - 1 ? LESSON_ORDER[idx + 1] : null;
}

export function getPrevChallenge(challengeId: string): ChallengeDefinition | null {
  const idx = CHALLENGE_ORDER.findIndex((c) => c.id === challengeId);
  return idx > 0 ? CHALLENGE_ORDER[idx - 1] : null;
}

export function getNextChallengeById(challengeId: string): ChallengeDefinition | null {
  const idx = CHALLENGE_ORDER.findIndex((c) => c.id === challengeId);
  return idx >= 0 && idx < CHALLENGE_ORDER.length - 1
    ? CHALLENGE_ORDER[idx + 1]
    : null;
}

export function getRelatedChallenge(lessonId: string): ChallengeDefinition | null {
  const id = LESSON_TO_CHALLENGE[lessonId];
  return id ? getChallengeById(id) ?? null : null;
}

export function getRelatedLesson(challengeId: string): LessonDefinition | null {
  const id = CHALLENGE_TO_LESSON[challengeId];
  return id ? getLessonById(id) ?? null : null;
}

export function getBeginnerChallenge(
  completedLessons: string[],
  completedChallenges: string[]
): ChallengeDefinition | null {
  const beginner = CHALLENGE_ORDER.filter((c) => c.difficulty === "beginner");
  for (const c of beginner) {
    if (!completedChallenges.includes(c.id)) return c;
  }
  return beginner[0] ?? null;
}

export function getContinueTargets(
  completedLessons: string[],
  completedChallenges: string[],
  projects: Project[],
  currentProjectId: string | null
): ContinueTargets {
  const project =
    projects.find((p) => p.id === currentProjectId) ??
    projects[0] ??
    null;

  return {
    lesson: getNextLesson(completedLessons),
    challenge: getNextChallenge(completedLessons, completedChallenges),
    project,
  };
}

export function getLessonBreadcrumbs(lesson: LessonDefinition) {
  return [
    { label: "Home", href: "/" },
    { label: "Learn", href: "/learn" },
    { label: MODULE_LABELS[lesson.module as keyof typeof MODULE_LABELS] ?? lesson.module, href: "/learn" },
    { label: lesson.title },
  ];
}

export function getChallengeBreadcrumbs(challenge: ChallengeDefinition) {
  return [
    { label: "Home", href: "/" },
    { label: "Challenges", href: "/challenges" },
    { label: challenge.difficulty, href: "/challenges" },
    { label: challenge.title },
  ];
}

export interface AchievementHint {
  href: string;
  label: string;
}

export function getAchievementHint(achievementId: string): AchievementHint | null {
  const hints: Record<string, AchievementHint> = {
    "first-gate": { href: "/learn/add-first-gate", label: "Add Your First Gate lesson" },
    "superposition-starter": {
      href: "/learn/create-superposition",
      label: "Create Superposition lesson",
    },
    "pauli-pro": { href: "/challenges/pauli-flip", label: "Pauli Flip challenge" },
    "rotation-rookie": {
      href: "/learn/rotate-with-rx",
      label: "Rotate with RX lesson",
    },
    "measurement-master": {
      href: "/learn/measure-a-qubit",
      label: "Measure a Qubit lesson",
    },
    "bell-builder": {
      href: "/learn/build-bell-state",
      label: "Build a Bell State lesson",
    },
    "entanglement-explorer": {
      href: "/learn/entangle-two-qubits",
      label: "Entangle Two Qubits lesson",
    },
    "qiskit-exporter": { href: "/export", label: "Export Qiskit code" },
    "qiskit-importer": { href: "/import", label: "Import Qiskit code" },
    "circuit-architect": { href: "/projects", label: "Save a project" },
    "debugger": {
      href: "/challenges/fix-broken-circuit",
      label: "Fix the Broken Circuit challenge",
    },
    "quantum-explorer": { href: "/learn", label: "Complete beginner lessons" },
  };
  return hints[achievementId] ?? null;
}
