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
}

const difficultyColors = {
  beginner: "bg-[var(--color-success-subtle)] text-[var(--color-success-foreground)]",
  intermediate: "bg-[var(--color-brand-subtle)] text-[var(--color-brand)]",
  advanced: "bg-[var(--color-warning-subtle)] text-[var(--color-warning)]",
};

export function LessonCard({ lesson, unlocked, completed }: LessonCardProps) {
  return (
    <div
      className={cn(
        "academy-card relative flex flex-col rounded-xl border p-4 transition-all",
        unlocked
          ? "border-[var(--color-border)] hover:border-[var(--color-brand-border)]"
          : "border-[var(--color-border)]/50 opacity-60",
        completed && "academy-card-complete"
      )}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-medium capitalize",
              difficultyColors[lesson.difficulty]
            )}
          >
            {lesson.difficulty}
          </span>
          <span className="flex items-center gap-1 rounded-full bg-[var(--color-secondary)] px-2 py-0.5 text-[10px] text-[var(--color-muted-foreground)]">
            <Clock className="h-3 w-3" />
            {lesson.estimatedMinutes} min
          </span>
        </div>
        {completed ? (
          <CheckCircle2 className="h-4 w-4 shrink-0 text-[var(--color-success)]" />
        ) : !unlocked ? (
          <Lock className="h-4 w-4 shrink-0 text-[var(--color-muted-foreground)]" />
        ) : null}
      </div>

      <h3 className="text-sm font-semibold text-[var(--color-foreground)]">
        {lesson.title}
      </h3>
      <p className="mt-1 flex-1 text-xs leading-relaxed text-[var(--color-muted-foreground)]">
        {lesson.description}
      </p>

      <div className="mt-3 flex items-center justify-between">
        <span className="academy-xp-pill flex items-center gap-1 text-[10px] font-semibold">
          <Zap className="h-3 w-3" />
          +{lesson.xpReward} XP
        </span>
        {unlocked ? (
          <Button asChild size="sm" variant={completed ? "outline" : "default"} className="h-7 text-xs">
            <Link href={`/learn/${lesson.id}`}>
              {completed ? "Review" : "Start"}
            </Link>
          </Button>
        ) : (
          <span className="text-[10px] text-[var(--color-muted-foreground)]">Locked</span>
        )}
      </div>
    </div>
  );
}
