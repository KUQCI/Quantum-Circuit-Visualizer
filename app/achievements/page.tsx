"use client";

import { useEffect } from "react";
import { QuantaAchievement } from "@/components/mascot/QuantaAchievement";
import { AchievementGrid } from "@/components/learning/AchievementBadge";
import { ProgressSummary } from "@/components/learning/ProgressSummary";
import { PageActions } from "@/components/navigation/PageActions";
import { ACHIEVEMENTS } from "@/lib/learning/achievements";
import { useProgressStore } from "@/store/progress-store";
import { BarChart3, GraduationCap } from "lucide-react";
import { usePersistHydrated } from "@/lib/use-persist-hydrated";

export default function AchievementsPage() {
  const unlocked = useProgressStore((s) => s.unlockedAchievements);
  const recordActivity = useProgressStore((s) => s.recordActivity);
  const progressHydrated = usePersistHydrated(useProgressStore.persist);

  useEffect(() => {
    if (!progressHydrated) return;
    recordActivity();
  }, [progressHydrated, recordActivity]);

  if (!progressHydrated) {
    return (
      <div className="page-container max-w-4xl">
        <div className="flex min-h-64 items-center justify-center text-sm text-[var(--color-muted-foreground)]">
          Loading…
        </div>
      </div>
    );
  }

  return (
    <div className="page-container max-w-4xl">
      <div className="page-header mb-6">
        <h1 className="page-title text-3xl">Achievements</h1>
        <p className="page-description">
          {unlocked.length} / {ACHIEVEMENTS.length} badges unlocked
        </p>
        <PageActions
          className="mt-4"
          secondary={[
            { label: "View progress", href: "/progress", icon: <BarChart3 className="h-4 w-4" /> },
            { label: "Learn", href: "/learn", icon: <GraduationCap className="h-4 w-4" /> },
          ]}
        />
      </div>

      <ProgressSummary compact />

      <QuantaAchievement
        title="Collect badges as you master circuits."
        message="Unlock badges by finishing lessons, challenges, and streaks."
        unlockedCount={unlocked.length}
        totalCount={ACHIEVEMENTS.length}
        className="my-6"
      />

      <AchievementGrid />
    </div>
  );
}
