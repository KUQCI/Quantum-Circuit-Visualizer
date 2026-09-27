"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { QuantaMessage } from "@/components/mascot/QuantaMessage";
import { QuantaImage } from "@/components/mascot/QuantaImage";
import { ProgressSummary } from "@/components/learning/ProgressSummary";
import { ProgressBackupCard } from "@/components/learning/ProgressBackupCard";
import { NextStepCard } from "@/components/navigation/NextStepCard";
import { PageActions } from "@/components/navigation/PageActions";
import { LESSONS } from "@/lib/learning/lessons";
import { CHALLENGES } from "@/lib/learning/challenges";
import { DAILY_GOAL_XP, getLevelTitle, xpForNextLevel } from "@/lib/learning/progress";
import {
  getLevelProjection,
  getModuleMastery,
  getWeakestTopics,
} from "@/lib/learning/analytics";
import { getNextChallenge, getNextLesson } from "@/lib/navigation/flow";
import { getProgressQuantaMessage } from "@/lib/mascot/messages";
import { useProgressStore } from "@/store/progress-store";
import { Award, Flame, Swords, RotateCcw } from "lucide-react";
import { pluralize } from "@/lib/utils";
import { usePersistHydrated } from "@/lib/use-persist-hydrated";
import { QuantaEmptyState } from "@/components/mascot/QuantaEmptyState";

const SKILL_LABELS: Record<string, string> = {
  qubits: "Qubits",
  gates: "Gates",
  measurement: "Measurement",
  entanglement: "Entanglement",
  qiskit: "Qiskit Syntax",
  algorithms: "Algorithms",
  phase: "Phase",
};

