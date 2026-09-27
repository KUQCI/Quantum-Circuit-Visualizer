"use client";

import { Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LearningPlayer } from "@/components/learning/LearningPlayer";
import { Breadcrumbs } from "@/components/navigation/Breadcrumbs";
import { generateSandboxChallenge, todaySandboxSeed } from "@/lib/learning/sandbox";
import { getChallengeBreadcrumbs } from "@/lib/navigation/flow";
import { RefreshCw } from "lucide-react";

function SandboxChallenge() {
  const params = useSearchParams();
  const router = useRouter();
  const seed = useMemo(() => {
    const parsed = Number(params.get("seed"));
    return Number.isFinite(parsed) ? Math.trunc(parsed) : todaySandboxSeed();
  }, [params]);
  const challenge = useMemo(() => generateSandboxChallenge(seed), [seed]);

  return (
    <div className="learning-workspace-shell">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <Breadcrumbs
          items={getChallengeBreadcrumbs(challenge)}
          className="shrink-0 px-0.5"
        />
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => router.push(`/challenges/sandbox?seed=${seed + 1}`)}
          >
            <RefreshCw className="h-4 w-4" /> New challenge
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/challenges/sandbox?seed=${todaySandboxSeed()}`)}
          >
            Today&apos;s sandbox
          </Button>
        </div>
      </div>
      <LearningPlayer
        activity={challenge}
        mode="challenge"
        backHref="/challenges"
      />
    </div>
  );
}

export default function SandboxPage() {
  return (
    <Suspense
      fallback={
        <div className="learning-workspace-shell flex min-h-0 flex-1 items-center justify-center p-8 text-sm text-[var(--color-muted-foreground)]">
          Loading sandbox…
        </div>
      }
    >
      <SandboxChallenge />
    </Suspense>
  );
}
