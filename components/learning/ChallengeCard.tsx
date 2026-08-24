"use client";

import Link from "next/link";
import { Lock, CheckCircle2, Zap, Clock } from "lucide-react";
import type { ChallengeDefinition } from "@/lib/learning/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ChallengeCardProps {
  challenge: ChallengeDefinition;
  unlocked: boolean;
  completed: boolean;
  lockedReason?: string;
}

const difficultyColors = {
  beginner: "bg-[var(--color-success-subtle)] text-[var(--color-success-foreground)]",
  intermediate: "bg-[var(--color-brand-subtle)] text-[var(--color-brand)]",
  advanced: "bg-[var(--color-warning-subtle)] text-[var(--color-warning)]",
};

export function ChallengeCard({
  challenge,
  unlocked,
  completed,
  lockedReason,
}: ChallengeCardProps) {
  return (
    <div
      className={cn(
        "academy-card flex h-full flex-col rounded-xl border p-4 transition-all",
        unlocked
          ? "border-[var(--color-border)] hover:border-[var(--color-brand-border)]"
          : "border-[var(--color-border)] bg-[var(--color-muted)]/30 opacity-90",
        completed && "academy-card-complete"
      )}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          <span
            className={cn(
              "rounded-md px-2 py-0.5 text-xs font-medium capitalize",
              difficultyColors[challenge.difficulty]
            )}
          >
            {challenge.difficulty}
          </span>
          <span className="flex items-center gap-1 rounded-md bg-[var(--color-secondary)] px-2 py-0.5 text-xs text-[var(--color-muted-foreground)]">
            <Clock className="h-3 w-3" aria-hidden />
            {challenge.estimatedMinutes} min
          </span>
        </div>
        {completed ? (
          <CheckCircle2 className="h-4 w-4 text-[var(--color-success)]" aria-label="Completed" />
        ) : !unlocked ? (
          <Lock className="h-4 w-4 text-[var(--color-muted-foreground)]" aria-label="Locked" />
        ) : null}
      </div>
      <h3 className="text-sm font-semibold text-[var(--color-foreground)]">
        {challenge.title}
      </h3>
      <p className="mt-1 text-sm leading-relaxed text-[var(--color-muted-foreground)]">
        {challenge.description}
      </p>
      <p className="mt-2 text-xs leading-relaxed text-[var(--color-foreground)]/80">
        <span className="font-medium text-[var(--color-brand)]">Success: </span>
        {challenge.successCriteria}
      </p>
      {!unlocked && lockedReason && (
        <p className="mt-2 text-xs leading-relaxed text-[var(--color-warning)]">
          Locked: {lockedReason}
        </p>
      )}
      <div className="mt-auto flex items-center justify-between pt-3">
        <span className="academy-xp-pill flex items-center gap-1 text-xs font-semibold">
          <Zap className="h-3 w-3" aria-hidden />+{challenge.xpReward} XP
        </span>
        {unlocked ? (
          <Button asChild size="sm" className="h-8 text-xs">
            <Link href={`/challenges/${challenge.id}`}>
              {completed ? "Replay" : "Start Challenge"}
            </Link>
          </Button>
        ) : (
          <span className="text-xs text-[var(--color-muted-foreground)]">Locked</span>
        )}
      </div>
    </div>
  );
}