export default function ProgressPage() {
  const totalXp = useProgressStore((s) => s.totalXp);
  const completedLessons = useProgressStore((s) => s.completedLessons);
  const completedChallenges = useProgressStore((s) => s.completedChallenges);
  const skillXp = useProgressStore((s) => s.skillXp);
  const currentStreak = useProgressStore((s) => s.currentStreak);
  const getLevel = useProgressStore((s) => s.getLevel);
  const recordActivity = useProgressStore((s) => s.recordActivity);
  const dailyXp = useProgressStore((s) => s.dailyXp);
  const quizHistory = useProgressStore((s) => s.quizHistory);
  const progressHydrated = usePersistHydrated(useProgressStore.persist);

  useEffect(() => {
    if (!progressHydrated) return;
    recordActivity();
  }, [progressHydrated, recordActivity]);

  const level = getLevel();
  const quantaMsg = getProgressQuantaMessage(
    level,
    completedLessons.length,
    currentStreak
  );
  const nextLesson = getNextLesson(completedLessons);
  const nextChallenge = getNextChallenge(completedLessons, completedChallenges);
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const moduleMastery = useMemo(
    () => getModuleMastery(LESSONS, completedLessons, quizHistory),
    [completedLessons, quizHistory]
  );
  const weakestTopics = useMemo(
    () => getWeakestTopics(LESSONS, quizHistory),
    [quizHistory]
  );
  const levelProjection = useMemo(
    () => getLevelProjection(totalXp, dailyXp),
    [dailyXp, totalXp]
  );

  if (!progressHydrated) {
    return (
      <div className="page-container max-w-4xl">
        <div className="flex min-h-64 items-center justify-center text-sm text-[var(--color-muted-foreground)]">
          Loading…
        </div>
      </div>
    );
  }

  return (
    <div className="page-container max-w-4xl">
      <div className="page-header mb-6">
        <div className="flex items-start gap-4">
          <QuantaImage
            variant="didYouCode"
            size="sm"
            className="hidden shrink-0 sm:block"
          />
          <div>
            <h1 className="page-title text-3xl">Progress</h1>
            <p className="page-description">Your Quantum Academy journey</p>
          </div>
        </div>
        <PageActions
          className="mt-4"
          secondary={[
            { label: "Achievements", href: "/achievements", icon: <Award className="h-4 w-4" /> },
            { label: "Challenges", href: "/challenges", icon: <Swords className="h-4 w-4" /> },
            { label: "Quiz Review", href: "/review", icon: <RotateCcw className="h-4 w-4" /> },
          ]}
        />
      </div>

      {completedLessons.length === 0 && totalXp === 0 ? (
        <QuantaEmptyState
          className="my-6"
          variant="learning"
          title="No progress yet — finish your first lesson to earn XP"
          description="Start learning or restore progress from a backup whenever you are ready."
          actions={[
            {
              label: "Start learning",
              href: `/learn/${LESSONS[0]?.id ?? "what-is-a-qubit"}`,
              primary: true,
            },
            {
              label: "Import a backup",
              onClick: () =>
                document
                  .getElementById("progress-backup")
                  ?.scrollIntoView({ behavior: "smooth", block: "start" }),
            },
          ]}
        />
      ) : (
        <ProgressSummary />
      )}
      <div className="my-4 rounded-xl border border-[var(--color-border)] p-3 text-sm">
        <p className="font-semibold">Level {level} · {getLevelTitle(level)}</p>
        <p className="mt-1 text-[var(--color-muted-foreground)]">
          Daily goal: {Math.min(dailyXp[todayKey] ?? 0, DAILY_GOAL_XP)}/{DAILY_GOAL_XP} XP
        </p>
        <p className="mt-1 text-[var(--color-muted-foreground)]">
          <Flame className="mr-1 inline h-4 w-4 text-[var(--color-brand)]" aria-hidden />
          Current streak: {pluralize(currentStreak, "day")}
        </p>
        {levelProjection.nextLevel && (
          <p className="mt-1 text-[var(--color-muted-foreground)]">
            ~{levelProjection.xpToNext} XP to Level {levelProjection.nextLevel}
            {levelProjection.estDays !== null &&
              ` · about ${levelProjection.estDays} days at your pace`}
          </p>
        )}
      </div>

      {totalXp > 0 && (
        <section className="mb-8 rounded-xl border border-[var(--color-brand-border)] bg-[var(--color-brand-subtle)] p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold">Work on these</h2>
              <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
                Everyone misses these at first — a quick review fixes it fast.
              </p>
            </div>
            <Link
              href="/review"
              className="shrink-0 text-xs font-semibold text-[var(--color-brand)] hover:underline"
            >
              Review now
            </Link>
          </div>
          {weakestTopics.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {weakestTopics.map((topic) => (
                <li
                  key={`${topic.lessonId}:${topic.questionId}`}
                  className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]/70 px-3 py-2"
                >
                  <p className="text-xs font-medium">{topic.lessonTitle}</p>
                  <p className="mt-0.5 text-xs text-[var(--color-muted-foreground)]">
                    {topic.question}
                  </p>
                  <p className="mt-1 text-[10px] text-[var(--color-muted-foreground)]">
                    {topic.wrong} missed · {topic.correct} correct
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-xs text-[var(--color-muted-foreground)]">
              Keep answering quiz questions to discover your best next review.
            </p>
          )}
        </section>
      )}

      <NextStepCard
        className="my-6"
        badge="Spaced learning"
        title="Quiz review"
        description="Refresh completed lessons with short, scheduled practice."
        href="/review"
        ctaLabel="Review due questions"
      />

      {nextLesson && (
        <NextStepCard
          className="my-6"
          badge="Resume Learning"
          title={nextLesson.title}
          description={nextLesson.description}
          href={`/learn/${nextLesson.id}`}
          ctaLabel="Resume Lesson"
          secondaryHref={
            nextChallenge ? `/challenges/${nextChallenge.id}` : "/challenges"
          }
          secondaryLabel={
            nextChallenge ? "Try a Challenge" : "View Challenges"
          }
        />
      )}

      <QuantaMessage
        title="Quanta"
        message={quantaMsg}
        className="my-6"
        imageVariant={
          currentStreak >= 2
            ? "didYouCode"
            : completedLessons.length >= 3
              ? "coding"
              : "success"
        }
      />

      {totalXp > 0 && (
        <>
          <section className="mb-8">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">
              Mastery by module
            </h2>
            <div className="space-y-3">
              {moduleMastery.map((module) => (
                <div
                  key={module.moduleId}
                  className="rounded-xl border border-[var(--color-border)] p-3"
                >
                  <div className="mb-1 flex items-center justify-between gap-3 text-xs">
                    <span className="font-medium">{module.title}</span>
                    <span className="text-[var(--color-muted-foreground)]">
                      {Math.round(module.mastery * 100)}%
                    </span>
                  </div>
                  <div
                    className="academy-progress-bar mb-1.5 h-1.5 overflow-hidden rounded-full"
                    role="progressbar"
                    aria-label={`${module.title} mastery`}
                    aria-valuenow={Math.round(module.mastery * 100)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <div
                      className="academy-progress-fill h-full rounded-full"
                      style={{ width: `${module.mastery * 100}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-[var(--color-muted-foreground)]">
                    {module.lessonsDone}/{module.lessonsTotal} lessons ·{" "}
                    {module.quizAccuracy === null
                      ? "quiz —"
                      : `quiz ${Math.round(module.quizAccuracy * 100)}%`}
                  </p>
                </div>
              ))}
            </div>
          </section>

        </>
      )}

      <section id="progress-backup" className="mb-8 scroll-mt-20">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">
          Backup
        </h2>
        <ProgressBackupCard />
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">
          Skill Breakdown
        </h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {Object.entries(skillXp).map(([skill, xp]) => (
            <div
              key={skill}
              className="flex items-center justify-between rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm"
            >
              <span>{SKILL_LABELS[skill] ?? skill}</span>
              <span className="academy-xp-pill text-[10px]">{xp} XP</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">
          Stats
        </h2>
        <ul className="space-y-1 text-sm text-[var(--color-muted-foreground)]">
          <li>Lessons completed: {completedLessons.length} / {LESSONS.length}</li>
          <li>Challenges completed: {completedChallenges.length} / {CHALLENGES.length}</li>
          <li>
            Next level:{" "}
            {xpForNextLevel(totalXp).nextLevel
              ? `${xpForNextLevel(totalXp).xpNeeded - xpForNextLevel(totalXp).xpIntoLevel} XP remaining`
              : "Max level reached"}
          </li>
        </ul>
      </section>
    </div>
  );
}
