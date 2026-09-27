"use client";

import { useEffect } from "react";
import { QuantaImage } from "@/components/mascot/QuantaImage";
import { QuantaMessage } from "@/components/mascot/QuantaMessage";
import { QuantaCard } from "@/components/mascot/QuantaCard";
import { QuantaEmptyState } from "@/components/mascot/QuantaEmptyState";
import { LessonPath } from "@/components/learning/LessonPath";
import { ProgressSummary } from "@/components/learning/ProgressSummary";
import { ProgressHydrationGate } from "@/components/layout/progress-hydration-gate";
import { ContinueWhereYouLeftOff } from "@/components/navigation/ContinueWhereYouLeftOff";
import { NextStepCard } from "@/components/navigation/NextStepCard";
import { PageActions } from "@/components/navigation/PageActions";
import { Reveal } from "@/components/motion/Reveal";
import { getProgressQuantaMessage, quantaMessages } from "@/lib/mascot/messages";
import {
  getBeginnerChallenge,
  getNextLesson,
} from "@/lib/navigation/flow";
import { useProgressStore } from "@/store/progress-store";
import { DAILY_GOAL_XP, getLevelTitle, levelQuantaVariant } from "@/lib/learning/progress";
import { usePersistHydrated } from "@/lib/use-persist-hydrated";
import { getReviewStats } from "@/lib/learning/quiz-review";
import { todayIso } from "@/store/progress-store";
import { LESSONS } from "@/lib/learning/lessons";
import { PenLine, Swords, BarChart3, Award } from "lucide-react";

