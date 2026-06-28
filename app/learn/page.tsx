"use client";

import { useEffect } from "react";
import { QuantaDuck } from "@/components/mascot/QuantaDuck";
import { QuantaMessage } from "@/components/mascot/QuantaMessage";
import { LessonPath } from "@/components/learning/LessonPath";
import { ProgressSummary } from "@/components/learning/ProgressSummary";
import { ProgressHydrationGate } from "@/components/layout/progress-hydration-gate";
import { ContinueWhereYouLeftOff } from "@/components/navigation/ContinueWhereYouLeftOff";
import { NextStepCard } from "@/components/navigation/NextStepCard";
import { PageActions } from "@/components/navigation/PageActions";
import { quantaMessages } from "@/lib/mascot/messages";
import {
  getBeginnerChallenge,
  getNextLesson,
} from "@/lib/navigation/flow";
import { useProgressStore } from "@/store/progress-store";
import { PenLine, Swords, BarChart3, Award } from "lucide-react";

export default function LearnPage() {
  const recordActivity = useProgressStore((s) => s.recordActivity);
  const completedLessons = useProgressStore((s) => s.completedLessons);
  const completedChallenges = useProgressStore((s) => s.completedChallenges);

  useEffect(() => {
    recordActivity();
  }, [recordActivity]);

  const nextLesson = getNextLesson(completedLessons);
  const beginnerChallenge = getBeginnerChallenge(
    completedLessons,
    completedChallenges
  );

  return (
    <div className="page-container max-w-5xl">
      <div className="academy-hero mb-8 rounded-2xl border border-[var(--color-border)] p-6 sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <QuantaDuck size={72} animated />
          <div className="flex-1">
            <p className="text-xs font-medium uppercase tracking-widest text-[var(--color-brand)]">
              Quantum Academy
            </p>
            <h1 className="page-title mt-1 text-3xl">Learn Quantum Circuits</h1>
            <p className="page-description mt-2">
              Learn quantum circuits through interactive lessons guided by Quanta
            </p>
            <PageActions
              className="mt-4"
              primary={
                nextLesson
                  ? [
                      {
                        label: nextLesson.title,
                        href: `/learn/${nextLesson.id}`,
                      },
                    ]
                  : [{ label: "Review Lessons", href: "/learn/what-is-a-qubit" }]
              }
              secondary={[
                { label: "Build Mode", href: "/editor", icon: <PenLine className="h-4 w-4" /> },
                { label: "Progress", href: "/progress", icon: <BarChart3 className="h-4 w-4" /> },
              ]}
            />
          </div>
        </div>
      </div>

      <ContinueWhereYouLeftOff className="mb-8" showProject={false} />

      <ProgressHydrationGate>
        {beginnerChallenge && (
          <NextStepCard
            className="mb-8"
            badge="Recommended Challenge"
            title={beginnerChallenge.title}
            description={beginnerChallenge.description}
            href={`/challenges/${beginnerChallenge.id}`}
            ctaLabel="Start Challenge"
            secondaryHref="/achievements"
            secondaryLabel="View Achievements"
          />
        )}

        <QuantaMessage
          title="Welcome to Quantum Academy"
          message={quantaMessages.welcome}
          className="mb-8"
        />

        <section className="mb-8">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">
            Your Progress
          </h2>
          <ProgressSummary />
          <PageActions
            className="mt-4"
            secondary={[
              { label: "View Progress", href: "/progress", icon: <BarChart3 className="h-4 w-4" /> },
              { label: "Achievements", href: "/achievements", icon: <Award className="h-4 w-4" /> },
              { label: "Challenges", href: "/challenges", icon: <Swords className="h-4 w-4" /> },
            ]}
          />
        </section>

        <section>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">
            Learning Path
          </h2>
          <LessonPath />
        </section>
      </ProgressHydrationGate>
    </div>
  );
}
