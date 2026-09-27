"use client";

import { useEffect } from "react";
import { QuantaMessage } from "@/components/mascot/QuantaMessage";
import { QuantaImage } from "@/components/mascot/QuantaImage";
import { ProgressSummary } from "@/components/learning/ProgressSummary";
import { ProgressBackupCard } from "@/components/learning/ProgressBackupCard";
import { NextStepCard } from "@/components/navigation/NextStepCard";
import { PageActions } from "@/components/navigation/PageActions";
import { LESSONS } from "@/lib/learning/lessons";
import { CHALLENGES } from "@/lib/learning/challenges";
import { DAILY_GOAL_XP, getLevelTitle, MODULE_LABELS, MODULE_IDS, xpForNextLevel } from "@/lib/learning/progress";
import { getNextChallenge, getNextLesson } from "@/lib/navigation/flow";
import { getProgressQuantaMessage } from "@/lib/mascot/messages";
import { useProgressStore } from "@/store/progress-store";
import { Award, Flame, Swords } from "lucide-react";
import { pluralize } from "@/lib/utils";
import { usePersistHydrated } from "@/lib/use-persist-hydrated";

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
          ]}
        />
      </div>

      <ProgressSummary />
      <div className="my-4 rounded-xl border border-[var(--color-border)] p-3 text-sm">
        <p className="font-semibold">Level {level} · {getLevelTitle(level)}</p>
        <p className="mt-1 text-[var(--color-muted-foreground)]">
          Daily goal: {Math.min(dailyXp[todayKey] ?? 0, DAILY_GOAL_XP)}/{DAILY_GOAL_XP} XP
        </p>
        <p className="mt-1 text-[var(--color-muted-foreground)]">
          <Flame className="mr-1 inline h-4 w-4 text-[var(--color-brand)]" aria-hidden />
          Current streak: {pluralize(currentStreak, "day")}
        </p>
      </div>

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

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">
          Module Progress
        </h2>
        <div className="space-y-3">
          {MODULE_IDS.map((mod) => {
            const total = LESSONS.filter((l) => l.module === mod).length;
            const done = LESSONS.filter(
              (l) => l.module === mod && completedLessons.includes(l.id)
            ).length;
            const pct = total > 0 ? (done / total) * 100 : 0;
            return (
              <div key={mod} className="rounded-xl border border-[var(--color-border)] p-3">
                <div className="mb-1 flex justify-between text-xs">
                  <span className="font-medium">{MODULE_LABELS[mod]}</span>
                  <span
                    className={
                      done === total && total > 0
                        ? "rounded-full bg-[var(--color-success-subtle)] px-2 py-0.5 text-[var(--color-success-foreground)]"
                        : "text-[var(--color-muted-foreground)]"
                    }
                  >
                    {done === total && total > 0 ? "✓ Complete" : `${done}/${total} complete`}
                  </span>
                </div>
                <div className="academy-progress-bar h-1.5 overflow-hidden rounded-full">
                  <div
                    className="academy-progress-fill h-full rounded-full"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mb-8">
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
