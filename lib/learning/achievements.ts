import { MODULE_LABELS } from "./progress";
import type { AchievementDefinition, AchievementIcon } from "./types";

export const ACHIEVEMENTS: AchievementDefinition[] = [
  {
    id: "first-gate",
    name: "First Gate",
    description: "Place your first gate on the canvas.",
    xpReward: 10,
    icon: "zap",
  },
  {
    id: "superposition-starter",
    name: "Superposition Starter",
    description: "Complete the Create Superposition lesson.",
    xpReward: 25,
    icon: "spiral",
  },
  {
    id: "pauli-pro",
    name: "Pauli Pro",
    description: "Complete the Pauli Flip challenge.",
    xpReward: 30,
    icon: "repeat",
  },
  {
    id: "rotation-rookie",
    name: "Rotation Rookie",
    description: "Complete the Rotate with RX lesson.",
    xpReward: 25,
    icon: "refresh",
  },
  {
    id: "measurement-master",
    name: "Measurement Master",
    description: "Complete the Measure a Qubit lesson.",
    xpReward: 30,
    icon: "chart",
  },
  {
    id: "bell-builder",
    name: "Bell Builder",
    description: "Build a Bell state in a lesson or challenge.",
    xpReward: 40,
    icon: "link",
  },
  {
    id: "entanglement-explorer",
    name: "Entanglement Explorer",
    description: "Use a controlled gate in any circuit.",
    xpReward: 35,
    icon: "sparkles",
  },
  {
    id: "qiskit-exporter",
    name: "Qiskit Exporter",
    description: "Export Qiskit code for the first time.",
    xpReward: 20,
    icon: "upload",
  },
  {
    id: "qiskit-importer",
    name: "Qiskit Importer",
    description: "Import Qiskit code to the canvas.",
    xpReward: 20,
    icon: "download",
  },
  {
    id: "circuit-architect",
    name: "Circuit Architect",
    description: "Save your first project.",
    xpReward: 20,
    icon: "building",
  },
  {
    id: "debugger",
    name: "Debugger",
    description: "Complete Fix the Broken Circuit.",
    xpReward: 35,
    icon: "wrench",
  },
  {
    id: "quantum-explorer",
    name: "Quantum Explorer",
    description: "Complete all beginner lessons.",
    xpReward: 50,
    icon: "duck",
  },
  ...(
    [
      "quantum-basics",
      "single-qubit-gates",
      "measurement",
      "multi-qubit-gates",
      "entanglement",
      "algorithms",
      "qiskit",
      "capstone",
      "quantum-ml",
    ] as const
  ).map((module) => ({
    id: `module-${module}`,
    name: `${MODULE_LABELS[module]} Complete`,
    description: `Complete every lesson in the ${MODULE_LABELS[module]} module.`,
    xpReward: 50,
    icon: "medal" as AchievementIcon,
  })),
  {
    id: "quiz-whiz",
    name: "Quiz Whiz",
    description: "Answer five lesson quizzes correctly on the first try.",
    xpReward: 75,
    icon: "brain" as AchievementIcon,
  },
  {
    id: "streak-3",
    name: "Three-Day Streak",
    description: "Stay active for three days in a row.",
    xpReward: 30,
    icon: "flame" as AchievementIcon,
  },
  {
    id: "streak-7",
    name: "Seven-Day Streak",
    description: "Stay active for seven days in a row.",
    xpReward: 75,
    icon: "star" as AchievementIcon,
  },
  {
    id: "capstone-graduate",
    name: "Capstone Graduate",
    description: "Complete the Bell experiment capstone.",
    xpReward: 100,
    icon: "graduation" as AchievementIcon,
  },
  {
    id: "qml-graduate",
    name: "Quantum ML Graduate",
    description: "Complete the two-feature classifier capstone.",
    xpReward: 150,
    icon: "chart" as AchievementIcon,
  },
  {
    id: "academy-complete",
    name: "Academy Complete",
    description: "Complete every Quantum Academy lesson.",
    xpReward: 250,
    icon: "trophy" as AchievementIcon,
  },
];

export function getAchievementById(id: string): AchievementDefinition | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id);
}

/** Achievement unlock rules evaluated after actions */
export interface AchievementCheckContext {
  completedLessons: string[];
  completedChallenges: string[];
  hasAnyGate: boolean;
  hasControlledGate: boolean;
  exportDone: boolean;
  importDone: boolean;
  projectSaved: boolean;
  completedModules?: string[];
  firstTryQuizzes?: number;
  currentStreak?: number;
  completedLessonsCount?: number;
}

export function evaluateAchievements(
  ctx: AchievementCheckContext,
  alreadyUnlocked: string[]
): string[] {
  const newly: string[] = [];
  const unlock = (id: string, condition: boolean) => {
    if (condition && !alreadyUnlocked.includes(id) && !newly.includes(id)) {
      newly.push(id);
    }
  };

  unlock("first-gate", ctx.hasAnyGate);
  unlock("superposition-starter", ctx.completedLessons.includes("create-superposition"));
  unlock("pauli-pro", ctx.completedChallenges.includes("pauli-flip"));
  unlock("rotation-rookie", ctx.completedLessons.includes("rotate-with-rx"));
  unlock("measurement-master", ctx.completedLessons.includes("measure-a-qubit"));
  unlock(
    "bell-builder",
    ctx.completedLessons.includes("build-bell-state") ||
      ctx.completedChallenges.includes("bell-pair-builder")
  );
  unlock("entanglement-explorer", ctx.hasControlledGate);
  unlock("qiskit-exporter", ctx.exportDone);
  unlock("qiskit-importer", ctx.importDone);
  unlock("circuit-architect", ctx.projectSaved);
  unlock("debugger", ctx.completedChallenges.includes("fix-broken-circuit"));

  const beginnerLessons = [
    "what-is-a-qubit",
    "add-first-gate",
    "create-superposition",
    "flip-with-x",
    "export-first-qiskit",
  ];
  unlock(
    "quantum-explorer",
    beginnerLessons.every((id) => ctx.completedLessons.includes(id))
  );
  for (const moduleId of ctx.completedModules ?? []) {
    unlock(`module-${moduleId}`, true);
  }
  unlock("quiz-whiz", (ctx.firstTryQuizzes ?? 0) >= 5);
  unlock("streak-3", (ctx.currentStreak ?? 0) >= 3);
  unlock("streak-7", (ctx.currentStreak ?? 0) >= 7);
  unlock("capstone-graduate", ctx.completedLessons.includes("capstone-bell-experiment"));
  unlock("qml-graduate", ctx.completedLessons.includes("qml-capstone-classifier"));
  unlock(
    "academy-complete",
    (ctx.completedLessonsCount ?? ctx.completedLessons.length) >= 36
  );

  return newly;
}
