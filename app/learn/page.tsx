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
import { ArtistAssetPlaceholder } from "@/components/assets/ArtistAssetPlaceholder";
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
      <div className="academy-hero mb-8 overflow-hidden rounded-2xl border border-[var(--color-border)] p-6 sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="relative shrink-0">
            <QuantaDuck size={72} animated />
          </div>
          <div className="flex-1">
            <p className="qci-section-eyebrow mb-1">Quantum Academy</p>
            <h1 className="page-title mt-1 text-3xl">Learn Quantum Circuits</h1>
            <p className="page-description mt-2 max-w-xl">
              A guided QCI learning track — playful with Quanta, still academic
              and research-focused.
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

      <div className="mb-8 grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
        <ArtistAssetPlaceholder
          assetId="quanta-teacher"
          label="Quanta Teacher"
          aspect="banner"
          className="min-h-[120px]"
        />
        <ArtistAssetPlaceholder
          assetId="bloch-sphere-duck-icon"
          aspect="square"
          className="min-h-[120px]"
        />
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
          <p className="qci-section-eyebrow">Your progress</p>
          <h2 className="mb-4 text-xl font-semibold text-[var(--color-foreground)]">
            Track the learning path
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
          <p className="qci-section-eyebrow">Learning track</p>
          <h2 className="mb-4 text-xl font-semibold text-[var(--color-foreground)]">
            Guided R&amp;D curriculum
          </h2>
          <LessonPath />
        </section>
      </ProgressHydrationGate>
    </div>
  );
}
