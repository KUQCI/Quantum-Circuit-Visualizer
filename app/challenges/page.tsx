"use client";

import { useEffect } from "react";
import { QuantaMessage } from "@/components/mascot/QuantaMessage";
import { ChallengeCard } from "@/components/learning/ChallengeCard";
import { ProgressSummary } from "@/components/learning/ProgressSummary";
import { ContinueWhereYouLeftOff } from "@/components/navigation/ContinueWhereYouLeftOff";
import { NextStepCard } from "@/components/navigation/NextStepCard";
import { PageActions } from "@/components/navigation/PageActions";
import { Reveal } from "@/components/motion/Reveal";
import { CHALLENGES, getChallengesByDifficulty } from "@/lib/learning/challenges";
import {
  getNextChallenge,
  getNextLesson,
  getRelatedLesson,
} from "@/lib/navigation/flow";
import { quantaMessages } from "@/lib/mascot/messages";
import {
  isChallengeUnlockedByTier,
  useProgressStore,
} from "@/store/progress-store";
import { ProgressHydrationGate } from "@/components/layout/progress-hydration-gate";
import { BarChart3, Award, GraduationCap } from "lucide-react";

function challengeLockReason(
  difficulty: "beginner" | "intermediate" | "advanced",
  completedLessons: string[],
  completedChallenges: string[],
  challengeId: string
): string | undefined {
  if (isChallengeUnlockedByTier(difficulty, completedLessons, completedChallenges)) {
    return undefined;
  }
  const related = getRelatedLesson(challengeId);
  if (related && !completedLessons.includes(related.id)) {
    return `Complete “${related.title}” first`;
  }
  if (difficulty === "intermediate") {
    return "Complete at least 3 lessons first";
  }
  if (difficulty === "advanced") {
    return "Complete 6 lessons and 2 challenges first";
  }
  return "Complete earlier challenges first";
}

export default function ChallengesPage() {
  const completedLessons = useProgressStore((s) => s.completedLessons);
  const completedChallenges = useProgressStore((s) => s.completedChallenges);
  const recordActivity = useProgressStore((s) => s.recordActivity);

  useEffect(() => {
    recordActivity();
  }, [recordActivity]);

  const nextChallenge = getNextChallenge(completedLessons, completedChallenges);
  const nextLesson = getNextLesson(completedLessons);
  const allComplete = completedChallenges.length >= CHALLENGES.length;
  const tiers = ["beginner", "intermediate", "advanced"] as const;

  return (
    <div className="page-container max-w-6xl">
      <div className="page-header mb-6">
        <h1 className="page-title text-3xl">Challenges</h1>
        <p className="page-description">
          Objective-based quests that reinforce what you learned in Quantum
          Academy
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
            {
              label: "Learn",
              href: "/learn",
              icon: <GraduationCap className="h-4 w-4" />,
            },
            {
              label: "Progress",
              href: "/progress",
              icon: <BarChart3 className="h-4 w-4" />,
            },
            {
              label: "Achievements",
              href: "/achievements",
              icon: <Award className="h-4 w-4" />,
            },
          ]}
        />
      </div>

      <ProgressHydrationGate>
        <ProgressSummary compact />

        <div className="my-6 grid gap-3 lg:grid-cols-2">
          {allComplete ? (
            <NextStepCard
              className="lg:col-span-2"
              badge="All challenges complete"
              title="Quantum champion!"
              description="You have finished every challenge. Review achievements or keep building circuits."
              href="/achievements"
              ctaLabel="View Achievements"
              secondaryHref="/editor"
              secondaryLabel="Open Build"
            />
          ) : (
            <>
              {nextChallenge && (
                <NextStepCard
                  badge="Continue Challenge"
                  title={nextChallenge.title}
                  description={`${nextChallenge.description} · ~${nextChallenge.estimatedMinutes} min`}
                  href={`/challenges/${nextChallenge.id}`}
                  ctaLabel="Continue"
                />
              )}
              {nextLesson && (
                <NextStepCard
                  badge="Continue Learning"
                  title={nextLesson.title}
                  description={nextLesson.description}
                  href={`/learn/${nextLesson.id}`}
                  ctaLabel="Resume lesson"
                />
              )}
            </>
          )}
        </div>

        <ContinueWhereYouLeftOff className="my-6" showProject={false} />

        <QuantaMessage
          title="Quanta"
          message={quantaMessages.challengesTip}
          className="my-6"
        />

        <div className="space-y-10">
          {tiers.map((tier) => {
            const items = getChallengesByDifficulty(tier);
            const unlocked = isChallengeUnlockedByTier(
              tier,
              completedLessons,
              completedChallenges
            );
            const cols =
              tier === "beginner"
                ? "sm:grid-cols-2 lg:grid-cols-3"
                : "sm:grid-cols-2 lg:grid-cols-3";
            return (
              <section key={tier}>
                <div className="mb-3 flex items-baseline justify-between gap-2">
                  <h2 className="text-base font-semibold capitalize text-[var(--color-foreground)]">
                    {tier}
                  </h2>
                  {!unlocked && (
                    <p className="text-xs text-[var(--color-warning)]">
                      {challengeLockReason(
                        tier,
                        completedLessons,
                        completedChallenges,
                        items[0]?.id ?? ""
                      )}
                    </p>
                  )}
                </div>
                <div className={`grid gap-4 ${cols}`}>
                  {items.map((c, i) => (
                    <Reveal key={c.id} delay={i * 55} variant="up">
                      <ChallengeCard
                        challenge={c}
                        unlocked={unlocked}
                        completed={completedChallenges.includes(c.id)}
                        lockedReason={
                          unlocked
                            ? undefined
                            : challengeLockReason(
                                tier,
                                completedLessons,
                                completedChallenges,
                                c.id
                              )
                        }
                      />
                    </Reveal>
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
