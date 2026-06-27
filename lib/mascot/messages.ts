export const quantaMessages = {
  welcome:
    "Hi, I'm Quanta! I'll help you build your first quantum circuits one gate at a time.",
  challengesTip:
    "Challenges test what you learned. Start with beginner quests, then build up to entanglement!",
  achievementsTip:
    "Badges show your quantum milestones. Collect them as you master circuits.",
  progress: {
    level1: "Every quantum expert starts with one gate.",
    hasLessons: "You're building real circuit intuition now.",
    hasStreak: "Your learning streak is glowing!",
    default: "Keep exploring — the quantum realm awaits.",
  },
  generic: {
    hint: "Take your time — quantum circuits reward patience.",
    success: "Nice work! That circuit is officially quantum-duck approved.",
    incorrect: "Almost! Check your gates and try again.",
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
