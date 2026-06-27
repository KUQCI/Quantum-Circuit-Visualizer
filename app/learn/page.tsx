"use client";

import { useEffect } from "react";
import Link from "next/link";
import { QuantaDuck } from "@/components/mascot/QuantaDuck";
import { QuantaMessage } from "@/components/mascot/QuantaMessage";
import { LessonPath } from "@/components/learning/LessonPath";
import { ProgressSummary } from "@/components/learning/ProgressSummary";
import { quantaMessages } from "@/lib/mascot/messages";
import { useProgressStore } from "@/store/progress-store";
import { Button } from "@/components/ui/button";
import { PenLine } from "lucide-react";

export default function LearnPage() {
  const recordActivity = useProgressStore((s) => s.recordActivity);

  useEffect(() => {
    recordActivity();
  }, [recordActivity]);

  return (
    <div className="page-container max-w-5xl">
      <div className="academy-hero mb-8 rounded-2xl border border-[var(--color-border)] p-6 sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <QuantaDuck size={72} animated />
          <div className="flex-1">
            <p className="text-xs font-medium uppercase tracking-widest text-[var(--color-brand)]">
              Quantum Academy
            </p>
            <h1 className="page-title mt-1 text-3xl">Learn Quantum Circuits</h1>
            <p className="page-description mt-2">
              Learn quantum circuits through interactive challenges
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button asChild size="sm">
                <Link href="/learn/what-is-a-qubit">Start Lesson 1</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/editor">
                  <PenLine className="h-3.5 w-3.5" />
                  Build Mode
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <QuantaMessage
        title="Welcome to Quantum Academy"
        message={quantaMessages.welcome}
        className="mb-8"
      />

      <section className="mb-8">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">
          Your Progress
        </h2>
        <ProgressSummary />
      </section>

      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">
          Learning Path
        </h2>
        <LessonPath />
      </section>
    </div>
  );
}
