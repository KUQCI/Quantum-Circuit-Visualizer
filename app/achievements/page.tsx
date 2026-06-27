"use client";

import { useEffect } from "react";
import { QuantaMessage } from "@/components/mascot/QuantaMessage";
import { AchievementGrid } from "@/components/learning/AchievementBadge";
import { ProgressSummary } from "@/components/learning/ProgressSummary";
import { PageActions } from "@/components/navigation/PageActions";
import { ACHIEVEMENTS } from "@/lib/learning/achievements";
import { quantaMessages } from "@/lib/mascot/messages";
import { useProgressStore } from "@/store/progress-store";
import { BarChart3, GraduationCap } from "lucide-react";

export default function AchievementsPage() {
  const unlocked = useProgressStore((s) => s.unlockedAchievements);
  const recordActivity = useProgressStore((s) => s.recordActivity);

  useEffect(() => {
    recordActivity();
  }, [recordActivity]);

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
            { label: "View Progress", href: "/progress", icon: <BarChart3 className="h-4 w-4" /> },
            { label: "Learn", href: "/learn", icon: <GraduationCap className="h-4 w-4" /> },
          ]}
        />
      </div>

      <ProgressSummary compact />

      <QuantaMessage
        title="Quanta"
        message={quantaMessages.achievementsTip}
        className="my-6"
      />

      <AchievementGrid />
    </div>
  );
}