export default function LearnPage() {
  const recordActivity = useProgressStore((s) => s.recordActivity);
  const completedLessons = useProgressStore((s) => s.completedLessons);
  const completedChallenges = useProgressStore((s) => s.completedChallenges);
  const totalXp = useProgressStore((s) => s.totalXp);
  const getLevel = useProgressStore((s) => s.getLevel);
  const streak = useProgressStore((s) => s.currentStreak);
  const dailyXp = useProgressStore((s) => s.dailyXp);
  const quizHistory = useProgressStore((s) => s.quizHistory);
  const progressHydrated = usePersistHydrated(useProgressStore.persist);

  useEffect(() => {
    if (!progressHydrated) return;
    recordActivity();
  }, [progressHydrated, recordActivity]);

  const level = getLevel();
  const nextLesson = getNextLesson(completedLessons);
  const beginnerChallenge = getBeginnerChallenge(
    completedLessons,
    completedChallenges
  );
  const quantaTip = getProgressQuantaMessage(
    level,
    completedLessons.length,
    streak
  );
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const todayXp = dailyXp[todayKey] ?? 0;
  const reviewStats = getReviewStats(
    quizHistory,
    LESSONS,
    completedLessons,
    todayIso()
  );

  if (!progressHydrated) {
    return (
      <div className="page-container max-w-5xl">
        <div className="flex min-h-64 items-center justify-center text-sm text-[var(--color-muted-foreground)]">
          Loading…
        </div>
      </div>
    );
  }

  return (
    <div className="page-container max-w-5xl">
      {completedLessons.length === 0 && totalXp === 0 && (
        <QuantaEmptyState
          className="mb-6"
          variant="learning"
          title="New here? Start with Module 1: Bits vs Qubits"
          description="Take the first lesson to learn the ideas behind every circuit you build."
          actions={[
            {
              label: "Start module 1",
              href: `/learn/${LESSONS[0]?.id ?? "what-is-a-qubit"}`,
              primary: true,
            },
          ]}
        />
      )}
      <Reveal variant="scale" className="mb-8">
        <div className="academy-hero overflow-hidden rounded-2xl border border-[var(--color-border)] p-6 sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <div className="relative shrink-0 self-center sm:self-auto">
              <QuantaImage variant={levelQuantaVariant(level)} size="lg" priority />
            </div>
            <div className="flex-1">
              <p className="qci-section-eyebrow mb-1">Quantum Academy</p>
              <h1 className="page-title mt-1 text-3xl">Learn Quantum Circuits</h1>
              <p className="mt-2 text-sm font-semibold text-[var(--color-brand)]">
                Level {level} · {getLevelTitle(level)}
              </p>
              <div className="mt-3 max-w-sm">
                <div className="mb-1 flex justify-between text-xs text-[var(--color-muted-foreground)]">
                  <span>Daily goal</span><span>{Math.min(todayXp, DAILY_GOAL_XP)}/{DAILY_GOAL_XP} XP</span>
                </div>
                <div className="academy-progress-bar h-2 overflow-hidden rounded-full">
                  <div className="academy-progress-fill h-full rounded-full" style={{ width: `${Math.min(100, todayXp / DAILY_GOAL_XP * 100)}%` }} />
                </div>
              </div>
              <p className="page-description mt-2 max-w-xl">
                A guided QCI learning track — academic and research-focused, with
                Quanta as your guide.
              </p>
              <PageActions
                className="mt-4"
                primary={
                  nextLesson
                    ? [
                        {
                          label: `Continue: ${nextLesson.title}`,
                          href: `/learn/${nextLesson.id}`,
                        },
                      ]
                    : [{ label: "Review lessons", href: "/learn/what-is-a-qubit" }]
                }
                secondary={[
                  {
                    label: "Build mode",
                    href: "/editor",
                    icon: <PenLine className="h-4 w-4" />,
                  },
                  {
                    label: "Progress",
                    href: "/progress",
                    icon: <BarChart3 className="h-4 w-4" />,
                  },
                ]}
              />
            </div>
          </div>
        </div>
      </Reveal>

      <Reveal className="mb-6">
        <QuantaCard
          variant="learning"
          title="Hi, I’m Quanta"
          description={quantaMessages.welcome}
          imageSize="sm"
        />
      </Reveal>

      <ProgressHydrationGate>
        {nextLesson && (
          <Reveal className="mb-6">
            <NextStepCard
              badge="Next recommended lesson"
              title={nextLesson.title}
              description={`${nextLesson.description.replace(/\.$/, "")} · ~${nextLesson.estimatedMinutes} min · +${nextLesson.xpReward} XP`}
              href={`/learn/${nextLesson.id}`}
              ctaLabel="Start lesson"
              secondaryHref="/challenges"
              secondaryLabel="Browse challenges"
            />
          </Reveal>
        )}

        <Reveal className="mb-6">
          <NextStepCard
            badge="Spaced learning"
            title={`Review due: ${reviewStats.due}`}
            description={
              reviewStats.due > 0
                ? "Revisit a few quiz questions to keep your quantum intuition sharp."
                : "No questions are due right now. Quanta will queue more for you."
            }
            href="/review"
            ctaLabel="Open review"
          />
        </Reveal>

        <Reveal className="mb-6">
          <ContinueWhereYouLeftOff
            showProject={false}
            showLesson={false}
            showChallenge={false}
          />
        </Reveal>

        {beginnerChallenge && (
          <Reveal className="mb-6" delay={60}>
            <NextStepCard
              badge="Recommended Challenge"
              title={beginnerChallenge.title}
              description={beginnerChallenge.description}
              href={`/challenges/${beginnerChallenge.id}`}
              ctaLabel="Start Challenge"
              secondaryActions={[
                { href: "/challenges", label: "All challenges" },
                { href: "/achievements", label: "View achievements" },
              ]}
            />
          </Reveal>
        )}

        <Reveal as="section" className="mb-8">
          <p className="qci-section-eyebrow">Build mode practice</p>
          <h2 className="mb-4 text-xl font-semibold text-[var(--color-foreground)]">
            Guided walkthroughs
          </h2>
          <div className="grid gap-4 lg:grid-cols-2">
            <NextStepCard
              badge="Walkthrough 1"
              title="Bell-state entanglement"
              description="Step through H and CX to see how entanglement appears in the state."
              href="/editor?walkthrough=bell"
              ctaLabel="Open walkthrough"
            />
            <NextStepCard
              badge="Walkthrough 2"
              title="Why phase matters"
              description="Use HZH to see a phase change become visible through interference."
              href="/editor?walkthrough=hzh"
              ctaLabel="Open walkthrough"
            />
          </div>
        </Reveal>

        <Reveal className="mb-8">
          <QuantaMessage
            title="Quanta"
            message={
              nextLesson
                ? `Start with “${nextLesson.title}.” ${quantaTip}`
                : quantaTip
            }
            imageVariant="researcher"
          />
        </Reveal>

        <Reveal as="section" className="mb-8">
          <p className="qci-section-eyebrow">Your progress</p>
          <h2 className="mb-4 text-xl font-semibold text-[var(--color-foreground)]">
            Track the learning path
          </h2>
          <ProgressSummary />
          <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
            Level {level} · {totalXp} XP total
          </p>
          <PageActions
            className="mt-4"
            secondary={[
              {
                label: "View progress",
                href: "/progress",
                icon: <BarChart3 className="h-4 w-4" />,
              },
              {
                label: "Achievements",
                href: "/achievements",
                icon: <Award className="h-4 w-4" />,
              },
              {
                label: "Challenges",
                href: "/challenges",
                icon: <Swords className="h-4 w-4" />,
              },
            ]}
          />
        </Reveal>

        <Reveal as="section">
          <p className="qci-section-eyebrow">Curriculum</p>
          <h2 className="mb-4 text-xl font-semibold text-[var(--color-foreground)]">
            Lesson path
          </h2>
          <LessonPath />
        </Reveal>
      </ProgressHydrationGate>
    </div>
  );
}
