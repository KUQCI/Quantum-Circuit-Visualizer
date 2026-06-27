"use client";

import { useEffect } from "react";
import { QuantaMessage } from "@/components/mascot/QuantaMessage";
import { ChallengeCard } from "@/components/learning/ChallengeCard";
import { ProgressSummary } from "@/components/learning/ProgressSummary";
import { CHALLENGES, getChallengesByDifficulty } from "@/lib/learning/challenges";
import { quantaMessages } from "@/lib/mascot/messages";
import {
  isChallengeUnlockedByTier,
  useProgressStore,
} from "@/store/progress-store";

export default function ChallengesPage() {
  const completedLessons = useProgressStore((s) => s.completedLessons);
  const completedChallenges = useProgressStore((s) => s.completedChallenges);
  const recordActivity = useProgressStore((s) => s.recordActivity);

  useEffect(() => {
    recordActivity();
  }, [recordActivity]);

  const tiers = ["beginner", "intermediate", "advanced"] as const;

  return (
    <div className="page-container max-w-5xl">
      <div className="page-header mb-6">
        <h1 className="page-title text-3xl">Challenges</h1>
        <p className="page-description">
          Test your skills with objective-based quantum quests
        </p>
      </div>

      <ProgressSummary compact />

      <QuantaMessage
        title="Quanta's tip"
        message={quantaMessages.challengesTip}
        className="my-6"
      />

      <div className="space-y-8">
        {tiers.map((tier) => {
          const items = getChallengesByDifficulty(tier);
          const unlocked = isChallengeUnlockedByTier(
            tier,
            completedLessons,
            completedChallenges
          );
          return (
            <section key={tier}>
              <h2 className="mb-3 text-sm font-semibold capitalize text-[var(--color-foreground)]">
                {tier}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {items.map((c) => (
                  <ChallengeCard
                    key={c.id}
                    challenge={c}
                    unlocked={unlocked}
                    completed={completedChallenges.includes(c.id)}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
