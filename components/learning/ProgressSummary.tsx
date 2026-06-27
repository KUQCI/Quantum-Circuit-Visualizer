"use client";

import { xpForNextLevel } from "@/lib/learning/progress";
import { useProgressStore } from "@/store/progress-store";
import { Flame, Star, Trophy, Zap } from "lucide-react";

export function ProgressSummary({ compact = false }: { compact?: boolean }) {
  const totalXp = useProgressStore((s) => s.totalXp);
  const completedLessons = useProgressStore((s) => s.completedLessons);
  const completedChallenges = useProgressStore((s) => s.completedChallenges);
  const currentStreak = useProgressStore((s) => s.currentStreak);
  const getLevel = useProgressStore((s) => s.getLevel);
  const level = getLevel();
  const xpInfo = xpForNextLevel(totalXp);

  if (compact) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className="academy-level-badge">Lv {level}</span>
        <span className="academy-xp-pill flex items-center gap-1 text-xs">
          <Zap className="h-3 w-3" />
          {totalXp} XP
        </span>
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        icon={Star}
        label="Level"
        value={`${level}`}
        sub={xpInfo.nextLevel ? `${xpInfo.xpNeeded - xpInfo.xpIntoLevel} XP to Lv ${xpInfo.nextLevel}` : "Max level"}
      />
      <StatCard icon={Zap} label="Total XP" value={`${totalXp}`} sub="Earned across academy" />
      <StatCard icon={Flame} label="Streak" value={`${currentStreak}`} sub="Days active" />
      <StatCard
        icon={Trophy}
        label="Completed"
        value={`${completedLessons.length + completedChallenges.length}`}
        sub={`${completedLessons.length} lessons · ${completedChallenges.length} challenges`}
      />
      {xpInfo.nextLevel && (
        <div className="col-span-full">
          <div className="mb-1 flex justify-between text-[10px] text-[var(--color-muted-foreground)]">
            <span>Level {level}</span>
            <span>Level {xpInfo.nextLevel}</span>
          </div>
          <div className="academy-progress-bar h-2 overflow-hidden rounded-full">
            <div
              className="academy-progress-fill h-full rounded-full transition-all"
              style={{ width: `${Math.min(100, xpInfo.progress * 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="academy-stat rounded-xl border border-[var(--color-border)] p-3">
      <div className="mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-[var(--color-muted-foreground)]">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <p className="text-2xl font-bold text-[var(--color-foreground)]">{value}</p>
      <p className="text-[10px] text-[var(--color-muted-foreground)]">{sub}</p>
    </div>
  );
}
