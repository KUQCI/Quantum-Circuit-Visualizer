export const LEVEL_THRESHOLDS = [
  0, 100, 250, 500, 900, 1400, 2000, 2800, 3800, 5000, 6500, 8500,
] as const;
export const LEVEL_TITLES = [
  "Curious Egg",
  "Hatchling",
  "Fledgling",
  "Gate Apprentice",
  "Superposition Scholar",
  "Entangler",
  "Circuit Builder",
  "Phase Whisperer",
  "Algorithm Adept",
  "Qiskit Coder",
  "Quantum Researcher",
  "Quantum Architect",
] as const;

export const MAX_LEVEL = LEVEL_THRESHOLDS.length;
export const DAILY_GOAL_XP = 50;

export function getLevelTitle(level: number): string {
  return LEVEL_TITLES[Math.max(1, Math.min(level, LEVEL_TITLES.length)) - 1];
}

export function levelQuantaVariant(level: number): "empty" | "hatchingNeutral" | "learning" | "coding" | "researcher" | "success" {
  if (level <= 1) return "empty";
  if (level <= 3) return "hatchingNeutral";
  if (level <= 5) return "learning";
  if (level <= 8) return "coding";
  if (level <= 11) return "researcher";
  return "success";
}

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
  const current = new Date();
  const today = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}-${String(current.getDate()).padStart(2, "0")}`;
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
  "algorithms",
  "qiskit",
  "capstone",
] as const;

export type ModuleId = (typeof MODULE_IDS)[number];

export const MODULE_LABELS: Record<ModuleId, string> = {
  "quantum-basics": "Quantum Basics",
  "single-qubit-gates": "Single-Qubit Gates",
  measurement: "Measurement",
  "multi-qubit-gates": "Multi-Qubit Gates",
  entanglement: "Entanglement",
  algorithms: "Algorithms",
  qiskit: "Qiskit Import & Export",
  capstone: "Capstone",
};

/** Short academic “why this matters” copy for each module. */
export const MODULE_WHY: Record<ModuleId, string> = {
  "quantum-basics":
    "Every circuit begins with a qubit and a blank wire — this is your foundation.",
  "single-qubit-gates":
    "Superposition and Pauli flips are the first real quantum moves you will reuse constantly.",
  measurement:
    "Measurement turns quantum states into classical outcomes — essential for any experiment.",
  "multi-qubit-gates":
    "Controlled gates let qubits talk — the bridge from single wires to algorithms.",
  entanglement:
    "Bell and GHZ states unlock correlations that classical bits cannot share.",
  algorithms:
    "Algorithms turn gate patterns into repeatable answers to useful questions.",
  qiskit:
    "Import and export connect the visualizer to research code and real backends.",
  capstone:
    "Bring preparation, entanglement, measurement, and analysis together.",
};
