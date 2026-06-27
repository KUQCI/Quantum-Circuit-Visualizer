export const LEVEL_THRESHOLDS = [0, 100, 250, 500, 900, 1400, 2000] as const;

export const MAX_LEVEL = LEVEL_THRESHOLDS.length;

export function getLevelFromXp(xp: number): number {
  let level = 1;
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) {
      level = i + 1;
      break;
    }
  }
  return level;
}

export function xpForNextLevel(xp: number): {
  currentLevel: number;
  nextLevel: number | null;
  xpIntoLevel: number;
  xpNeeded: number;
  progress: number;
} {
  const currentLevel = getLevelFromXp(xp);
  if (currentLevel >= MAX_LEVEL) {
    return {
      currentLevel,
      nextLevel: null,
      xpIntoLevel: xp - LEVEL_THRESHOLDS[MAX_LEVEL - 1],
      xpNeeded: 0,
      progress: 1,
    };
  }
  const floor = LEVEL_THRESHOLDS[currentLevel - 1];
  const ceiling = LEVEL_THRESHOLDS[currentLevel];
  const xpIntoLevel = xp - floor;
  const xpNeeded = ceiling - floor;
  return {
    currentLevel,
    nextLevel: currentLevel + 1,
    xpIntoLevel,
    xpNeeded,
    progress: xpNeeded > 0 ? xpIntoLevel / xpNeeded : 1,
  };
}

export function updateStreak(
  lastActiveDate: string | null,
  currentStreak: number
): { streak: number; lastActiveDate: string } {
  const today = new Date().toISOString().slice(0, 10);
  if (!lastActiveDate) {
    return { streak: 1, lastActiveDate: today };
  }
  if (lastActiveDate === today) {
    return { streak: currentStreak || 1, lastActiveDate: today };
  }
  const last = new Date(`${lastActiveDate}T12:00:00`);
  const now = new Date(`${today}T12:00:00`);
  const diffDays = Math.round(
    (now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diffDays === 1) {
    return { streak: (currentStreak || 0) + 1, lastActiveDate: today };
  }
  return { streak: 1, lastActiveDate: today };
}

export const MODULE_IDS = [
  "quantum-basics",
  "single-qubit-gates",
  "measurement",
  "multi-qubit-gates",
  "entanglement",
  "qiskit",
] as const;

export type ModuleId = (typeof MODULE_IDS)[number];

export const MODULE_LABELS: Record<ModuleId, string> = {
  "quantum-basics": "Quantum Basics",
  "single-qubit-gates": "Single-Qubit Gates",
  measurement: "Measurement",
  "multi-qubit-gates": "Multi-Qubit Gates",
  entanglement: "Entanglement",
  qiskit: "Qiskit Import & Export",
};
