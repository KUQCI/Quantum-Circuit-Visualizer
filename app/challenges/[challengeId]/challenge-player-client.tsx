"use client";

import type { ChallengeDefinition } from "@/lib/learning/types";
import { LearningPlayer } from "@/components/learning/LearningPlayer";
import { LockedActivityState } from "@/components/learning/LockedActivityState";
import { Breadcrumbs } from "@/components/navigation/Breadcrumbs";
import { getChallengeBreadcrumbs } from "@/lib/navigation/flow";
import { isChallengeUnlockedByTier, useProgressStore } from "@/store/progress-store";
import { usePersistHydrated } from "@/lib/use-persist-hydrated";

export function ChallengePlayerClient({
  challenge,
  nextHref,
  prevHref,
  relatedHref,
  relatedLabel,
}: {
  challenge: ChallengeDefinition;
  nextHref?: string;
  prevHref?: string;
  relatedHref?: string;
  relatedLabel?: string;
}) {
  const completedLessons = useProgressStore((s) => s.completedLessons);
  const completedChallenges = useProgressStore((s) => s.completedChallenges);
  const progressHydrated = usePersistHydrated(useProgressStore.persist);

  if (!progressHydrated) {
    return (
      <div className="learning-workspace-shell flex min-h-0 flex-1 items-center justify-center p-8 text-sm text-[var(--color-muted-foreground)]">
        Loading challenge…
      </div>
    );
  }

  const unlocked = isChallengeUnlockedByTier(
    challenge.difficulty,
    completedLessons,
    completedChallenges
  );

  if (!unlocked) {
    return (
      <LockedActivityState
        title={`${challenge.title} is locked`}
        description="Complete more lessons and earlier challenges to unlock this tier."
        backHref="/challenges"
        backLabel="Back to Challenges"
      />
    );
  }

  return (
    <div className="learning-workspace-shell">
      <Breadcrumbs
        items={getChallengeBreadcrumbs(challenge)}
        className="mb-2 shrink-0 px-0.5"
      />
      <LearningPlayer
        activity={challenge}
        mode="challenge"
        nextHref={nextHref}
        prevHref={prevHref}
        relatedHref={relatedHref}
        relatedLabel={relatedLabel}
        backHref="/challenges"
      />
    </div>
  );
}
