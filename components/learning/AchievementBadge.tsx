"use client";

import Link from "next/link";
import { ACHIEVEMENTS } from "@/lib/learning/achievements";
import { getAchievementHint } from "@/lib/navigation/flow";
import { useProgressStore } from "@/store/progress-store";
import { cn } from "@/lib/utils";
import { Lock, Zap } from "lucide-react";

export function AchievementBadge({ achievementId }: { achievementId: string }) {
  const achievement = ACHIEVEMENTS.find((a) => a.id === achievementId);
  const unlocked = useProgressStore((s) => s.isAchievementUnlocked(achievementId));
  const hint = getAchievementHint(achievementId);

  if (!achievement) return null;

  return (
    <div
      className={cn(
        "academy-badge flex flex-col items-center rounded-xl border p-4 text-center transition-all",
        unlocked
          ? "border-[var(--color-brand-border)] bg-[var(--color-brand-subtle)]"
          : "border-[var(--color-border)] opacity-80"
      )}
      aria-label={`${achievement.name}${unlocked ? ", unlocked" : ", locked"}`}
    >
      <span className="text-3xl" aria-hidden>
        {unlocked ? achievement.icon : "🔒"}
      </span>
      {!unlocked && (
        <Lock className="mt-1 h-3 w-3 text-[var(--color-muted-foreground)]" aria-hidden />
      )}
      <h3 className="mt-2 text-xs font-semibold text-[var(--color-foreground)]">
        {achievement.name}
      </h3>
      <p className="mt-1 text-[10px] leading-snug text-[var(--color-muted-foreground)]">
        {achievement.description}
      </p>
      {!unlocked && hint && (
        <Link
          href={hint.href}
          className="mt-2 text-[10px] font-medium text-[var(--color-brand)] hover:underline"
        >
          {hint.label} →
        </Link>
      )}
      <span className="academy-xp-pill mt-2 flex items-center gap-1 text-[10px]">
        <Zap className="h-3 w-3" />+{achievement.xpReward} XP
      </span>
    </div>
  );
}

export function AchievementGrid() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {ACHIEVEMENTS.map((a) => (
        <AchievementBadge key={a.id} achievementId={a.id} />
      ))}
    </div>
  );
}
