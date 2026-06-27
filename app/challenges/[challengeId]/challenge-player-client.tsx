"use client";

import type { ChallengeDefinition } from "@/lib/learning/types";
import { LearningPlayer } from "@/components/learning/LearningPlayer";
import { Breadcrumbs } from "@/components/navigation/Breadcrumbs";
import { getChallengeBreadcrumbs } from "@/lib/navigation/flow";

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
