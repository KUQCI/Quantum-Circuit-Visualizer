export const quantaMessages = {
  welcome:
    "Hi, I'm Quanta. I'll help you build your first quantum circuits one gate at a time.",
  meetQuanta:
    "Quanta is your guide through circuits, gates, and quantum logic.",
  challengesTip:
    "Challenges test what you learned. Start small, then build up to entanglement.",
  achievementsTip: "Collect badges as you master circuits.",
  projectsEmpty:
    "No saved circuits yet. Want to hatch your first project?",
  parseError:
    "I could not understand this line yet. Try simple syntax like qc.h(0) or qc.cx(0, 1).",
  progress: {
    level1: "Every quantum expert starts with one gate.",
    hasLessons: "You're building real circuit intuition now.",
    hasStreak: "Your learning streak is glowing.",
    default: "Keep exploring — the quantum realm awaits.",
  },
  generic: {
    hint: "Try placing the H gate on q[0].",
    success: "Quantum-duck approved. Nice work!",
    incorrect: "Almost! Check which wire your gate is on.",
    encourage: "You're closer than you think. One gate at a time!",
  },
} as const;

export function getProgressQuantaMessage(
  level: number,
  lessonsCompleted: number,
  streak: number
): string {
  if (streak >= 2) return quantaMessages.progress.hasStreak;
  if (lessonsCompleted >= 3) return quantaMessages.progress.hasLessons;
  if (level <= 1) return quantaMessages.progress.level1;
  return quantaMessages.progress.default;
}
