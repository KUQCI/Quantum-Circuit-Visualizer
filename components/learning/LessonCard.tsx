"use client";

import Link from "next/link";
import { Lock, CheckCircle2, Clock, Zap } from "lucide-react";
import type { LessonDefinition } from "@/lib/learning/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface LessonCardProps {
  lesson: LessonDefinition;
  unlocked: boolean;
  completed: boolean;
  lockedReason?: string;
  recommended?: boolean;
}

const difficultyColors = {
  beginner: "bg-[var(--color-success-subtle)] text-[var(--color-success-foreground)]",
  intermediate: "bg-[var(--color-brand-subtle)] text-[var(--color-brand)]",
  advanced: "bg-[var(--color-warning-subtle)] text-[var(--color-warning)]",
};

export function LessonCard({
  lesson,
  unlocked,
  completed,
  lockedReason,
  recommended,
}: LessonCardProps) {
  return (
    <div
      className={cn(
        "academy-card relative flex h-full flex-col rounded-xl border p-4 transition-all",
        unlocked
          ? "border-[var(--color-border)] hover:border-[var(--color-brand-border)]"
          : "border-[var(--color-border)] bg-[var(--color-muted)]/25 opacity-95",
        completed && "academy-card-complete",
        recommended && "ring-1 ring-[var(--color-brand)]/50"
      )}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {recommended && (
            <span className="rounded-md bg-[var(--color-brand-subtle)] px-2 py-0.5 text-xs font-medium text-[var(--color-brand)]">
              Next
            </span>
          )}
          <span
            className={cn(
              "rounded-md px-2 py-0.5 text-xs font-medium capitalize",
              difficultyColors[lesson.difficulty]
            )}
          >
            {lesson.difficulty}
          </span>
          <span className="flex items-center gap-1 rounded-md bg-[var(--color-secondary)] px-2 py-0.5 text-xs text-[var(--color-muted-foreground)]">
            <Clock className="h-3 w-3" aria-hidden />
            {lesson.estimatedMinutes} min
          </span>
        </div>
        {completed ? (
          <CheckCircle2
            className="h-4 w-4 shrink-0 text-[var(--color-success)]"
            aria-label="Completed"
          />
        ) : !unlocked ? (
          <Lock
            className="h-4 w-4 shrink-0 text-[var(--color-muted-foreground)]"
            aria-label="Locked"
          />
        ) : null}
      </div>

      <h3 className="text-sm font-semibold text-[var(--color-foreground)]">
        {lesson.title}
      </h3>
      <p className="mt-1 flex-1 text-sm leading-relaxed text-[var(--color-muted-foreground)]">
        {lesson.description}
      </p>
      {!unlocked && lockedReason && (
        <p className="mt-2 text-xs text-[var(--color-warning)]">
          Locked: {lockedReason}
        </p>
      )}

      <div className="mt-3 flex items-center justify-between">
        <span className="academy-xp-pill flex items-center gap-1 text-xs font-semibold">
          <Zap className="h-3 w-3" aria-hidden />
          +{lesson.xpReward} XP
        </span>
        {unlocked ? (
          <Button
            asChild
            size="sm"
            variant={completed ? "outline" : "default"}
            className="h-8 text-xs"
          >
            <Link href={`/learn/${lesson.id}`}>
              {completed ? "Review" : recommended ? "Continue" : "Start"}
            </Link>
          </Button>
        ) : (
          <span className="text-xs text-[var(--color-muted-foreground)]">Locked</span>
        )}
      </div>
    </div>
  );
}
