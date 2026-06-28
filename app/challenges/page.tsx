"use client";

import { useEffect } from "react";
import { QuantaMessage } from "@/components/mascot/QuantaMessage";
import { ChallengeCard } from "@/components/learning/ChallengeCard";
import { ProgressSummary } from "@/components/learning/ProgressSummary";
import { ContinueWhereYouLeftOff } from "@/components/navigation/ContinueWhereYouLeftOff";
import { NextStepCard } from "@/components/navigation/NextStepCard";
import { PageActions } from "@/components/navigation/PageActions";
import { CHALLENGES, getChallengesByDifficulty } from "@/lib/learning/challenges";
import { getNextChallenge } from "@/lib/navigation/flow";
import { quantaMessages } from "@/lib/mascot/messages";
import {
  isChallengeUnlockedByTier,
  useProgressStore,
} from "@/store/progress-store";
import { ProgressHydrationGate } from "@/components/layout/progress-hydration-gate";
import { BarChart3, Award, GraduationCap } from "lucide-react";

export default function ChallengesPage() {
  const completedLessons = useProgressStore((s) => s.completedLessons);
  const completedChallenges = useProgressStore((s) => s.completedChallenges);
  const recordActivity = useProgressStore((s) => s.recordActivity);

  useEffect(() => {
    recordActivity();
  }, [recordActivity]);

  const nextChallenge = getNextChallenge(completedLessons, completedChallenges);
  const allComplete = completedChallenges.length >= CHALLENGES.length;
  const tiers = ["beginner", "intermediate", "advanced"] as const;

  return (
    <div className="page-container max-w-5xl">
      <div className="page-header mb-6">
        <h1 className="page-title text-3xl">Challenges</h1>
        <p className="page-description">
          Test your skills with objective-based quantum quests
        </p>
        <PageActions
          className="mt-4"
          primary={
            nextChallenge
              ? [
                  {
                    label: `Start ${nextChallenge.title}`,
                    href: `/challenges/${nextChallenge.id}`,
                  },
                ]
              : allComplete
                ? [{ label: "View Achievements", href: "/achievements" }]
                : []
          }
          secondary={[
            { label: "Learn", href: "/learn", icon: <GraduationCap className="h-4 w-4" /> },
            { label: "Progress", href: "/progress", icon: <BarChart3 className="h-4 w-4" /> },
            { label: "Achievements", href: "/achievements", icon: <Award className="h-4 w-4" /> },
          ]}
        />
      </div>

      <ProgressHydrationGate>
        <ProgressSummary compact />

        {allComplete && (
          <NextStepCard
            className="my-6"
            badge="All challenges complete"
            title="Quantum champion!"
            description="You have finished every challenge. Review achievements or keep building circuits."
            href="/achievements"
            ctaLabel="View Achievements"
            secondaryHref="/editor"
            secondaryLabel="Open Build"
          />
        )}

        {nextChallenge && !allComplete && (
          <NextStepCard
            className="my-6"
            badge="Continue Challenge"
            title={nextChallenge.title}
            description={nextChallenge.description}
            href={`/challenges/${nextChallenge.id}`}
            ctaLabel="Continue"
            secondaryHref="/progress"
            secondaryLabel="View Progress"
          />
        )}

        <ContinueWhereYouLeftOff className="my-6" showProject={false} />

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
      </ProgressHydrationGate>
    </div>
  );
}
