"use client";

import type { ChallengeDefinition } from "@/lib/learning/types";
import { LearningPlayer } from "@/components/learning/LearningPlayer";

export function ChallengePlayerClient({
  challenge,
  nextHref,
}: {
  challenge: ChallengeDefinition;
  nextHref?: string;
}) {
  return (
    <div className="page-container max-w-[1600px] py-4">
      <LearningPlayer
        activity={challenge}
        mode="challenge"
        nextHref={nextHref}
        backHref="/challenges"
      />
    </div>
  );
}
