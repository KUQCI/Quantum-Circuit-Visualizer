"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QuantaPopout } from "@/components/mascot/QuantaPopout";
import { LESSONS } from "@/lib/learning/lessons";
import {
  getDueReviewQuestions,
  getNextReviewDate,
  getReviewStats,
  type ReviewQuestion,
} from "@/lib/learning/quiz-review";
import { todayIso, useProgressStore } from "@/store/progress-store";
import { useQuantaPopoutStore } from "@/store/quanta-popout-store";
import { usePersistHydrated } from "@/lib/use-persist-hydrated";

export function QuizReviewSession() {
  const history = useProgressStore((state) => state.quizHistory);
  const completedLessons = useProgressStore((state) => state.completedLessons);
  const awardXp = useProgressStore((state) => state.awardXp);
  const recordQuizAnswer = useProgressStore((state) => state.recordQuizAnswer);
  const progressHydrated = usePersistHydrated(useProgressStore.persist);
  const say = useQuantaPopoutStore((state) => state.say);
  const dismiss = useQuantaPopoutStore((state) => state.dismiss);
  const today = useMemo(() => todayIso(), []);
  const stats = getReviewStats(history, LESSONS, completedLessons, today);
  const nextDue = getNextReviewDate(history, LESSONS, completedLessons, today);
  const [questions, setQuestions] = useState<ReviewQuestion[] | null>(null);
  const [index, setIndex] = useState(0);
  const [choice, setChoice] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [correct, setCorrect] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  useEffect(() => {
    if (!progressHydrated || questions) return;
    setQuestions(getDueReviewQuestions(history, LESSONS, completedLessons, today));
  }, [completedLessons, history, progressHydrated, questions, today]);

  useEffect(() => {
    return () => dismiss();
  }, [dismiss]);

  if (!progressHydrated || !questions) {
    return (
      <div className="page-container max-w-4xl">
        <div className="flex min-h-64 items-center justify-center text-sm text-[var(--color-muted-foreground)]">
          Loading review…
        </div>
      </div>
    );
  }

  const current = questions[index];
  const finished = index >= questions.length;

  const handleCheck = () => {
    if (!current || checked || choice === null) return;
    const isCorrect = choice === current.answerIndex;
    setCorrect(isCorrect);
    setChecked(true);
    recordQuizAnswer(current.lessonId, current.id, isCorrect);
    if (isCorrect) {
      setCorrectCount((count) => count + 1);
      awardXp(5, "Quiz review");
      say({
        text: current.explanation,
        title: "Correct",
        variant: "success",
        imageVariant: "success",
      });
    } else {
      say({
        text: current.explanation,
        title: "Keep exploring",
        variant: "error",
        imageVariant: "thinking",
      });
    }
  };

  const handleNext = () => {
    setIndex((value) => value + 1);
    setChoice(null);
    setChecked(false);
    setCorrect(false);
    dismiss();
  };

  return (
    <div className="page-container max-w-4xl">
      <QuantaPopout />
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="qci-section-eyebrow">Spaced review</p>
          <h1 className="page-title text-3xl">Quiz review</h1>
          <p className="page-description">
            Keep the ideas fresh with a few questions from lessons you have
            completed.
          </p>
        </div>
        <div className="flex gap-3 text-sm">
          <span className="rounded-full border border-[var(--color-border)] px-3 py-1">
            Due: <strong>{stats.due}</strong>
          </span>
          <span className="rounded-full border border-[var(--color-border)] px-3 py-1">
            Learned: <strong>{stats.learned}</strong>
          </span>
          <span className="rounded-full border border-[var(--color-border)] px-3 py-1">
            Total: <strong>{stats.total}</strong>
          </span>
        </div>
      </div>

      {questions.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>All caught up</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>Quanta says: all caught up — come back tomorrow</p>
            {nextDue && (
              <p className="text-[var(--color-muted-foreground)]">
                Next review due {nextDue}.
              </p>
            )}
          </CardContent>
        </Card>
      ) : finished ? (
        <Card>
          <CardHeader>
            <CardTitle>Review complete</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-[var(--color-muted-foreground)]">
              You answered {correctCount} of {questions.length} questions
              correctly and earned {correctCount * 5} XP.
            </p>
            <Button asChild variant="secondary">
              <Link href="/learn">
                Back to Learn <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle>{current.lessonTitle}</CardTitle>
              <span className="text-xs text-[var(--color-muted-foreground)]">
                Question {index + 1} of {questions.length}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <p className="text-lg font-medium">{current.question}</p>
            <div className="grid gap-2">
              {current.options.map((option, optionIndex) => (
                <button
                  key={option}
                  type="button"
                  disabled={checked}
                  aria-pressed={choice === optionIndex}
                  onClick={() => setChoice(optionIndex)}
                  className={`rounded-xl border px-4 py-3 text-left text-sm transition ${
                    choice === optionIndex
                      ? "border-[var(--color-brand)] bg-[var(--color-brand-subtle)]"
                      : "border-[var(--color-border)] hover:border-[var(--color-brand)]"
                  } disabled:cursor-default`}
                >
                  {option}
                </button>
              ))}
            </div>
            {checked && (
              <div
                className={`rounded-xl border p-4 text-sm ${
                  correct
                    ? "border-[var(--color-success)] bg-[var(--color-success-subtle)]"
                    : "border-[var(--color-destructive)] bg-[var(--color-destructive-subtle)]"
                }`}
              >
                <p className="font-semibold">
                  {correct ? "Correct!" : "Not quite."}
                </p>
                <p className="mt-1 text-[var(--color-muted-foreground)]">
                  {current.explanation}
                </p>
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {!checked ? (
                <Button onClick={handleCheck} disabled={choice === null}>
                  <Check className="h-4 w-4" /> Check
                </Button>
              ) : (
                <Button onClick={handleNext}>
                  {index + 1 === questions.length ? "Finish" : "Next"}{" "}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}
              {checked && !correct && (
                <Button variant="ghost" onClick={handleNext}>
                  <RotateCcw className="h-4 w-4" /> Continue
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
