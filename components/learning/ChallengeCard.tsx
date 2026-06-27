"use client";

import Link from "next/link";
import { Lock, CheckCircle2, Zap } from "lucide-react";
import type { ChallengeDefinition } from "@/lib/learning/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ChallengeCardProps {
  challenge: ChallengeDefinition;
  unlocked: boolean;
  completed: boolean;
}

const difficultyColors = {
  beginner: "bg-[var(--color-success-subtle)] text-[var(--color-success-foreground)]",
  intermediate: "bg-[var(--color-brand-subtle)] text-[var(--color-brand)]",
  advanced: "bg-[var(--color-warning-subtle)] text-[var(--color-warning)]",
};

export function ChallengeCard({ challenge, unlocked, completed }: ChallengeCardProps) {
  return (
    <div
      className={cn(
        "academy-card rounded-xl border p-4 transition-all",
        unlocked
          ? "border-[var(--color-border)] hover:border-[var(--color-brand-border)]"
          : "opacity-60",
        completed && "academy-card-complete"
      )}
    >
      <div className="mb-2 flex items-center justify-between">
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-medium capitalize",
            difficultyColors[challenge.difficulty]
          )}
        >
          {challenge.difficulty}
        </span>
        {completed ? (
          <CheckCircle2 className="h-4 w-4 text-[var(--color-success)]" />
        ) : !unlocked ? (
          <Lock className="h-4 w-4 text-[var(--color-muted-foreground)]" />
        ) : null}
      </div>
      <h3 className="text-sm font-semibold">{challenge.title}</h3>
      <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
        {challenge.description}
      </p>
      <div className="mt-3 flex items-center justify-between">
        <span className="academy-xp-pill flex items-center gap-1 text-[10px] font-semibold">
          <Zap className="h-3 w-3" />+{challenge.xpReward} XP
        </span>
        {unlocked ? (
          <Button asChild size="sm" className="h-7 text-xs">
            <Link href={`/challenges/${challenge.id}`}>
              {completed ? "Replay" : "Start Challenge"}
            </Link>
          </Button>
        ) : (
          <span className="text-[10px] text-[var(--color-muted-foreground)]">Locked</span>
        )}
      </div>
    </div>
  );
}
