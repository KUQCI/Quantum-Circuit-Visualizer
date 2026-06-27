"use client";

import { useEffect } from "react";
import { QuantaMessage } from "@/components/mascot/QuantaMessage";
import { ProgressSummary } from "@/components/learning/ProgressSummary";
import { LESSONS } from "@/lib/learning/lessons";
import { CHALLENGES } from "@/lib/learning/challenges";
import { MODULE_LABELS, MODULE_IDS, xpForNextLevel } from "@/lib/learning/progress";
import { getProgressQuantaMessage } from "@/lib/mascot/messages";
import { useProgressStore } from "@/store/progress-store";

const SKILL_LABELS: Record<string, string> = {
  qubits: "Qubits",
  gates: "Gates",
  measurement: "Measurement",
  entanglement: "Entanglement",
  qiskit: "Qiskit Syntax",
};

export default function ProgressPage() {
  const totalXp = useProgressStore((s) => s.totalXp);
  const completedLessons = useProgressStore((s) => s.completedLessons);
  const completedChallenges = useProgressStore((s) => s.completedChallenges);
  const skillXp = useProgressStore((s) => s.skillXp);
  const currentStreak = useProgressStore((s) => s.currentStreak);
  const getLevel = useProgressStore((s) => s.getLevel);
  const recordActivity = useProgressStore((s) => s.recordActivity);

  useEffect(() => {
    recordActivity();
  }, [recordActivity]);

  const level = getLevel();
  const quantaMsg = getProgressQuantaMessage(
    level,
    completedLessons.length,
    currentStreak
  );

  return (
    <div className="page-container max-w-4xl">
      <div className="page-header mb-6">
        <h1 className="page-title text-3xl">Progress</h1>
        <p className="page-description">Your Quantum Academy journey</p>
      </div>

      <ProgressSummary />

      <QuantaMessage title="Quanta" message={quantaMsg} className="my-6" />

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
                  <span className="text-[var(--color-muted-foreground)]">
                    {done}/{total}
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
