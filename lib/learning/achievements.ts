import type { AchievementDefinition } from "./types";

export const ACHIEVEMENTS: AchievementDefinition[] = [
  {
    id: "first-gate",
    name: "First Gate",
    description: "Place your first gate on the canvas.",
    xpReward: 10,
    icon: "⚡",
  },
  {
    id: "superposition-starter",
    name: "Superposition Starter",
    description: "Complete the Create Superposition lesson.",
    xpReward: 25,
    icon: "🌀",
  },
  {
    id: "pauli-pro",
    name: "Pauli Pro",
    description: "Complete the Pauli Flip challenge.",
    xpReward: 30,
    icon: "🔁",
  },
  {
    id: "rotation-rookie",
    name: "Rotation Rookie",
    description: "Complete the Rotate with RX lesson.",
    xpReward: 25,
    icon: "🔄",
  },
  {
    id: "measurement-master",
    name: "Measurement Master",
    description: "Complete the Measure a Qubit lesson.",
    xpReward: 30,
    icon: "📊",
  },
  {
    id: "bell-builder",
    name: "Bell Builder",
    description: "Build a Bell state in a lesson or challenge.",
    xpReward: 40,
    icon: "🔗",
  },
  {
    id: "entanglement-explorer",
    name: "Entanglement Explorer",
    description: "Use a controlled gate in any circuit.",
    xpReward: 35,
    icon: "✨",
  },
  {
    id: "qiskit-exporter",
    name: "Qiskit Exporter",
    description: "Export Qiskit code for the first time.",
    xpReward: 20,
    icon: "📤",
  },
  {
    id: "qiskit-importer",
    name: "Qiskit Importer",
    description: "Import Qiskit code to the canvas.",
    xpReward: 20,
    icon: "📥",
  },
  {
    id: "circuit-architect",
    name: "Circuit Architect",
    description: "Save your first project.",
    xpReward: 20,
    icon: "🏗️",
  },
  {
    id: "debugger",
    name: "Debugger",
    description: "Complete Fix the Broken Circuit.",
    xpReward: 35,
    icon: "🔧",
  },
  {
    id: "quantum-explorer",
    name: "Quantum Explorer",
    description: "Complete all beginner lessons.",
    xpReward: 50,
    icon: "🦆",
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
    ] as const
  ).map((module) => ({
    id: `module-${module}`,
    name: `${module.replaceAll("-", " ")} complete`,
    description: `Complete every lesson in the ${module.replaceAll("-", " ")} module.`,
    xpReward: 50,
    icon: "🏅",
  })),
  {
    id: "quiz-whiz",
    name: "Quiz Whiz",
    description: "Answer five lesson quizzes correctly on the first try.",
    xpReward: 75,
    icon: "🧠",
  },
  {
    id: "streak-3",
    name: "Three-Day Streak",
    description: "Stay active for three days in a row.",
    xpReward: 30,
    icon: "🔥",
  },
  {
    id: "streak-7",
    name: "Seven-Day Streak",
    description: "Stay active for seven days in a row.",
    xpReward: 75,
    icon: "🌟",
  },
  {
    id: "capstone-graduate",
    name: "Capstone Graduate",
    description: "Complete the Bell experiment capstone.",
    xpReward: 100,
    icon: "🎓",
  },
  {
    id: "academy-complete",
    name: "Academy Complete",
    description: "Complete every Quantum Academy lesson.",
    xpReward: 250,
    icon: "🏆",
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
  unlock(
    "academy-complete",
    (ctx.completedLessonsCount ?? ctx.completedLessons.length) >= 30
  );

  return newly;
}
