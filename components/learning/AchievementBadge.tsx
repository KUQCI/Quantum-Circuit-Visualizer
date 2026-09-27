"use client";

import Link from "next/link";
import { ACHIEVEMENTS } from "@/lib/learning/achievements";
import { getAchievementHint } from "@/lib/navigation/flow";
import { useProgressStore } from "@/store/progress-store";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  Bird,
  Brain,
  Building2,
  Download,
  Flame,
  GraduationCap,
  Link2,
  Lock,
  Medal,
  Orbit,
  RefreshCw,
  Repeat,
  Sparkles,
  Star,
  Trophy,
  Upload,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { AchievementIcon } from "@/lib/learning/types";

const ACHIEVEMENT_ICONS: Record<AchievementIcon, LucideIcon> = {
  zap: Zap,
  spiral: Orbit,
  repeat: Repeat,
  refresh: RefreshCw,
  chart: BarChart3,
  link: Link2,
  sparkles: Sparkles,
  upload: Upload,
  download: Download,
  building: Building2,
  wrench: Wrench,
  duck: Bird,
  medal: Medal,
  brain: Brain,
  flame: Flame,
  star: Star,
  graduation: GraduationCap,
  trophy: Trophy,
};

export function AchievementBadge({ achievementId }: { achievementId: string }) {
  const achievement = ACHIEVEMENTS.find((a) => a.id === achievementId);
  const unlocked = useProgressStore((s) => s.isAchievementUnlocked(achievementId));
  const hint = getAchievementHint(achievementId);

  if (!achievement) return null;
  const Icon = unlocked ? ACHIEVEMENT_ICONS[achievement.icon] : Lock;

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
      <Icon
        className={cn(
          "h-6 w-6",
          unlocked
            ? "text-[var(--color-brand)]"
            : "text-[var(--color-muted-foreground)]"
        )}
        aria-hidden
      />
      <h2 className="mt-2 text-xs font-semibold text-[var(--color-foreground)]">
        {achievement.name}
      </h2>
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
